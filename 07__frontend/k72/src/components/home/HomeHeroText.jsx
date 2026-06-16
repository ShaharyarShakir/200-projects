import React from 'react'
import Video from "./Video"
const HomeHeroText = () => {
    return (
        <div className='p-5 font-[lause-300] text-white text-center uppercase'>
            <div className='flex justify-center items-start text-[9.5vw] leading-[8vw]'>L'étincelle   </div>
            <div className='flex justify-center items-start text-[9.5vw] leading-[8vw]'>
                qui
                <div className='-mt-3 rounded-full w-[16vw] h-[7vw] overflow-hidden'>
                    <Video />
                </div>
                génère
            </div>
            <div className='flex justify-center items-start text-[9.5vw] leading-[8vw]'>la créativité</div>

        </div>
    )
}

export default HomeHeroText
