// import React from 'react'
import { useState } from 'react'
import { FaUserPlus } from 'react-icons/fa'


const Register = () => {
   const [userData, setUserData] = useState({fullName: "", email: "", password: ""});

   const handleChangeUserData = (e) => {
      e.preventDefault();
      const {name,value} = e.target;
      setUserData((prevState) => ({
         ...prevState,
         [name]: value
      }))
      
   }
    
   const handleAuth = async () => {
      try {
         alert("Registration Successful");
      } catch (error) {
        alert("Registration Failed! Some error occured"+ error); 
      }
   }
   console.log(userData.email)
   console.log(userData.password)
   
  return (
   <section className='flex flex-col items-center justify-center h-[100vh] background-image'>
       <div className='p-5 bg-white shadow-lg rounded-xl h-[27rem] w-[20rem] flex flex-col items-center justify-center'>
           <div className='mb-10'>
              <h1 className='text-center text-[1.8rem] font-bold  '>Sign Up</h1>
              <p className='text-sm text-center text-gray-400 '>Welcome, create an account to continue</p>
           </div>
           
           <div className="w-full ">
                <input type="text" name="fullName" id="fullName" onChange={handleChangeUserData} className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#004939858]  '  placeholder='Full Name' required/>
               <input type="email" name="email" id="email" onChange={handleChangeUserData} className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3]  mb-3 font-medium outline-none placeholder:text-[#004939858] ' placeholder='Email'  required/>
                <input type="password" name="password" id="password" onChange={handleChangeUserData} className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3]  mb-3 font-medium outline-none placeholder:text-[#004939858] ' placeholder='Password' required/>
           </div>

           <div className="w-full">
              <button onClick={handleAuth} className='bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center'>
                Register <FaUserPlus/>
                </button>
           </div>

           <div className="mt-5 text-center text-gray-400 text-sm ">
              <button>Already have an account? Sign In</button>
           </div>

       </div>
   </section>
  )
}

export default Register