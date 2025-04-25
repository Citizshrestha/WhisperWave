import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { RiSearchLine } from "react-icons/ri";
import defaultAvatar from "../../public/assets/default.jpg";
import { supabase } from "../supabase/supabase";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

const SearchModal = ({ startChat }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);

  const openModal = () => setIsModalOpen(!isModalOpen);
  const closeModal = () => setIsModalOpen(!isModalOpen);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warn("Please enter a username to search");
      return;
    }

    try {
      const normalizedSearchTerm = searchTerm.toLowerCase();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", `%${normalizedSearchTerm}%`);
      if (error) throw error;

      if (data.length === 0) {
        toast.info("No users found");
      }
      setUsers(data);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search users: " + error.message);
    }
  };

  return (
    <div>
      <button onClick={openModal} className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg">
        <RiSearchLine color="#01AA85" className="w-[18px] h-[18px]" />
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center bg-[#00170cb7]" onClick={closeModal}>
          <div className="relative w-full max-w-md max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-[#0c58b4] w-[100%] rounded-md shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-300 md:p-5">
                <h3 className="text-xl font-semibold text-white">Search Chat</h3>
                <button onClick={closeModal} className="text-white bg-transparent hover:bg-[#d9f2ed] hover:text-[#01AA85] rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center">
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="p-4 md:p-5">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      type="text" 
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg outline-none w-full p-2.5" 
                      placeholder="Search users" 
                    />
                    <button onClick={handleSearch} className="px-3 py-2 text-white bg-blue-900 rounded-lg">
                      <FaSearch />
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  {users?.map((user) => (
                    <div  
                      key={user.id}
                      className="flex items-start gap-3 bg-[#15eabc34] p-3 mb-5 rounded-lg cursor-pointer border border-[#ffffff20] shadow-lg"
                      onClick={() => { 
                        startChat(user);
                        closeModal();
                      }}
                    >
                      <img src={user.image || defaultAvatar} className="h-[40px] w-[40px] rounded-full" alt="" />
                      <span>
                        <h2 className="p-0 font-semibold text-white text-[18px]">{user.full_name}</h2>
                        <p className="text-[13px] text-white">@{user.username}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SearchModal.propTypes = {
  startChat: PropTypes.func.isRequired,
};

export default SearchModal;