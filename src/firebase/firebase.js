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

  // Use a query to only fetch chats the user has access to
  const chatsQuery = query(
    collection(db, "chats"),
    where("users", "array-contains", auth.currentUser.uid)
  );
  const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setChats(chatList); // No need to filter since query handles it
  }, (error) => {
    console.error("Chat listener error:", error);
    setChats([]);
  });
  return unsubscribe;
};

export const sendMessage = async (messageText, chatId, user1, user2) => {
  if (!auth.currentUser) throw new Error("User not authenticated");

  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");

  try {
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        users: [user1, user2],
        lastMessage: messageText,
        lastMessageTimestamp: serverTimestamp(),
        created: serverTimestamp(),
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: messageText,
        lastMessageTimestamp: serverTimestamp(),
      });
    }

    await addDoc(messagesRef, {
      text: messageText,
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
      // FIXED: Corrected the map function syntax by removing the invalid "10X10" and duplicate map definition
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
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  const chatRef = doc(db, "chats", chatId);

  try {
    // Step 1: Update the message document
    await updateDoc(messageRef, {
      text: newText,
      edited: true,
      editedAt: serverTimestamp(),
    });

    // Step 2: Check if this is the latest message
    const messagesRef = collection(db, "chats", chatId, "messages"); // Use collection reference
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const latestMessage = querySnapshot.docs[0];

    // Step 3: If the updated message is the latest, update the chat document
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
    // Step 1: Delete the message from the messages subcollection
    const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
    await deleteDoc(messageRef);

    // Step 2: Fetch the most recent remaining message (if any)
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    // Step 3: Update the lastMessage and lastMessageTimestamp in the chats document
    const chatRef = doc(db, 'chats', chatId);
    if (!querySnapshot.empty) {
      // If there are remaining messages, update with the most recent one
      const lastMessageDoc = querySnapshot.docs[0];
      const lastMessageData = lastMessageDoc.data();
      await updateDoc(chatRef, {
        lastMessage: lastMessageData.text,
        lastMessageTimestamp: lastMessageData.timestamp,
      });
    } else {
      // If no messages remain, clear the lastMessage and lastMessageTimestamp
      await updateDoc(chatRef, {
        lastMessage: '',
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
};