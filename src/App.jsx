import { useState, useEffect, useRef } from 'react';
import Navlink from "./components/Navlink";
import ChatList from "./components/ChatList";
import Chatbox from "./components/Chatbox";
import Login from "./components/Login";
import Register from "./components/Register";
import { supabase } from "./supabase/supabase";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const prevUserRef = useRef(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setUser(user);

      // Show toast based on authentication state
      if (user && !prevUserRef.current) {
        toast.success(`Welcome, ${user.user_metadata.full_name || 'User'}!`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (!user && prevUserRef.current) {
        toast.info('You have been logged out.', {
          position: "top-right",
          autoClose: 3000,
        });
      }

      // Update previous user reference
      prevUserRef.current = user;
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <ToastContainer />
      {user ? (
        <div className="flex flex-col items-start w-full lg:flex-row">
          <Navlink />
          <ChatList setSelectedUser={setSelectedUser} />
          <Chatbox selectedUser={selectedUser} />
        </div>
      ) : (
        <div>
          {isLogin ? (
            <Login isLogin={isLogin} setIsLogin={setIsLogin} />
          ) : (
            <Register isLogin={isLogin} setIsLogin={setIsLogin} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;