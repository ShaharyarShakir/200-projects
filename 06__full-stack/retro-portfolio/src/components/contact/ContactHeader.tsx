// src/components/contact/ContactHeader.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export default function ContactHeader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const numRef       = useRef<HTMLSpanElement>(null)
  const headingRef   = useRef<HTMLHeadingElement>(null)
  const subRef       = useRef<HTMLParagraphElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!numRef.current || !headingRef.current || !subRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        once: true,
      },
      defaults: { ease: 'power3.out' },
    })

    tl.from(numRef.current,         { x: -20, opacity: 0, duration: 0.5 })
      .from(headingRef.current,     { y: 50,  opacity: 0, duration: 0.9, ease: 'power4.out' }, '-=0.2')
      .from(subRef.current,         { y: 16,  opacity: 0, duration: 0.5 }, '-=0.3')

  }, { scope: containerRef, dependencies: [] })

  return (
    <div
      ref={containerRef}
      className="section-x pt-10 md:pt-16 pb-8 md:pb-12 border-b border-[#1e1e1e]"
    >
      <span
        ref={numRef}
        className="block text-[10px] tracking-[3px] text-[#c8f135] uppercase font-mono mb-4"
      >
        06 — Contact
      </span>

      <h2
        ref={headingRef}
        className="text-[48px] sm:text-[64px] md:text-[80px] leading-[0.9] tracking-tight text-[#f0ede6] mb-6"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
      >
        Let's <span className="text-[#c8f135]">Build</span>
        <br />Something.
      </h2>

      <p
        ref={subRef}
        className="text-[12px] text-[#555] font-mono leading-[1.9] max-w-[480px]"
      >
        Open to Junior DevOps, MLOps, and full-stack roles. Also available
        for infrastructure consulting, ML platform buildouts, and React
        Native projects. Remote-first, worldwide.
      </p>
    </div>
  )
}