// import React from 'react'
import { RiArrowDownBoxFill, RiArrowDownFill, RiBardLine, RiChatAiLine, RiFile4Line, RiFolderUserLine, RiNotificationLine, RiShutDownLine } from "react-icons/ri"
import logo from "../../public/assets/logo.png"
const Navlink = () => {
  return (
    <section className="sticky lg:items-start lg:justify-start h-[7vh] lg:h-[100vh] w-full lg:w-[9.5rem] py-8 lg:py-0 bg-[#01AA85]  top-0 flex items-center ">
       <main className="flex lg:flex-col items-center lg:gap-10 justify-between lg:px-0 w-full">
           <div className="flex items-start justify-center lg:border-b border-b-1 border-[#fff] lg:w-full p-4 ">
               <span className="flex items-center justify-center ">
                  <img src={logo} className="w-[3.5rem] h-[3.25rem] object-contain bg-white w-[3.6rem] h-[3rem] rounded-lg p-2" alt="Logo" />
               </span>
           </div>

           <ul className="flex   lg:flex-col items-center gap-7 md:gap-10 px-2 md:px-0  ">
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer">
                <RiChatAiLine color="#fff" />
              </button>
            </li>
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer">
                <RiFolderUserLine color="#fff" />
              </button>
            </li>
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer">
                <RiNotificationLine color="#fff" />
              </button>
            </li>
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer">
                <RiFile4Line color="#fff" />
              </button>
            </li>
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer">
                <RiBardLine color="#fff" />
              </button>
            </li>
            <li >
              <button className="lg:text-[1.75rem] text-[1.38rem] cursor-pointer ">
                <RiShutDownLine color="#fff" />
              </button>
            </li>
           
           </ul>

        
              <button className="block lg:hidden lg:text-[1.75rem] text-[1.38rem] ">
                <RiArrowDownFill color="#fff" />
              </button> 
            
       </main>
    </section>
  )
}

export default Navlink