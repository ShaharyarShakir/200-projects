// src/components/about/AboutHeader.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
 
export default function AboutHeader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const numRef       = useRef<HTMLSpanElement>(null)
  const labelRef     = useRef<HTMLParagraphElement>(null)
  const titleRef     = useRef<HTMLHeadingElement>(null)
  const lineRef      = useRef<HTMLDivElement>(null)
 
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!numRef.current || !labelRef.current || !titleRef.current || !lineRef.current) return
 
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        once: true,
      },
      defaults: { ease: 'power3.out' },
    })
 
    tl.from(numRef.current,   { x: -20, opacity: 0, duration: 0.5 })
      .from(labelRef.current, { x: -12, opacity: 0, duration: 0.4 }, '-=0.2')
      .from(titleRef.current, { y: 40,  opacity: 0, duration: 0.8 }, '-=0.2')
      .from(lineRef.current,  { scaleX: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.4')
 
  }, { scope: containerRef, dependencies: [] })
 
  return (
    <div
      ref={containerRef}
      className="px-12 pt-16 pb-10 border-b border-[#1e1e1e]"
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          ref={numRef}
          className="text-[#c8f135] font-mono text-[10px] tracking-[3px]"
        >
          02
        </span>
        <p
          ref={labelRef}
          className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono"
        >
          — About Me
        </p>
      </div>
 
      <div className="flex items-end justify-between">
        <h2
          ref={titleRef}
          className="text-[64px] leading-none text-[#f0ede6] tracking-tight"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          The Engineer
          <br />
          <span className="text-[#c8f135]">Behind the Stack</span>
        </h2>
 
        {/* Ghost text */}
        <p
          className="hidden md:block text-[10px] text-[#1e1e1e] font-mono tracking-[2px] uppercase pb-3"
        >
          // Shaharyar Shakir
        </p>
      </div>
 
      {/* Accent line */}
      <div
        ref={lineRef}
        className="mt-6 h-px bg-[#c8f135] origin-left"
        style={{ width: '80px' }}
        aria-hidden="true"
      />
    </div>
  )
}