import { useState, useEffect } from "react";
import { RiMore2Fill } from "react-icons/ri";
import defaultAvatar from "../../public/assets/default.jpg"; 
import SearchModal from "./SearchModal";
import chatData from "../data/chatData";

const ChatList = () => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    setChats(chatData);
  }, []);

  // Helper function to convert timestamp to readable date
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="relative hidden lg:flex flex-col items-start justify-start bg-white h-screen w-full md:w-[37.5rem]">
      <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 border-[#898989b9] p-4 sticky md:static top-0 z-[100]">
        <main className="flex items-center gap-3">
          <img
            src={defaultAvatar}
            className="w-[2.75rem] h-[2.75rem] object-cover rounded-full"
            alt="avatar"
          />
          <span>
            <h3 className="p-0 font-semibold text-[#2A3D39] md:text-[1.1rem]">
              {"Chatfrik User"}
            </h3>
            <p className="p-0 font-light text-[#2A3D39] text-[1rem]">
              {"@chatfrik"}
            </p>
          </span>
        </main>
        <button className="bg-[#D9F2ED] w-[2.2rem] p-2 flex items-center justify-center rounded-lg">
          <RiMore2Fill color="#01AA85" className="w-[1.8rem] h-[1.8rem]" />
        </button>
      </header>

      <div className="w-[100%] mt-[10px] px-5">
        <header className="flex items-center justify-between w-full">
          <h3 className="text-[1rem]">Messages ({chats?.length || 0})</h3>
          <SearchModal />
        </header>
      </div>

      <main className="flex flex-col items-start mt-[1.5rem] pb-3">
        {chats?.map((chat) => {
          // Filter out the current user (baxo@mailinator.com) and get the other user
          const otherUser = chat.users.find(
            (user) => user.email !== "baxo@mailinator.com"
          );

          return (
            <button
              key={chat.id} // Use chat.id as the unique key
              className="flex items-start justify-between w-[37.5rem] border-b border-[#756c6c58] px-5 pb-3 pt-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={otherUser?.image || defaultAvatar}
                  alt="avatar"
                  className="h-[2.5rem] w-[2.5rem] rounded-full object-cover"
                />
                <span>
                  <h2 className="p-0 text-[#2A3D39] font-semibold text-left text-[17px]">
                    {otherUser?.fullName || "Unknown User"}
                  </h2>
                  <p className="p-0 text-[#2A3D39] font-light text-left text-[14px]">
                    {chat.lastMessage || "No message"}
                  </p>
                </span>
              </div>
              <p className="p-0 text-gray-400 font-regular text-left text-[11px]">
                {formatTimestamp(chat.lastMessageTimestamp) || "Unknown Date"}
              </p>
            </button>
          );
        })}
      </main>
    </section>
  );
};

export default ChatList;