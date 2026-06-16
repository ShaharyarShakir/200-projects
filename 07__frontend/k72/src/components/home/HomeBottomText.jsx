import React from 'react'
import { Link } from 'react-router-dom'
const HomeBottomText = () => {
    return (

        <div className='flex justify-center items-center gap-2 font-[lause-500] text-white'>
            <div className='flex items-center px-3 lg:px-14 pt-1 border-2 border-white lg:border-3 hover:border-[#D3FD50] rounded-full lg:h-44 hover:text-[#D3FD50] uppercase'>
                <Link className='mt-6 text-[6vw]' to={'/projects'}>projects</Link>
            </div>
            <div className='flex items-center px-3 lg:px-14 pt-1 border-2 border-white lg:border-3 hover:border-[#D3FD50] rounded-full lg:h-44 hover:text-[#D3FD50] uppercase'>
                <Link className='mt-6 text-[6vw]' to={'/agence'}>agence</Link>
            </div>
        </div>

    )
}

export default HomeBottomText
