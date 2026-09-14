import { useEffect, useRef } from 'react'
import { Button } from '../components/ui/Button'
import { HeroScene } from '../components-3d/HeroScene'
import { anime } from 'animejs'

export function Hero() {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (textRef.current) {
      const elements = textRef.current.querySelectorAll('.anim-item')
      anime({
        targets: elements,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(150),
        easing: 'easeOutExpo',
        duration: 800,
      })
    }
  }, [])

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* Layer 2: 3D Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <HeroScene />
      </div>

      {/* Layer 1: DOM Content */}
      <div ref={textRef} className="relative z-10 min-h-screen flex flex-col items-start justify-center px-6 md:px-12 lg:px-24 pt-24 pb-32">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-7xl md:text-9xl font-light tracking-tighter text-white anim-item opacity-0">
            NOVA
          </h1>
          <h2 className="text-2xl md:text-4xl font-light text-gray-300 leading-tight anim-item opacity-0">
            Objects designed for<br />
            the next everyday.
          </h2>
          <div className="anim-item opacity-0">
            <Button
              variant="primary"
              onClick={() => {
                anime({
                  targets: '.hero-subtle',
                  opacity: [1, 0.5, 1],
                  duration: 300,
                  easing: 'easeInOutQuad',
                })
              }}
            >
              Explore collection
            </Button>
          </div>
        </div>

        {/* Bottom scroll indicator */}
        <div className="absolute bottom-8 left-6 md:left-12 text-xs text-gray-500 tracking-widest anim-item opacity-0">
          SCROLL TO EXPLORE ↓
        </div>
      </div>
    </section>
  )
}
