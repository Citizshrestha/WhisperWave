import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc, // Ensure doc is imported
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc, // Ensure setDoc is imported
  updateDoc,
} from "firebase/firestore";

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

export const listenForChats = (setChats) => {
  if (!auth.currentUser) {
    setChats([]);
    return () => {};
  }
  const chatsRef = collection(db, "chats");
  const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const filteredChats = chatList.filter((chat) =>
      chat?.users?.some((user) => user.email === auth.currentUser.email)
    );
    setChats(filteredChats);
  }, (error) => {
    console.error("Chat listener error:", error);
  });
  return unsubscribe;
};

export const sendMessage = async (messageText, chatId, user1, user2) => {
  if (!user1 || !user2) {
    throw new Error("Invalid user IDs provided");
  }

  const chatRef = doc(db, "chats", chatId);
  const [user1Doc, user2Doc] = await Promise.all([
    getDoc(doc(db, "users", user1)),
    getDoc(doc(db, "users", user2)),
  ]);

  const user1Data = user1Doc.exists() ? user1Doc.data() : null;
  const user2Data = user2Doc.exists() ? user2Doc.data() : null;

  if (!user1Data || !user2Data) {
    console.log("Users not found!")
    throw new Error("One or both users not found in Firestore");
  }

  const chatDoc = await getDoc(chatRef);
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      users: [user1Data, user2Data],
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  } else {
    await updateDoc(chatRef, {
      lastMessage: messageText,
      lastMessageTimestamp: serverTimestamp(),
    });
  }

  const messageRef = collection(db, "chats", chatId, "messages");
  await addDoc(messageRef, {
    text: messageText,
    sender: auth.currentUser.email,
    timestamp: serverTimestamp(),
  });
};

export const listenForMessages = (chatId, setMessages) => {
  if (!chatId || typeof chatId !== "string") {
    setMessages([]);
    return () => {};
  }

  if (!auth.currentUser) {
    setMessages([]);
    return () => {};
  }

  const chatRef = doc(db, "chats", chatId);
  return getDoc(chatRef).then((chatDoc) => {
    if (!chatDoc.exists()) {
      setMessages([]);
      return () => {};
    }
    const chatData = chatDoc.data();
    const hasAccess = chatData?.users?.some((user) => user.email === auth.currentUser.email);
    if (!hasAccess) {
      setMessages([]);
      return () => {};
    }

    const messagesRef = collection(db, "chats", chatId, "messages");
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messages);
    }, (error) => {
      console.error(`Messages listener error for chatId ${chatId}:`, error.message);
      setMessages([]);
    });

    return unsubscribe;
  }).catch((error) => {
    console.error(`Error checking parent chat ${chatId}:`, error.message);
    setMessages([]);
    return () => {};
  });
};

// Explicitly export all necessary functions and variables
export {
  auth,
  db,
  doc, // Added to exports
  setDoc, // Added to exports
  serverTimestamp,
  addDoc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
};