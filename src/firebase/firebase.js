import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enhanced uploadImage with progress tracking
export const uploadImage = (file, chatId, onProgress = null) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  if (!file) throw new Error("No file provided");
  if (!chatId) throw new Error("No chat ID provided");

  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.");
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error("Error uploading image:", error);
        reject(new Error(`Image upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(storageRef);
          resolve(downloadURL);
        } catch (error) {
          reject(new Error(`Failed to get download URL: ${error.message}`));
        }
      }
    );
  });
};

export const listenForChats = (setChats) => {
  if (!auth.currentUser) {
    setChats([]);
    return () => {};
  }

  const chatsQuery = query(
    collection(db, "chats"),
    where("users", "array-contains", auth.currentUser.uid)
  );

  const unsubscribe = onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatList);
    },
    (error) => {
      console.error("Chat listener error:", error);
      setChats([]);
    }
  );
  return unsubscribe;
};

export const sendMessage = async (messageText, chatId, user1, user2, imageUrl = "") => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  if (!chatId) throw new Error("No chat ID provided");
  if (!user1 || !user2) throw new Error("User IDs are required");

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");

  try {
    const chatDoc = await getDoc(chatRef);
    const lastMessage = imageUrl && typeof imageUrl === "string" ? "Image sent" : messageText;

    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        users: [user1, user2],
        lastMessage,
        lastMessageTimestamp: serverTimestamp(),
        created: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage,
        lastMessageTimestamp: serverTimestamp(),
      });
    }

    await addDoc(messagesRef, {
      text: messageText || "",
      imageUrl: imageUrl || "",
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
};

export const listenForMessages = (chatId, callback) => {
  if (!chatId || !auth.currentUser) {
    console.log("Invalid chatId or no user, setting empty messages");
    callback([]);
    return () => {};
  }

  const messagesRef = collection(db, "chats", chatId, "messages");
  const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
      }));
      callback(messages);
    },
    (error) => {
      console.error("Messages listener error:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const updateMessage = async (chatId, messageId, newText) => {
  if (!chatId || !messageId || !newText) throw new Error("Invalid parameters");

  const messageRef = doc(db, "chats", chatId, "messages", messageId);
  const chatRef = doc(db, "chats", chatId);

  try {
    await updateDoc(messageRef, {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    });

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const latestMessage = querySnapshot.docs[0];

    if (latestMessage && latestMessage.id === messageId) {
      await updateDoc(chatRef, {
        lastMessage: newText,
        lastMessageTimestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating message:", error);
    throw new Error(`Failed to update message: ${error.message}`);
  }
};

export const deleteMessage = async (chatId, messageId) => {
  if (!chatId || !messageId) throw new Error("Invalid parameters");

  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await deleteDoc(messageRef);

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const chatRef = doc(db, "chats", chatId);

    if (!querySnapshot.empty) {
      const lastMessageDoc = querySnapshot.docs[0];
      const lastMessageData = lastMessageDoc.data();
      await updateDoc(chatRef, {
        lastMessage: lastMessageData.text || (lastMessageData.imageUrl ? "Image sent" : ""),
        lastMessageTimestamp: lastMessageData.timestamp,
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: "",
        lastMessageTimestamp: null,
      });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
};



// Firebase utilities
export  {
  auth,
  db,
  storage,
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
};