import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA243zxci9wJjwXwZ9ADQDtrvGDUs0Ub0Y",
  authDomain: "chat-application-21466.firebaseapp.com",
  projectId: "chat-application-21466",
  storageBucket: "chat-application-21466.firebasestorage.app",
  messagingSenderId: "739884461695",
  appId: "1:739884461695:web:6e4493c5186bb3b639594a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const listenForChats = (setChats) => {
  if (!auth.currentUser) return setChats([]); // Prevent error if user is not signed in

  const chatsRef = collection(db, "chats");
  const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
    const chatList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    const filteredChats = chatList.filter((chat) =>
      chat?.user?.some((user) => user.email === auth.currentUser.email)
    );

    setChats(filteredChats);
  });

  return unsubscribe;
};

export { auth, db };
