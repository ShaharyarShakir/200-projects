
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { PILLARS } from '../../utils/pillar-data'
import type { AboutBioProps } from '../../types/types'

export default function AboutBio({ introOnly = false }: AboutBioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bioRef = useRef<HTMLDivElement>(null)
  const pillarsRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)
    if (!bioRef.current) return

    gsap.from(Array.from(bioRef.current.children), {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: bioRef.current,
        start: 'top 85%',
        once: true,
      },
    })

    if (introOnly || !pillarsRef.current) return

    gsap.from(pillarsRef.current.querySelectorAll('.pillar-item'), {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: pillarsRef.current,
        start: 'top 85%',
        once: true,
      },
    })
  }, { scope: containerRef, dependencies: [introOnly] })

  return (
    <div
      ref={containerRef}
      className={
        introOnly
          ? 'section-x py-8 md:py-12'
          : 'section-x py-8 md:py-12 md:border-r border-[#1e1e1e] flex flex-col gap-10'
      }
    >

      {/* ── Bio ── */}
      <div ref={bioRef} className="flex flex-col gap-4">
        <p className="font-mono text-[#333] text-[11px] sm:text-[12px] uppercase tracking-[3px]">
          // Who I am
        </p>

        <p className="font-mono text-[#666] text-[14px] sm:text-[15px] leading-loose">
          I'm <span className="font-bold text-[#f0ede6]">Shaharyar Shakir</span> — a DevOps &
          MLOps engineer with full-stack and React Native capabilities.
          I work across the entire delivery lifecycle: from designing
          Kubernetes-based infrastructure and ML pipelines, to shipping
          production web apps and mobile products.
        </p>

        <p className="font-mono text-[#555] text-[14px] sm:text-[15px] leading-loose">
          My work sits at the intersection of infrastructure reliability,
          machine learning productionization, and modern product engineering.
          I care about systems that are observable, reproducible, and actually
          enjoyable to operate at 3am when something breaks.
        </p>

        <p className="font-mono text-[#555] text-[14px] sm:text-[15px] leading-loose">
          Based in <span className="text-[#f0ede6]">Pakistan</span> · Open to remote
          roles globally.
        </p>
      </div>

      {!introOnly && (
        <div ref={pillarsRef} className="flex flex-col">
          <p className="mb-4 font-mono text-[#333] text-[10px] uppercase tracking-[3px]">
            // How I work
          </p>

          {PILLARS.map(({ num, title, body }) => (
            <div
              key={num}
              className="flex gap-5 py-5 border-[#1e1e1e] border-t pillar-item"
            >
              <span
                className="mt-0.5 font-mono text-[#c8f135] text-[22px] leading-none shrink-0"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                aria-hidden="true"
              >
                {num}
              </span>

              <div>
                <p className="mb-1.5 font-mono font-bold text-[#f0ede6] text-[12px] tracking-[1px]">
                  {title}
                </p>
                <p className="font-mono text-[#555] text-[12px] leading-[1.8]">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}