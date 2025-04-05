import { useState, useEffect, useMemo, useRef } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import PropTypes from "prop-types";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimestamp";
import { auth, db, sendMessage, uploadImage } from "../firebase/firebase";
import { doc, onSnapshot, collection, query, where, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const Chatlist = ({ setSelectedUser }) => {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});
  const fileInputRef = useRef(null);

  const fetchUserData = async (userId) => {
    if (userCache[userId]) return userCache[userId];
    
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user data:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      (doc) => setUser(doc.data() || {}),
      (err) => setError("Failed to load user data")
    );

    const chatsQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", auth.currentUser.uid)
    );

    const unsubscribeChats = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        try {
          const chatsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const chatData = doc.data();
              const otherUserId = chatData.users.find(
                uid => uid !== auth.currentUser.uid
              );
              const otherUser = await fetchUserData(otherUserId);
              
              return {
                id: doc.id,
                lastMessage: chatData.lastMessage || "No messages yet",
                lastMessageTimestamp: chatData.lastMessageTimestamp,
                otherUser,
              };
            })
          );
          setChats(chatsData);
          setLoading(false);
          setError(null);
        } catch (err) {
          setError(`Failed to process chats: ${err.message}`);
          setLoading(false);
        }
      },
      (err) => {
        setError(`Failed to load chats: ${err.message}`);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeChats();
    };
  }, [auth.currentUser?.uid]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = a.lastMessageTimestamp?.seconds || 0;
      const bTime = b.lastMessageTimestamp?.seconds || 0;
      return bTime - aTime;
    });
  }, [chats]);

  const startChat = (user) => {
    setSelectedUser(user);
  };

  const handleImageClick = (chatId) => {
    fileInputRef.current.dataset.chatId = chatId;
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const chatId = e.target.dataset.chatId; // Get chatId from data attribute
    
    if (!file || !chatId) return;

    try {
      const currentChat = chats.find(chat => chat.id === chatId);
      if (!currentChat) return;

      const user1 = auth.currentUser.uid;
      const user2 = currentChat.otherUser?.uid;

      if (!user1 || !user2) return;

      const imageUrl = await uploadImage(file, chatId);
      await sendMessage("", chatId, user1, user2, imageUrl);
      fileInputRef.current.value = ""; // Reset file input
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <section className="relative hidden lg:flex flex-col item-start justify-start bg-[#021046] text-white h-[100vh] w-[100%] md:w-[600px] border-r border-[#9090902c]">
      <header className="flex items-center justify-between w-[100%] p-[1.08rem] sticky top-0 z-[100] text-white border-b border-[#f1e9e9]">
        <main className="flex items-center gap-3 text-white">
          <img 
            src={user?.image || defaultAvatar} 
            className="w-[44px] h-[44px] object-cover rounded-full cursor-pointer"
            alt="User profile" 
            onClick={() => handleImageClick(chats[0]?.id)}
          />
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <span>
            <h3 className="p-0 font-semibold text-white md:text-[17px]">
              {user?.fullName || "ChatFrik User"}
            </h3>
            <p className="p-0 font-light text-[15px]">
              @{user?.username || "chatfrik"}
            </p>
          </span>
        </main>
        <button 
          className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg hover:bg-[#c8eae3] transition-colors"
          aria-label="More options"
        >
          <RiMore2Fill color="#01AA85" className="w-[28px] h-[28px]" />
        </button>
      </header>

      <div className="w-[100%] mt-[10px] px-5 text-white">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-medium">
            Messages ({chats.length})
          </h3>
          <SearchModal startChat={startChat} />
        </header>
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-white">
            <p className="text-white">No chats yet</p>
            <p className="mt-2 text-sm text-white">
              Start a new chat using the search button
            </p>
          </div>
        ) : (
          sortedChats.map((chat) => (
            <div 
              key={chat.id} 
              className="flex items-start justify-between w-[100%] border-b border-[#2d2a2a] px-5 py-3 transition-colors cursor-pointer"
              onClick={() => startChat(chat.otherUser)}
            >
              <div className="flex items-start w-full gap-3 text-white">
                <img 
                  src={chat.otherUser?.image || defaultAvatar} 
                  className="h-[40px] w-[40px] rounded-full object-cover cursor-pointer"
                  alt={chat.otherUser?.fullName || "User profile"} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(chat.id);
                  }}
                />
                <div className="flex-1 min-w-0 text-white">
                  <h2 className="font-semibold text-[17px] truncate">
                    {chat.otherUser?.fullName || "ChatFrik User"}
                  </h2>
                  <p className="font-light text-[14px] truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.lastMessageTimestamp && (
                  <p className="text-white text-[11px] whitespace-nowrap ml-2">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </section>
  );
};

Chatlist.propTypes = {
  setSelectedUser: PropTypes.func.isRequired,
};

export default Chatlist;