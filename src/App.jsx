// import React from 'react'
import Navlink from "./components/Navlink";
import SearchModal from "./components/SearchModal";
import ChatList from "./components/ChatList";
import Chatbox from "./components/Chatbox";
import Login from "./components/Login";
import Register from "./components/Register";

const App = () => {
  return (
    <div>
        <div className="flex lg:flex-row flex-col items-start w-full ">
          <Navlink />
          <ChatList />
          <Chatbox />
        </div>
              <div>
                {/* <Login/>  */}
                {/* <Register/> */}
              </div>
    </div>
  );
};

export default App;
