import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Check for missing environment variables
const requiredEnvVars = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Listen for chats (filtered by authenticated user)
export const listenForChats = (setChats) => {
  if (!auth.currentUser) return () => {}; // Return empty cleanup if not authenticated
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
  });
  return unsubscribe;
};

// Send a message
export const sendMessage = async (messageText, chatId, user1, user2) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  const chatRef = doc(db, "chats", chatId);

  const [user1Doc, user2Doc] = await Promise.all([
    getDoc(doc(db, "users", user1)),
    getDoc(doc(db, "users", user2)),
  ]);

  const user1Data = user1Doc.data();
  const user2Data = user2Doc.data();

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

// Listen for messages in a chat
export const listenForMessages = (chatId, setMessages) => {
  const chatRef = collection(db, "chats", chatId, "messages");
  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    const messages = snapshot.docs.map((doc) => doc.data());
    setMessages(messages);
  });
  return unsubscribe;
};

export { auth, db };