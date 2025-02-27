
import { formatTimeStamp } from "../utils/formatTimeStamp"; 
import defaultAvatar from "../../public/assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { useEffect, useState, useMemo, useRef } from "react"; 
import { auth, sendMessage } from "../firebase/firebase";

const Chatbox = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText,setMessageText] = useState("");
 
  const scrollRef = useRef(null)

  
  const chatId = auth?.currentUser?.uid < selectedUser?.uid ? `${auth?.currentUser?.uid} - ${selectedUser?.uid}` : `${selectedUser?.uid} - ${auth?.currentUser?.uid}`
  const user1 = auth?.currentUser;
  const user2 = selectedUser;
  const senderEmail = auth?.currentUser?.email;

  console.log(typeof chatId);
  console.log(user1);
  console.log(user2);

  useEffect(() => {
    setMessages(messageData || []); // Fallback to empty array if messageData is undefined
  }, []);

  useEffect(() => {
    if (scrollRef.current){
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  },[messages])

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTimeStamp = a.timestamp.seconds + a.timestamp.nanoseconds / 1e9;
      const bTimeStamp = b.timestamp.seconds + b.timestamp.nanoseconds / 1e9;
      return  aTimeStamp - bTimeStamp; //sort messages by latest timestamp or message
    });
  }, [messages]);

  const handleSendMessage = (e) => {
    //Send message logic 
    e.preventDefault();   //prevents page reload on form submission
    if(!messageText.trim()) return; //prevents sending empty message
    const newMessage = {
      sender: senderEmail,
      text: messageText.trim(),
      timestamp: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,

      },
    };

      sendMessage(messageText, chatId, user1, user2);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageText("");
  };

  return (
    <section className="background-image flex flex-col items-start justify-start h-screen w-full">
      <header className="border-b border-gray-400 w-full h-[83px] p-4 bg-white">
        <div className="flex items-center gap-3">
          <span>
            <img
              src={selectedUser?.image || defaultAvatar}
              className="w-11 h-11 object-cover rounded-full" 
              alt="Avatar"
            />
          </span>
          <span>
            <h3 className="font-semibold text-[#2A3D39] text-lg">
             {selectedUser?.fullName || "Chatfrik User"}
            </h3>
            <p className="font-light text-[#2A3D39] text-sm">@{selectedUser?.username || "chatfrik"}</p>
          </span>
        </div>
      </header>

      <main className="custom-scrollbar relative flex-1 w-full flex flex-col justify-between">
        <section className="px-3 pt-5 pb-20 lg:pb-10">
          <div className="overflow-auto h-[80vh]">
            {sortedMessages?.length > 0 ? (
              sortedMessages.map((msg, idx) => (
                <div key={idx}> 
                  {msg?.sender === senderEmail ? (
                    <div className="flex flex-col items-end w-full">
                      <span className="flex gap-3 me-10 h-auto">
                        <div>
                          <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                            <h4>{msg.text}</h4>
                          </div>
                          <p className="text-gray-400 text-xs mt-3 text-right">
                            {formatTimeStamp(msg?.timestamp)} {/* Dynamic timestamp */}
                          </p>
                        </div>
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-start w-full">
                      <span className="flex gap-3 w-[40%] h-auto ms-10">
                        <img
                          src={defaultAvatar}
                          className="h-11 w-11 object-cover rounded-full"
                          alt="avatar"
                        />
                        <div>
                          <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                            <h4>{msg.text}</h4>
                          </div>
                          <p className="text-gray-400 text-xs mt-3">
                            {formatTimeStamp(msg?.timestamp)} {/* Dynamic timestamp */}
                          </p>
                        </div>
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No messages yet</p> // Fallback when no messages
            )}
          </div>
        </section>

        <div className="sticky lg:bottom-0 bottom-[3.8rem] p-3 h-fit w-ful  ">
          <form
            action=""
            className="flex items-center bg-white h-[45px] w-full px-2 rounded-lg relative shadow-lg"
            onSubmit={handleSendMessage}
          >
            <input
              className="h-full text-[#2A3D39] outline-none text-[1rem] pl-3 pr-[3.2rem] rounded-lg w-full"
              type="text"
              name="message"
              id="message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}

              placeholder="Write your message..."
            />
            <button 
              type="submit"
              className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9F2ED] hover:bg-[#C8EAE3]">
              <RiSendPlaneFill color="#01AA85" />
            </button>
          </form>
        </div>
      </main>
    </section>
  );
};

export default Chatbox;