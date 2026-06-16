import React from 'react'
import Video from '../components/home/Video'
import HomeHeroText from "../components/home/HomeHeroText"
import HomeBottomText from "../components/home/HomeBottomText"

const Home = () => {
    return (
        <div className='text-white'>
            <div className='fixed w-screen h-screen'>
                <Video />
            </div>
            <div className='relative flex flex-col justify-between pb-5 w-screen h-screen overflow-hidden'>
                <HomeHeroText />
                <HomeBottomText />
            </div>
        </div>
    )
}

export default Home
