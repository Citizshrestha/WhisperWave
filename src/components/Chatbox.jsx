
import { formatTimeStamp } from "../utils/formatTimeStamp"; 
import defaultAvatar from "../../public/assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { useEffect, useState, useMemo } from "react"; 

const Chatbox = () => {
  const [messages, setMessages] = useState([]);

  const senderEmail = "baxo@mailinator.com";

  useEffect(() => {
    setMessages(messageData || []); // Fallback to empty array if messageData is undefined
  }, []);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTimeStamp = a.timestamp.seconds + a.timestamp.nanoseconds / 1e9;
      const bTimeStamp = b.timestamp.seconds + b.timestamp.nanoseconds / 1e9;
      return  aTimeStamp - bTimeStamp; 
    });
  }, [messages]);

  return (
    <section className="background-image flex flex-col items-start justify-start h-screen w-full">
      <header className="border-b border-gray-400 w-full h-[90px] p-4 bg-white">
        <div className="flex items-center gap-3">
          <span>
            <img
              src={defaultAvatar}
              className="w-11 h-11 object-cover rounded-full" 
              alt="Avatar"
            />
          </span>
          <span>
            <h3 className="font-semibold text-[#2A3D39] text-lg">
              Chatfrik User
            </h3>
            <p className="font-light text-[#2A3D39] text-sm">@chatfrik</p>
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
            onSubmit={(e) => e.preventDefault()} 
          >
            <input
              className="h-full text-[#2A3D39] outline-none text-[1rem] pl-3 pr-[3.2rem] rounded-lg w-full"
              type="text"
              name="message"
              id="message"
              placeholder="Write your message..."
            />
            <button className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9F2ED] hover:bg-[#C8EAE3]">
              <RiSendPlaneFill color="#01AA85" />
            </button>
          </form>
        </div>
      </main>
    </section>
  );
};

export default Chatbox;