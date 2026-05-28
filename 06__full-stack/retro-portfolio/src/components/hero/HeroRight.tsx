import { useRef } from 'react'
import { Suspense } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import HeroScene from './HeroScene'
import Terminal from './Terminal'
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

export default function HeroRight() {
    const showScene = useLgUp()
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<HTMLDivElement>(null)
    const scanRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!containerRef.current) return

        const tl = gsap.timeline({ delay: 0.35, defaults: { ease: 'power3.out' } })

        if (sceneRef.current) {
            tl.from(sceneRef.current, {
                opacity: 0,
                scale: 0.94,
                duration: 0.75,
            })
            if (scanRef.current) {
                gsap.fromTo(
                    scanRef.current,
                    { y: '-100%', opacity: 0.6 },
                    {
                        y: '200%',
                        opacity: 0,
                        duration: 2.2,
                        ease: 'none',
                        repeat: -1,
                        repeatDelay: 1.5,
                    },
                )
            }
        }

        if (terminalRef.current) {
            tl.from(
                terminalRef.current,
                { opacity: 0, x: sceneRef.current ? 28 : 0, y: sceneRef.current ? 0 : 20, duration: 0.65 },
                sceneRef.current ? '-=0.45' : 0,
            )
        }
    }, { scope: containerRef, dependencies: [showScene] })

    return (
        <div
            ref={containerRef}
            className="w-full min-w-0 border-[#1e1e1e] border-t lg:border-t-0 lg:border-l lg:h-full lg:min-h-0"
        >
            <div
                className={[
                    'w-full min-w-0',
                    showScene
                        ? 'flex flex-col lg:grid lg:grid-cols-2 lg:h-full lg:min-h-[calc(100vh-56px)]'
                        : 'flex flex-col',
                ].join(' ')}
            >
                {/* 3D — desktop only, left half of 1:1 grid */}
                {showScene && (
                    <div
                        ref={sceneRef}
                        className="hero-scene-panel relative hidden lg:block min-h-0 h-full bg-[#080808] border-[#1e1e1e] border-r overflow-hidden"
                        aria-hidden={!showScene}
                    >
                        <Suspense fallback={<SceneFallback />}>
                            <HeroScene />
                        </Suspense>

                        <div
                            ref={scanRef}
                            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#c8f135]/10 to-transparent"
                            aria-hidden="true"
                        />

                        <div className="top-4 left-4 z-10 absolute flex items-center gap-2">
                            <span className="bg-[#3ddc84] rounded-full w-2 h-2 animate-pulse" />
                            <span className="text-[#555] text-[11px] uppercase tracking-[2px]">
                                Scene / Active
                            </span>
                        </div>
                    </div>
                )}

                {/* Terminal — full width mobile; right half on desktop */}
                <div
                    ref={terminalRef}
                    className="hero-terminal-panel w-full min-h-[280px] sm:min-h-[300px] h-[min(45vh,320px)] sm:h-[320px] lg:h-full lg:min-h-0 flex flex-col"
                >
                    <Terminal />
                </div>
            </div>
        </div>
    )
}
