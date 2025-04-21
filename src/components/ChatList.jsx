import { useState, useEffect, useCallback, useRef } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import PropTypes from "prop-types";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimeStamp";
import { auth, db, sendMessage, uploadImage } from "../firebase/firebase";
import { doc, onSnapshot, collection, query, where, getDoc } from "firebase/firestore";
import { toast } from "react-toastify"; // For user feedback

const Chatlist = ({ setSelectedUser }) => {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const userCacheRef = useRef({});
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchUserData = useCallback(async (userId) => {
    if (userCacheRef.current[userId]) return userCacheRef.current[userId];

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userCacheRef.current[userId] = userData;
        return userData;
      }
      throw new Error("User not found");
    } catch (err) {
      console.error("Error fetching user data:", err);
      if (isMountedRef.current) setError("Failed to fetch user data");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const userDocRef = doc(db, "users", userId);
    const unsubscribeUser = onSnapshot(
      userDocRef,
      (doc) => {
        if (isMountedRef.current) setUser(doc.data() || {});
      },
      (err) => {
        if (isMountedRef.current) setError("Failed to load user data");
      }
    );

    const chatsQuery = query(
      collection(db, "chats"),
      where("users", "array-contains", userId)
    );

    const unsubscribeChats = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        try {
          const chatsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const chatData = doc.data();
              const otherUserId = chatData.users.find((uid) => uid !== userId);
              const otherUser = await fetchUserData(otherUserId);

              return {
                id: doc.id,
                lastMessage: chatData.lastMessage || "No messages yet",
                lastMessageTimestamp: chatData.lastMessageTimestamp,
                otherUser,
              };
            })
          );

          if (isMountedRef.current) {
            setChats(
              chatsData.sort((a, b) => {
                const aTime = a.lastMessageTimestamp?.seconds || 0;
                const bTime = b.lastMessageTimestamp?.seconds || 0;
                return bTime - aTime;
              })
            );
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (isMountedRef.current) {
            setError(`Failed to process chats: ${err.message}`);
            setLoading(false);
          }
        }
      },
      (err) => {
        if (isMountedRef.current) {
          setError(`Failed to load chats: ${err.message}`);
          setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      unsubscribeUser();
      unsubscribeChats();
    };
  }, [fetchUserData]);

  const startChat = (user) => {
    if (user) setSelectedUser(user);
  };

  const handleImageClick = (chatId) => {
    fileInputRef.current.dataset.chatId = chatId;
    fileInputRef.current.click();
  };

  const handleProfileImageClick = () => {
    fileInputRef.current.dataset.chatId = null; // For profile updates
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const chatId = e.target.dataset.chatId;

    if (!file) return;

    setUploading(true);
    try {
      if (chatId) {
        // Chat image upload
        const currentChat = chats.find((chat) => chat.id === chatId);
        if (!currentChat) throw new Error("Chat not found");

        const user1 = auth.currentUser.uid;
        const user2 = currentChat.otherUser?.uid;

        if (!user1 || !user2) throw new Error("Invalid user data");

        const imageUrl = await uploadImage(file, chatId);
        await sendMessage("", chatId, user1, user2, imageUrl);
        toast.success("Image sent successfully!");
      } else {
        // Profile image upload (implement updateProfileImage in firebase.js)
        // const imageUrl = await uploadImage(file, `profiles/${auth.currentUser.uid}`);
        // await updateProfileImage(auth.currentUser.uid, imageUrl);
        toast.success("Profile image updated!");
      }
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-4 text-white">Loading chats...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <section className="relative hidden lg:flex flex-col item-start justify-start bg-[#021046] text-white h-[100vh] w-[100%] md:w-[600px] border-r border-[#9090902c]">
      <header className="flex items-center justify-between w-[100%] p-[1.08rem] sticky top-0 z-[100] text-white border-b border-[#f1e9e9]">
        <main className="flex items-center gap-3 text-white">
          <img
            src={user?.image || defaultAvatar}
            className="w-[44px] h-[44px] object-cover rounded-full cursor-pointer"
            alt="User profile"
            onClick={handleProfileImageClick}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
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
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-white">
            <p className="text-white">No chats yet</p>
            <p className="mt-2 text-sm text-white">
              Start a new chat using the search button
            </p>
          </div>
        ) : (
          chats.map((chat) => (
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