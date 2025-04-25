import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
});

// Helper function to sanitize file names
const sanitizeFileName = (fileName) => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Failed to get user:", error);
    throw new Error("Authentication required");
  }
};

// Enhanced uploadImage with better error handling
export const uploadImage = async (file, path, bucket = "chatimages", onProgress = null) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("User not authenticated");
    if (!file) throw new Error("No file provided");
    if (!path) throw new Error("No file path provided");

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.");
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File too large. Maximum size is 5MB.");
    }

    const sanitizedFileName = sanitizeFileName(`${Date.now()}_${file.name}`);
    const filePath = `${path}/${sanitizedFileName}`;

    // Progress tracking
    if (onProgress) onProgress(0);

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;
    if (onProgress) onProgress(50);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrl) throw new Error("Failed to generate public URL");
    if (onProgress) onProgress(100);

    return publicUrl;
  } catch (error) {
    console.error("Image upload failed:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Improved listenForChats with better error handling
export const listenForChats = (setChats) => {
  let subscription;

  const initializeSubscription = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return setChats([]);

      // Initial fetch
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .contains("users", [user.id]);

      if (error) throw error;
      setChats(data || []);

      // Realtime subscription
      subscription = supabase
        .channel("chats")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chats",
            filter: `users=cs.{${user.id}}`,
          },
          async (payload) => {
            try {
              if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                const { data: chat, error: fetchError } = await supabase
                  .from("chats")
                  .select("*")
                  .eq("id", payload.new.id)
                  .single();

                if (fetchError) throw fetchError;

                setChats(prev => {
                  const updated = prev.filter(c => c.id !== chat.id);
                  return [...updated, chat].sort(
                    (a, b) => new Date(b.last_message_timestamp || 0) - new Date(a.last_message_timestamp || 0)
                  );
                });
              } else if (payload.eventType === "DELETE") {
                setChats(prev => prev.filter(c => c.id !== payload.old.id));
              }
            } catch (error) {
              console.error("Chat update error:", error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("Chat subscription error:", error);
      setChats([]);
    }
  };

  initializeSubscription();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
};

// Improved sendMessage with better validation
export const sendMessage = async (messageText, chatId, user1, user2, imageUrl = "") => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    if (!chatId) throw new Error("Chat ID required");
    if (!user1 || !user2) throw new Error("User IDs required");

    const lastMessage = imageUrl ? "Image sent" : messageText;

    // Upsert chat
    const { error: chatError } = await supabase
      .from("chats")
      .upsert({
        id: chatId,
        users: [user1, user2],
        last_message: lastMessage,
        last_message_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (chatError) throw chatError;

    // Insert message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        text: messageText || "",
        image_url: imageUrl || "",
        sender_id: user.id,
        timestamp: new Date().toISOString(),
      });

    if (messageError) throw messageError;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw new Error(`Message failed: ${error.message}`);
  }
};

// Optimized listenForMessages
export const listenForMessages = (chatId, callback) => {
  if (!chatId) {
    console.warn("No chatId provided");
    return () => {};
  }

  // Initial fetch
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      callback(data.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      callback([]);
    }
  };

  fetchMessages();

  // Realtime subscription
  const channel = supabase
    .channel(`messages:${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        const message = {
          ...payload.new,
          timestamp: new Date(payload.new.timestamp)
        };

        callback(prev => {
          const current = Array.isArray(prev) ? prev : [];
          
          switch (payload.eventType) {
            case "INSERT":
              return [...current, message].sort((a, b) => a.timestamp - b.timestamp);
            case "UPDATE":
              return current.map(m => m.id === message.id ? message : m)
                .sort((a, b) => a.timestamp - b.timestamp);
            case "DELETE":
              return current.filter(m => m.id !== payload.old.id);
            default:
              return current;
          }
        });
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};

// Improved updateMessage
export const updateMessage = async (chatId, messageId, newText) => {
  try {
    if (!chatId || !messageId || !newText) {
      throw new Error("Missing required parameters");
    }

    // Update message
    const { error } = await supabase
      .from("messages")
      .update({
        text: newText,
        edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;

    // Update chat if this was the latest message
    const { data: latestMessage } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (latestMessage?.id === messageId) {
      await supabase
        .from("chats")
        .update({
          last_message: newText,
          last_message_timestamp: new Date().toISOString(),
        })
        .eq("id", chatId);
    }
  } catch (error) {
    console.error("Failed to update message:", error);
    throw new Error(`Update failed: ${error.message}`);
  }
};

// Improved deleteMessage
export const deleteMessage = async (chatId, messageId) => {
  try {
    if (!chatId || !messageId) {
      throw new Error("Missing required parameters");
    }

    // Delete message
    await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    // Update chat's last message
    const { data: latestMessage } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    await supabase
      .from("chats")
      .update({
        last_message: latestMessage?.text || "",
        last_message_timestamp: latestMessage?.timestamp || null,
      })
      .eq("id", chatId);
  } catch (error) {
    console.error("Failed to delete message:", error);
    throw new Error(`Deletion failed: ${error.message}`);
  }
};

// Auth functions with better error handling
export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Sign in failed:", error);
    throw new Error("Invalid credentials");
  }
};

export const signUpWithEmail = async (email, password, fullName) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Sign up failed:", error);
    throw new Error("Registration failed");
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign out failed:", error);
    throw new Error("Failed to sign out");
  }
};