import { useEffect, useMemo, useRef, useState } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formatTimestamp";
import { RiSendPlaneFill, RiImageAddLine } from "react-icons/ri";
import { auth, listenForMessages, sendMessage, updateMessage, deleteMessage, uploadImage } from "../firebase/firebase";
import { storage } from "../firebase/firebase"; // Make sure to export storage from your firebase config
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import logo from "../../public/assets/logo.png";
import PropTypes from "prop-types";

const Chatbox = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const chatId = auth?.currentUser?.uid && selectedUser?.uid
    ? auth.currentUser.uid < selectedUser.uid
      ? `${auth.currentUser.uid}-${selectedUser.uid}`
      : `${selectedUser.uid}-${auth.currentUser.uid}`
    : null;

  const user1 = auth?.currentUser?.uid || null;
  const user2 = selectedUser?.uid || null;

  useEffect(() => {
    if (!chatId || !user1 || !user2) {
      setMessages([]);
      return;
    }

    const unsubscribe = listenForMessages(chatId, (messages) => {
      const validMessages = messages.filter(msg => 
        msg.senderId === user1 || msg.senderId === user2
      );
      setMessages(validMessages);
    });

    return () => unsubscribe && unsubscribe();
  }, [chatId, user1, user2]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTimestamp = a?.timestamp?.seconds + a?.timestamp?.nanoseconds / 1e9;
      const bTimestamp = b?.timestamp?.seconds + b?.timestamp?.nanoseconds / 1e9;
      return aTimestamp - bTimestamp;
    });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !chatId || !user1 || !user2) return;

    try {
      await sendMessage(messageText, chatId, user1, user2);
      setMessageText("");
      setError(null);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Failed to send message: ${error.message}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !chatId || !user1 || !user2) return;
  
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
  
    try {
      const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          throw error;
        },
        async () => {
          const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage("", chatId, user1, user2, imageUrl);
          fileInputRef.current.value = "";
          setIsUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(`Image upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    if (!newText.trim() || !chatId) return;

    try {
      await updateMessage(chatId, messageId, newText);
      setEditingMessageId(null);
      setEditedText("");
      setError(null);
    } catch (error) {
      console.error("Error editing message:", error);
      setError(`Failed to edit message: ${error.message}`);
    }
  };

  const startEditing = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditedText(currentText);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!chatId) return;

    try {
      await deleteMessage(chatId, messageId);
      setError(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      setError(`Failed to delete message: ${error.message}`);
    }
  };

  return (
    <>
      {selectedUser ? (
        <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image2">
          <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white">
            <main className="flex items-center gap-3">
              <img 
                src={selectedUser?.image || defaultAvatar} 
                className="object-cover rounded-full cursor-pointer w-11 h-11" 
                alt={`${selectedUser?.fullName || 'User'} profile`}
              />
              <span>
                <h3 className="font-semibold text-[#2A3D39] text-lg">
                  {selectedUser?.fullName || "Chatfrik User"}
                </h3>
                <p className="font-light text-[#2A3D39] text-sm">
                  @{selectedUser?.username || "chatfrik"}
                </p>
              </span>
            </main>
          </header>

          <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
            <section className="px-3 pt-5 b-20 lg:pb-10">
              <div ref={scrollRef} className="overflow-auto h-[80vh]">
                {sortedMessages?.map((msg, index) => (
                  <div key={`${msg.id}-${index}`}>
                    {msg?.senderId === auth.currentUser.uid ? (
                      <div className="flex flex-col items-end w-full ">
                        <span className="flex h-auto gap-3 me-10 ">
                          <div>
                            {editingMessageId === msg.id ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  value={editedText}
                                  onChange={(e) => setEditedText(e.target.value)}
                                  className="p-2 border rounded"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditMessage(msg.id, editedText)}
                                    className="px-2 py-1 text-white bg-green-500 rounded"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-2 py-1 text-white bg-gray-500 rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="relative flex items-center justify-center p-6 bg-blue-100 text-blue-700 rounded-lg shadow-sm group">
                                  {msg.imageUrl ? (
                                    <img 
                                      src={msg.imageUrl} 
                                      alt="Sent Image" 
                                      className="h-auto max-w-[300px] rounded" 
                                    />
                                  ) : (
                                    <h4>{msg.text}</h4>
                                  )}
                                  <div className="absolute top-0 right-0 flex-col hidden gap-1 p-1 group-hover:flex">
                                    {!msg.imageUrl && (
                                      <button
                                        onClick={() => startEditing(msg.id, msg.text)}
                                        className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="px-2 py-1 text-xs text-white bg-red-500 rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-3 text-right text-gray-400 text-sx">
                                  {formatTimestamp(msg?.timestamp)}
                                </p>
                              </>
                            )}
                          </div>
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start w-full">
                        <span className="flex gap-3 w-[40%] h-auto ms-10">
                          <img 
                            src={selectedUser?.image || defaultAvatar} 
                            className="object-cover rounded-full h-11 w-11" 
                            alt="Sender profile" 
                          />
                          <div>
                            <div className="flex items-center justify-center p-6  rounded-lg shadow-sm bg-blue-100 text-blue-700">
                              {msg.imageUrl ? (
                                <img 
                                  src={msg.imageUrl} 
                                  alt="Received Image" 
                                  className="h-auto max-w-[300px] rounded" 
                                />
                              ) : (
                                <h4>{msg.text}</h4>
                              )}
                            </div>
                            <p className="mt-3 text-gray-400 text-sx">
                              {formatTimestamp(msg?.timestamp)}
                            </p>
                          </div>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Error display */}
            {error && (
              <div className="sticky bottom-[100px] mx-3 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Upload progress indicator */}
            {isUploading && (
              <div className="absolute  right-0 bottom-[80px] w-[20%]  mx-6  p-2 bg-blue-100 text-blue-700 rounded">
                Uploading: {Math.round(uploadProgress)}% complete
              </div>
            )}

            <div className="sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%]">
              <form 
                onSubmit={handleSendMessage} 
                className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg"
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  disabled={isUploading}
                >
                  <RiImageAddLine size={20} />
                </button>
                
                <input 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]" 
                  type="text" 
                  placeholder="Write your message..." 
                  disabled={isUploading}
                />
                
                <button 
                  type="submit" 
                  className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
                  disabled={!messageText.trim() || isUploading}
                >
                  <RiSendPlaneFill color="#01AA85" />
                </button>
              </form>
            </div>
          </main>
        </section>
      ) : (
        <section className="h-screen w-[100%] bg-[#e5f6f3] background-image">
          <div className="flex flex-col justify-center items-center h-[100vh]">
            <img src={logo} alt="Chatfrik logo" width={100} />
            <h1 className="text-[30px] font-bold text-teal-700 mt-5">Welcome to WhisperWave</h1>
            <p className="text-gray-500">Connect and chat with friends easily, fast and free</p>
          </div>
        </section>
      )}
    </>
  );
};

Chatbox.propTypes = {
  selectedUser: PropTypes.object,
};

export default Chatbox;