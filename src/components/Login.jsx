// import React from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react'
import { FaSignInAlt, FaSpinner } from 'react-icons/fa'
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

const Login = ({ isLogin, setIsLogin,  }) => {
  const [userData, setUserData] = useState({email:"", password: ""});
  const [isLoading,setIsLoading] = useState(false);
  const handleChangeUserData = (e) => {
   
    const {name,value} =e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  }


  const handleLoginAuth = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, userData?.email, userData?.password);
      const loggedInuser = userCredential.user;
      console.log(loggedInuser);

      const userDocRef = doc(db, "users", loggedInuser.uid);

      await setDoc(userDocRef, {
        uid: loggedInuser.uid,
        email: loggedInuser.email,
        username: loggedInuser.email?.split("@")[0],
        fullName: loggedInuser.email?.split("@")[0].toUpperCase().charAt(0) + loggedInuser.email?.split("@")[0].slice(1),
        image: "",
      });
      alert("Login Successful");


    } catch (error) {
      alert("Login Failed! Some error occured"+ error);
    } finally{
      setIsLoading(false);
    }
  }

    return (
    <section className='flex flex-col items-center justify-center h-[100vh] background-image'>
    <div className='p-5 bg-white shadow-lg rounded-xl h-[27rem] w-[20rem] flex flex-col items-center justify-center'>
        <div className='mb-10'>
           <h1 className='text-center text-[1.8rem] font-bold  '>Login</h1>
           <p className='text-sm text-center text-gray-400 '>Welcome back, Login to continue</p>
        </div>
        
        <div className="w-full ">
             <input name="email" onChange={handleChangeUserData} className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#004939858]  ' type="email"  id="email" placeholder='Email' required/>
             <input name="password" onChange={handleChangeUserData} className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3]  mb-3 font-medium outline-none placeholder:text-[#004939858] ' type="password"  id="password" placeholder='Password' required/>
        </div>

        <div className="w-full">
           <button disabled={isLoading} onClick={handleLoginAuth} className='bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center'>
               {isLoading ? (
                 <>Processing... <FaSpinner className='spinner '/> </>
               ) : (
                <>
                  Login <FaSignInAlt/>
                </>
               )

               } 
             </button>
        </div>

        <div className="mt-5 text-center text-gray-400 text-sm ">
           <button onClick={() => setIsLogin(!isLogin)}> Not have an account? Register</button>
        </div>

    </div>
</section>
  )
}

export default Login