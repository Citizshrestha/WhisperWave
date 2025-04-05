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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
const storage = getStorage(app); // Initialized Firebase Storage

// CHANGED: Enhanced error handling for uploadImage
export const uploadImage = async (file, chatId) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  if (!file) throw new Error("No file provided");

  try {
    const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error.message);
    // Provide more specific error messages based on the error type
    if (error.code === "storage/unauthorized") {
      throw new Error("You don’t have permission to upload images.");
    } else if (error.code === "storage/canceled") {
      throw new Error("Image upload was canceled.");
    } else if (error.code === "storage/unknown") {
      throw new Error("An unknown error occurred during image upload. Please try again.");
    } else {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }
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
  const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setChats(chatList);
  }, (error) => {
    console.error("Chat listener error:", error);
    setChats([]);
  });
  return unsubscribe;
};

export const sendMessage = async (messageText, chatId, user1, user2, imageUrl = null) => {
  if (!auth.currentUser) throw new Error("User not authenticated");

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");

  try {
    const chatDoc = await getDoc(chatRef);
    const lastMessage = imageUrl ? "Image sent" : messageText;

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
      imageUrl: imageUrl || null,
      senderId: auth.currentUser.uid,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
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
    throw error;
  }
};

export const deleteMessage = async (chatId, messageId) => {
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
    console.error("Error deleting message and updating chat:", error);
    throw error;
  }
};

export {
  auth,
  db,
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  storage,
};