// src/components/about/AboutBio.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Data ──────────────────────────────────────────────────────────
const PILLARS = [
  {
    num: '01',
    title: 'Infrastructure First',
    body: "If the foundation isn't solid, nothing on top of it will be. I design for failure before I design for features — SLOs, runbooks, and observability aren't afterthoughts.",
  },
  {
    num: '02',
    title: 'ML in Production',
    body: "There's a huge gap between a notebook that works and an ML system that serves millions of requests reliably. I build the pipelines, feature stores, and serving infra that bridge that gap.",
  },
  {
    num: '03',
    title: 'Full-Stack Ownership',
    body: "I don't stop at the API boundary. From Postgres schema to React Native screen, I take ownership of the whole delivery surface — web, mobile, and the infrastructure underneath.",
  },
]

interface AboutBioProps {
  /** Home teaser: only the // Who I am block (no pillars). */
  introOnly?: boolean
}

// ── Component ─────────────────────────────────────────────────────
export default function AboutBio({ introOnly = false }: AboutBioProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bioRef       = useRef<HTMLDivElement>(null)
  const pillarsRef   = useRef<HTMLDivElement>(null)

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
          ? 'px-12 py-12'
          : 'px-12 py-12 border-r border-[#1e1e1e] flex flex-col gap-10'
      }
    >

      {/* ── Bio ── */}
      <div ref={bioRef} className="flex flex-col gap-4">
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono">
          // Who I am
        </p>

        <p className="text-[13px] text-[#666] leading-[2] font-mono">
          I'm <span className="text-[#f0ede6] font-bold">Shaharyar Shakir</span> — a DevOps &
          MLOps engineer with full-stack and React Native capabilities.
          I work across the entire delivery lifecycle: from designing
          Kubernetes-based infrastructure and ML pipelines, to shipping
          production web apps and mobile products.
        </p>

        <p className="text-[13px] text-[#555] leading-[2] font-mono">
          My work sits at the intersection of infrastructure reliability,
          machine learning productionization, and modern product engineering.
          I care about systems that are observable, reproducible, and actually
          enjoyable to operate at 3am when something breaks.
        </p>

        <p className="text-[13px] text-[#555] leading-[2] font-mono">
          Based in <span className="text-[#f0ede6]">Pakistan</span> · Open to remote
          roles globally.
        </p>
      </div>

      {!introOnly && (
        <div ref={pillarsRef} className="flex flex-col">
          <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-4">
            // How I work
          </p>

          {PILLARS.map(({ num, title, body }) => (
            <div
              key={num}
              className="pillar-item flex gap-5 py-5 border-t border-[#1e1e1e]"
            >
              <span
                className="text-[#c8f135] font-mono text-[22px] leading-none mt-0.5 flex-shrink-0"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                aria-hidden="true"
              >
                {num}
              </span>

              <div>
                <p className="text-[12px] text-[#f0ede6] font-mono font-bold mb-1.5 tracking-[1px]">
                  {title}
                </p>
                <p className="text-[12px] text-[#555] font-mono leading-[1.8]">
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