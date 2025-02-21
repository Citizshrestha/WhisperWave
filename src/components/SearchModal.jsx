// import React from 'react'

import { RiSearchLine } from "react-icons/ri"

const SearchModal = () => {
  return (
    <div>
       <button className="bg-[#D9F2ED] w-[2.2rem] p-2 flex items-center justify-center rounded-lg ">
        <RiSearchLine color="#01AA85" className="w-[1.13rem] h-[1.13rem] "/>
       </button>
    </div>
  )
}

export default SearchModal