import { useRef } from 'react'
import { Suspense } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import HeroScene from './HeroScene'
import { useLgUp } from '../../utils/use-media-query'

function SceneFallback() {
    return (
        <div className="absolute inset-0 flex justify-center items-center">
            <span className="text-[#333] text-[11px] uppercase tracking-[3px] animate-pulse">
                Initialising scene...
            </span>
        </div>
    )
}

export default function HeroScenePanel() {
    const showScene = useLgUp()
    const panelRef = useRef<HTMLDivElement>(null)
    const scanRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!showScene || !panelRef.current) return

        gsap.from(panelRef.current, {
            opacity: 0,
            scale: 0.94,
            duration: 0.8,
            delay: 0.3,
            ease: 'power3.out',
        })

        if (scanRef.current) {
            gsap.fromTo(
                scanRef.current,
                { y: '-100%', opacity: 0.5 },
                {
                    y: '220%',
                    opacity: 0,
                    duration: 2.4,
                    ease: 'none',
                    repeat: -1,
                    repeatDelay: 1.2,
                },
            )
        }
    }, { scope: panelRef, dependencies: [showScene] })

    if (!showScene) return null

    return (
        <div
            ref={panelRef}
            className="hero-scene-panel relative hidden h-full min-h-0 w-full min-w-0 overflow-hidden bg-[#080808] lg:block"
        >
            <Suspense fallback={<SceneFallback />}>
                <HeroScene />
            </Suspense>

            <div
                ref={scanRef}
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#c8f135]/10 to-transparent"
                aria-hidden="true"
            />

            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#3ddc84]" />
                <span className="text-[#555] text-[11px] uppercase tracking-[2px]">
                    Scene / Active
                </span>
            </div>
        </div>
    )
}
