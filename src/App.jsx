import { useState , useEffect } from 'react';
import Navlink from "./components/Navlink";
import ChatList from "./components/ChatList";
import Chatbox from "./components/Chatbox";
import Login from "./components/Login";
import Register from "./components/Register";
import {auth} from "./firebase/firebase";

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const currentUser = auth.currentUser;
    console.log(currentUser);
     if(currentUser){
      setUser(currentUser)
     }

     const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
     });

     return () => unsubscribe();

  }, []);



  return (
    <div>
      {user ? (
         <div className="flex lg:flex-row flex-col items-start w-full ">
         <Navlink />
         <ChatList />
         <Chatbox />
       </div>
      ) : (
        <div>{isLogin ?  <Login isLogin={isLogin} setIsLogin={setIsLogin}/> : <Register isLogin={isLogin} setIsLogin={setIsLogin}/>}</div>
      )};     
    </div>
  );
};

export default App;
