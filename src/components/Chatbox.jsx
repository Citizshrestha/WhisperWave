// import React from 'react'
import { formatTimeStamp } from "../utils/formatTimeStamp";
import defaultAvatar from "../../public/assets/default.jpg";
import { RiSendPlaneFill } from "react-icons/ri";


const Chatbox = () => {
  return (
    <section className="background-image flex flex-col items-start justify-start h-screen w-full background-image">
        <header className="border-b border-gray-400  w-[100%] h-[82px] m:h-fit p-4  bg-white">
          <main className="flex items-center gap-3 ">
            <span>
              <img src={defaultAvatar} className="w-11 h-11 objecover rounded-full " alt="Avatar" />
            </span>
            <span>
               <h3 className="font-semibold text-[#2A3D39] text-lg">Chatfrik User</h3>
               <p className="font-light text-[#2A3D39] text-sm">@chatfrik</p>
            </span>
            </main>
        </header>

        <main className="custom-scrollbar relative h-[100vh] w-full flex flex-col justify-between">
           <section className="px-3 pt-5 pb-20 lg:pb-10  ">
              <div className="overflow-auto h-[80vh]">
              <div className="flex flex-col items-end w-full ">
                        <span className="flex gap-3 ms-10 h-auto">
                              <div >
                                 <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm ">
                                   <h4>Chatfrik User</h4>
                                 </div>
                                 <p className="text-gray-400 text-sx mt-3 text-right">7th Feb 2025</p>
                              </div>
                        </span>

                   
                    </div>

                    <div className="flex flex-col items-start w-full ">
                       

                        <span className="flex gap-3 w-[40%] h-auto ms-10 ">
                          <img src={defaultAvatar} className="h-11  w-11 object-cover rounded-full" alt="avatar" />
                          <div>
                            <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm ">
                              <h4>Chatfrik User</h4>
                            </div>
                            <p className="text-gray-400 text-sx mt-3">7th Feb 2025</p>

                          </div>
                        </span>
                    </div>
                   
              </div>
           </section>

           
               <div className="sticky lg:bottom-0 bottom-[3.8rem] p-3 h-fit w-[100%] ">
                  <form action="" className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg  ">
                     <input className="h-full text-[#2A3D39] outline-none text-[1rem] pl-3 pr-[3.2rem] rounded-lg w-[100%] " type="text" name="" id="" placeholder="Write your message..." />
                     <button className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9F2ED] hover:bg-[#C8EAE3]">
                        <RiSendPlaneFill color="#01AA85"/>
                     </button>
                  </form>
               </div>
        </main>
    </section>
  )
}

export default Chatbox