import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Terminal from './Terminal'

export default function HeroTerminalCell() {
    const containerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!containerRef.current) return

        gsap.from(containerRef.current, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            delay: 0.45,
            ease: 'power3.out',
        })
    }, { scope: containerRef })

    return (
        <div
            ref={containerRef}
            className="flex h-full min-h-[300px] w-full min-w-0 flex-col sm:min-h-[320px] lg:min-h-0"
        >
            <Terminal />
        </div>
    )
}
