import { useEffect, useMemo, useRef, useState } from "react";
import { v5 as uuidv5 } from 'uuid';
import defaultAvatar from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formatTimeStamp";
import { RiSendPlaneFill, RiImageAddLine } from "react-icons/ri";
import { supabase, getCurrentUser, listenForMessages, sendMessage, updateMessage, deleteMessage, uploadImage } from "../supabase/supabase";
import logo from "../../public/assets/logo.png";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

const Chatbox = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setError("User not authenticated");
      }
    };
    fetchCurrentUser();
  }, []);

  // Generate chatId using UUID v5
  const chatId = useMemo(() => {
    if (!currentUser?.id || !selectedUser?.id) return null;
    const user1 = currentUser.id;
    const user2 = selectedUser.id;
    const combined = user1 < user2 ? `${user1}-${user2}` : `${user2}-${user1}`;
    return uuidv5(combined, uuidv5.URL);
  }, [currentUser, selectedUser]);

  const user1 = currentUser?.id || null;
  const user2 = selectedUser?.id || null;

  // Listen for messages
  useEffect(() => {
    if (!chatId || !user1 || !user2) {
      setMessages([]);
      return;
    }
  
    console.log("Subscribing to messages for chatId:", chatId);
    const unsubscribe = listenForMessages(chatId, (incomingMessages) => {
      // Ensure we always have an array
      const processedMessages = Array.isArray(incomingMessages) 
        ? incomingMessages 
        : [];
        
      setMessages(processedMessages);
    });
  
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, user1, user2]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sort messages by timestamp
  const sortedMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    
    return [...messages].sort((a, b) => {
      const aTimestamp = a?.timestamp?.getTime() || 0;
      const bTimestamp = b?.timestamp?.getTime() || 0;
      return aTimestamp - bTimestamp;
    });
  }, [messages]);

  // Ensure chat exists before sending messages or images
  const ensureChatExists = async () => {
    if (!chatId || !user1 || !user2) throw new Error("Invalid chat or user IDs");

    const { data: chat, error } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to check chat: ${error.message}`);
    }

    if (!chat) {
      console.log("Creating new chat with ID:", chatId);
      await supabase
        .from("chats")
        .insert({
          id: chatId,
          users: [user1, user2],
          created_at: new Date().toISOString(),
        });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !chatId || !user1 || !user2) {
      setError("Cannot send message: missing chat or user data");
      return;
    }

    try {
      await ensureChatExists();
      await sendMessage(messageText, chatId, user1, user2);
      setMessageText("");
      setError(null);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Failed to send message: ${error.message}`);
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatId || !user1 || !user2) {
      setError("Cannot upload image: missing file, chat, or user data");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      await ensureChatExists();
      const imageUrl = await uploadImage(file, chatId, "chatimages", (progress) => {
        setUploadProgress(progress);
      });
      console.log("Image uploaded, URL:", imageUrl);
      await sendMessage("", chatId, user1, user2, imageUrl);
      fileInputRef.current.value = "";
      toast.success("Image sent successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(`Image upload failed: ${error.message}`);
      toast.error(`Image upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    if (!newText.trim() || !chatId) {
      setError("Cannot edit message: missing text or chat data");
      return;
    }

    try {
      await updateMessage(chatId, messageId, newText);
      setEditingMessageId(null);
      setEditedText("");
      setError(null);
      toast.success("Message updated successfully!");
    } catch (error) {
      console.error("Error editing message:", error);
      setError(`Failed to edit message: ${error.message}`);
      toast.error(`Failed to edit message: ${error.message}`);
    }
  };

  const startEditing = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditedText(currentText);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!chatId) {
      setError("Cannot delete message: missing chat data");
      return;
    }

    try {
      await deleteMessage(chatId, messageId);
      setError(null);
      toast.success("Message deleted successfully!");
    } catch (error) {
      console.error("Error deleting message:", error);
      setError(`Failed to delete message: ${error.message}`);
      toast.error(`Failed to delete message: ${error.message}`);
    }
  };

  if (!selectedUser) {
    return (
      <section className="h-screen w-[100%] bg-[#e5f6f3] background-image">
        <div className="flex flex-col justify-center items-center h-[100vh]">
          <img src={logo} alt="Chatfrik logo" width={100} />
          <h1 className="text-[30px] font-bold text-teal-700 mt-5">Welcome to WhisperWave</h1>
          <p className="text-gray-500">Connect and chat with friends easily, fast and free</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image2">
      <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white">
        <main className="flex items-center gap-3">
          <img 
            src={selectedUser?.image || defaultAvatar} 
            className="object-cover rounded-full cursor-pointer w-11 h-11" 
            alt={`${selectedUser?.full_name || 'User'} profile`}
          />
          <span>
            <h3 className="font-semibold text-[#2A3D39] text-lg">
              {selectedUser?.full_name || "Chatfrik User"}
            </h3>
            <p className="font-light text-[#2A3D39] text-sm">
              @{selectedUser?.username || "chatfrik"}
            </p>
          </span>
        </main>
      </header>

      <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
        <section className="px-3 pt-5 pb-20 lg:pb-10">
          <div ref={scrollRef} className="overflow-auto h-[80vh]">
            {sortedMessages?.map((msg, index) => (
              <div key={`${msg.id}-${index}`}>
                {msg?.sender_id === user1 ? (
                  <div className="flex flex-col items-end w-full">
                    <span className="flex h-auto gap-3 me-10">
                      <div>
                        {editingMessageId === msg.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              className="p-2 border rounded"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMessage(msg.id, editedText)}
                                className="px-2 py-1 text-white bg-green-500 rounded"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-2 py-1 text-white bg-gray-500 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative flex items-center justify-center p-6 text-blue-700 bg-blue-100 rounded-lg shadow-sm group">
                              {msg.image_url ? (
                                <img 
                                  src={msg.image_url} 
                                  alt="Sent Image" 
                                  className="h-auto max-w-[300px] rounded" 
                                />
                              ) : (
                                <h4>{msg.text}</h4>
                              )}
                              <div className="absolute top-0 right-0 flex-col hidden gap-1 p-1 group-hover:flex">
                                {!msg.image_url && (
                                  <button
                                    onClick={() => startEditing(msg.id, msg.text)}
                                    className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="px-2 py-1 text-xs text-white bg-red-500 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 text-right text-gray-400 text-xs">
                              {formatTimestamp(msg?.timestamp)}
                            </p>
                          </>
                        )}
                      </div>
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-start w-full">
                    <span className="flex gap-3 w-[40%] h-auto ms-10">
                      <img 
                        src={selectedUser?.image || defaultAvatar} 
                        className="object-cover rounded-full h-11 w-11" 
                        alt="Sender profile" 
                      />
                      <div>
                        <div className="flex items-center justify-center p-6 text-blue-700 bg-blue-100 rounded-lg shadow-sm">
                          {msg.image_url ? (
                            <img 
                              src={msg.image_url} 
                              alt="Received Image" 
                              className="h-auto max-w-[300px] rounded" 
                            />
                          ) : (
                            <h4>{msg.text}</h4>
                          )}
                        </div>
                        <p className="mt-3 text-gray-400 text-xs">
                          {formatTimestamp(msg?.timestamp)}
                        </p>
                      </div>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="sticky bottom-[100px] mx-3 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {isUploading && (
          <div className="absolute right-0 bottom-[80px] w-[20%] mx-6 p-2 bg-blue-100 text-blue-700 rounded">
            Uploading: {Math.round(uploadProgress)}% complete
          </div>
        )}

        <div className="sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%]">
          <form 
            onSubmit={handleSendMessage} 
            className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg"
          >
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="p-2 text-gray-500 hover:text-gray-700"
              disabled={isUploading || !chatId}
            >
              <RiImageAddLine size={20} />
            </button>
            
            <input 
              value={messageText} 
              onChange={(e) => setMessageText(e.target.value)} 
              className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]" 
              type="text" 
              placeholder="Write your message..." 
              disabled={isUploading || !chatId}
            />
            
            <button 
              type="submit" 
              className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
              disabled={!messageText.trim() || isUploading || !chatId}
            >
              <RiSendPlaneFill color="#01AA85" />
            </button>
          </form>
        </div>
      </main>
    </section>
  );
};

Chatbox.propTypes = {
  selectedUser: PropTypes.object,
};

export default Chatbox;