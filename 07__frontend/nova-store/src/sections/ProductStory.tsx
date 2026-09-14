import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { ProductStoryScene } from '../components-3d/ProductStoryScene'
// Anime available for stage transitions
const stages = [
  { num: '01', label: 'DESIGN', desc: 'Minimal by intention.' },
  { num: '02', label: 'COMFORT', desc: 'Built for all-day listening.' },
  { num: '03', label: 'ENGINEERING', desc: 'Precision in every layer.' },
  { num: '04', label: 'READY', desc: 'Your everyday sound system.' },
]

export function ProductStory() {
  const progressRef = useScrollProgress('product-story')
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll stage reveal
  useEffect(() => {
    const onScroll = () => {
      const p = progressRef.current
      const activeStage = Math.min(3, Math.floor(p * 4))
      stages.forEach((_, i) => {
        const el = document.querySelector(`.story-stage-${i}`)
        if (el) {
          const isActive = i === activeStage
          ;(el as HTMLElement).style.opacity = isActive ? '1' : '0.15'
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [progressRef])

  return (
    <section id="product-story" ref={containerRef} className="relative bg-neutral-950" style={{ height: '400vh' }}>
      {/* Sticky 3D layer */}
      <div className="sticky top-0 h-screen w-full z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true }}>
          <ProductStoryScene progress={progressRef.current} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Editorial text overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-xl space-y-8">
          {stages.map((s, i) => (
            <div key={i} className={`story-stage-${i} transition-opacity duration-700`} style={{ opacity: i === 0 ? 1 : 0.15 }}>
              <span className="text-xs text-gray-500 tracking-[0.3em]">{s.num}</span>
              <h3 className="text-4xl md:text-6xl font-light text-white tracking-tighter mt-2">{s.label}</h3>
              <p className="text-gray-400 text-lg mt-3">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-4 text-xs tracking-widest text-gray-500">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`${i === Math.min(3, Math.floor(progressRef.current * 4)) ? 'text-white' : ''}`}>{s.num}</span>
            <span className={`w-8 h-px ${i === Math.min(3, Math.floor(progressRef.current * 4)) ? 'bg-white' : 'bg-gray-700'}`} />
          </div>
        ))}
      </div>

      {/* Mobile horizontal indicator */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 text-xs text-gray-500">
        {stages.map((s, i) => (
          <span key={i} className={`${i === Math.min(3, Math.floor(progressRef.current * 4)) ? 'text-white' : ''}`}>{s.num}</span>
        ))}
      </div>
    </section>
  )
}
