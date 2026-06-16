import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'
import React from 'react'
import { useRef } from 'react'

export default function Agence() {
    gsap.registerPlugin(ScrollTrigger)
    const imageDivRef = useRef(null)
    const imageRef = useRef(null)

    const imageArray = [
        'https://k72.ca/uploads/teamMembers/Carl_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/Olivier_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/Lawrence_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/HugoJoseph_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/ChantalG_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/MyleneS_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/SophieA_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/Claire_480x640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/Michele_480X640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/MEL_480X640-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/CAMILLE_480X640_2-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/MAXIME_480X640_2-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/MEGGIE_480X640_2-480x640.jpg',
        'https://k72.ca/uploads/teamMembers/joel_480X640_3-480x640.jpg',
    ]
    useGSAP(function () {
        gsap.to(imageDivRef.current, {
            scrollTrigger: {
                trigger: imageDivRef.current,
                markers: true,
                start: "top 28%",
                end: "top -70%",
                scrub: true,
                pin: true,
                onUpdate: (element) => {
                    let imageIndex;
                    if (element.progress < 1) {
                        imageIndex = Math.floor(element.progress * imageArray.length)
                    } else {
                        imageIndex = imageArray.length - 1
                    }
                    imageRef.current.src = imageArray[imageIndex]
                }
            }
        })
    })
    return (
        <div>
            <div className='section-1'>
                <div ref={imageDivRef} className='top-60 left-[30vw] absolute rounded-4xl w-[15vw] h-[20vw] overflow-hidden'>
                    <img ref={imageRef} className='w-full h-full object-cover' src='https://k72.ca/images/teamMembers/Carl_480x640.jpg?w=480&h=640&fit=crop&s=f0a84706bc91a6f505e8ad35f520f0b7' />
                </div>
                <div className='relative font-[lause-300] text-white'>
                    <div className='mt-[55vh]'>
                        <h1 className='text-[20vw] text-center uppercase leading-[17vw]'>Soixan7e <br />
                            Douze</h1>
                    </div>
                    <div className='mt-20 pl-[40%]'>
                        <p className='text-6xl'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Notre curiosité nourrit notre créativité. On reste humbles et on dit non aux gros egos, même le vôtre. Une marque est vivante. Elle a des valeurs, une personnalité, une histoire. Si on oublie ça, on peut faire de bons chiffres à court terme, mais on la tue à long terme. C’est pour ça qu’on s’engage à donner de la perspective, pour bâtir des marques influentes</p>
                    </div>
                </div>
            </div>
            <div className="h-screen section-2"></div>
        </div>
    )
}
