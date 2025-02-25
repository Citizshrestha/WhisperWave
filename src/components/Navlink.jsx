import {
  RiChatAiLine,
  RiFolderUserLine,
  RiNotificationLine,
  RiFile4Line,
  RiBardLine,
  RiShutDownLine,
  RiArrowDownFill,
} from "react-icons/ri";
import logo from "../../public/assets/logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

const NavLink = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      alert("Logout error: " + err.message);
    }
  };
  return (
    <section className="sticky top-0 h-[7vh] lg:h-[100vh] w-full lg:w-[9.5rem] bg-[#01AA85] flex lg:flex-col py-8 lg:py-0">
      <div className="flex lg:flex-col items-center lg:items-start justify-between lg:gap-10 w-full px-2 lg:px-0">
        {/* Logo Section */}
        <div className="flex h-[83px] items-center justify-center lg:border-b lg:border-b-[1px] border-[#fff] w-full p-4">
          <span className="flex items-center justify-center">
            <img
              src={logo}
              className="w-[3.5rem] h-[3.25rem] object-contain bg-white rounded-lg p-2"
              alt="Logo"
            />
          </span>
        </div>

        {/* Navigation List */}
        <ul className="flex lg:flex-col items-center ml-7 gap-7 md:gap-10 px-2 md:px-0">
          <li>
            <button
              aria-label="Chat AI"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiChatAiLine color="#fff" />
            </button>
          </li>
          <li>
            <button
              aria-label="User Folder"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiFolderUserLine color="#fff" />
            </button>
          </li>
          <li>
            <button
              aria-label="Notifications"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiNotificationLine color="#fff" />
            </button>
          </li>
          <li>
            <button
              aria-label="Files"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiFile4Line color="#fff" />
            </button>
          </li>
          <li>
            <button
              aria-label="Bard"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiBardLine color="#fff" />
            </button>
          </li>
          <li>
            <button
              onClick={handleLogout}
              aria-label="Shutdown"
              className="text-[1.38rem] lg:text-[1.75rem] cursor-pointer"
            >
              <RiShutDownLine color="#fff" />
            </button>
          </li>
        </ul>

        {/* Mobile Toggle Button */}
        <button
          aria-label="Toggle Menu"
          className="block lg:hidden text-[1.38rem]"
        >
          <RiArrowDownFill color="#fff" />
        </button>
      </div>
    </section>
  );
};

export default NavLink;
