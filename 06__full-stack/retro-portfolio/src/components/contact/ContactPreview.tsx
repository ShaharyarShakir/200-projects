import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export default function ContactPreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!sectionRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
      },
      defaults: { ease: 'power3.out' },
    })

    tl.from(numRef.current, { x: -20, opacity: 0, duration: 0.5 })
      .from(headingRef.current, { y: 40, opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.2')
      .from(subRef.current, { y: 14, opacity: 0, duration: 0.45 }, '-=0.35')
      .from(lineRef.current, { scaleX: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.2')
      .from(ctaRef.current, { y: 12, opacity: 0, duration: 0.5 }, '-=0.15')

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0.55,
        scale: 1.08,
        duration: 2.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
    }
  }, { scope: sectionRef, dependencies: [] })

  useGSAP(() => {
    const btn = ctaRef.current
    if (!btn) return

    const onEnter = () => {
      gsap.to(btn, {
        scale: 1.03,
        boxShadow: '0 0 28px rgba(200,241,53,0.35)',
        duration: 0.25,
        ease: 'power2.out',
      })
    }
    const onLeave = () => {
      gsap.to(btn, {
        scale: 1,
        boxShadow: '0 0 0 rgba(200,241,53,0)',
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    btn.addEventListener('mouseenter', onEnter)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mouseenter', onEnter)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, { scope: ctaRef, dependencies: [] })

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative border-b border-[#1e1e1e] overflow-hidden"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] rounded-full opacity-30 hidden sm:block"
        style={{
          background: 'radial-gradient(circle, rgba(200,241,53,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative section-x py-12 sm:py-16 md:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
        <div className="max-w-[640px]">
          <span
            ref={numRef}
            className="block text-[11px] sm:text-[12px] tracking-[3px] text-[#c8f135] uppercase font-mono mb-4"
          >
            06 — Contact
          </span>

          <h2
            ref={headingRef}
            className="text-[52px] sm:text-[60px] md:text-[72px] leading-[0.92] tracking-tight text-[#f0ede6] mb-5"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Let&apos;s <span className="text-[#c8f135]">Talk</span>
          </h2>

          <p
            ref={subRef}
            className="text-[14px] sm:text-[15px] text-[#666] font-mono leading-[1.85] max-w-[420px] mb-8"
          >
            DevOps, MLOps, full-stack, or mobile — form and links live on the contact page.
          </p>

          <div
            ref={lineRef}
            className="h-px w-full max-w-[200px] bg-[#c8f135] origin-left mb-8"
            aria-hidden="true"
          />

          <div className="flex items-center gap-2 mb-6" aria-label="Open to work">
            <span
              className="block bg-[#3ddc84] rounded-full w-1.5 h-1.5"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
              aria-hidden="true"
            />
            <span className="text-[#555] text-[12px] uppercase tracking-[2px] font-mono">
              Open to work · Remote-first
            </span>
          </div>
        </div>

        <a
          ref={ctaRef}
          href="/contact"
          className="group w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-3 bg-transparent hover:bg-[#c8f135] px-6 sm:px-8 py-4 border border-[#c8f135] text-[#c8f135] hover:text-[#0a0a0a] text-[13px] sm:text-[14px] uppercase tracking-[2px] font-mono no-underline transition-colors duration-150"
        >
          Get in touch
          <span
            className="transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </a>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </section>
  )
}
