import React from 'react'
import { FaUserPlus } from 'react-icons/fa'

const Register = () => {
  return (
   <section className='flex flex-col items-center justify-center h-[100vh] background-image'>
       <div className='p-5 bg-white shadow-lg rounded-xl h-[27rem] w-[20rem] flex flex-col items-center justify-center'>
           <div className='mb-10'>
              <h1 className='text-center text-[1.8rem] font-bold  '>Sign Up</h1>
              <p className='text-sm text-center text-gray-400 '>Welcome, create an account to continue</p>
           </div>
           
           <div className="w-full ">
                <input className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#004939858]  ' type="text" name="" id="" placeholder='Full Name' required/>
                <input className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3]  mb-3 font-medium outline-none placeholder:text-[#004939858] ' type="email" name="" id="" placeholder='Email'  required/>
                <input className='w-full p-2 border border-green-200 rounded-md bg-[#01aa851d] text-[#004939f3]  mb-3 font-medium outline-none placeholder:text-[#004939858] ' type="password" name="" id="" placeholder='Password' required/>
           </div>

           <div className="w-full">
              <button className='bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center'>Register <FaUserPlus/></button>
           </div>
       </div>
   </section>
  )
}

export default Register