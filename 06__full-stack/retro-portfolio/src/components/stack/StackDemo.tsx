// src/components/stack/StackDemo.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { STACK_DATA } from './stackData'

export default function StackDemo() {
  const containerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // ── Entrance animations via GSAP ──────────────────────────────────
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (headerRef.current) {
      gsap.from(Array.from(headerRef.current.children), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    }

    if (gridRef.current) {
      gsap.from(Array.from(gridRef.current.children), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }

    if (ctaRef.current) {
      gsap.from(ctaRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 92%',
          once: true,
        },
      })
    }
  }, { scope: containerRef })

  return (
    <section
      id="stack"
      ref={containerRef}
      className="border-b border-[#1e1e1e] bg-[#0a0a0a]"
    >
      {/* ── Section header ── */}
      <div
        ref={headerRef}
        className="flex flex-col md:flex-row md:items-end justify-between px-6 sm:px-10 md:px-12 pt-16 pb-10 border-b border-[#1e1e1e] gap-4"
      >
        <div>
          <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-3">
            <span className="text-[#c8f135]">02</span> — Tooling
          </p>
          <h2
            className="text-[56px] sm:text-[64px] leading-none text-[#f0ede6] tracking-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Tech Stack
          </h2>
        </div>
        <div className="flex flex-col gap-4 max-w-[420px] items-start w-full sm:w-auto">
          <p className="text-[12px] text-[#555] font-mono leading-[1.8]">
            A preview of my production tools and frameworks, organized by field of specialization.
          </p>
          <a
            href="/stack"
            className="post-cta-btn post-cta-btn--primary w-full sm:w-auto text-center py-2 min-h-[40px] text-[11px] tracking-[1.5px]"
          >
            Explore Full Stack →
          </a>
        </div>
      </div>

      {/* ── Body: Categories Grid ── */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 divide-y md:divide-y-0 sm:divide-x divide-[#1e1e1e] border-b border-[#1e1e1e]"
      >
        {STACK_DATA.map((section) => (
          <div
            key={section.id}
            className="group flex flex-col justify-between p-8 hover:bg-[#0d0d0d] transition-all duration-300 relative overflow-hidden"
          >
            {/* Top Hover Line in category color */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
              style={{ backgroundColor: section.color }}
            />

            <div>
              {/* Category header */}
              <div className="flex items-start justify-between mb-8">
                <span
                  className="text-[40px] leading-none text-[#1e1e1e] group-hover:text-[#2a2a2a] transition-colors duration-300 tabular-nums"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {section.num}
                </span>
                <span
                  className="text-[10px] font-mono tracking-[1.5px] uppercase border px-2 py-0.5"
                  style={{ borderColor: section.color, color: section.color }}
                >
                  {section.label}
                </span>
              </div>

              {/* Tagline */}
              <p className="text-[12px] text-[#888] group-hover:text-[#f0ede6] font-mono leading-[1.7] mb-8 transition-colors duration-250">
                {section.tagline}
              </p>
            </div>

            {/* Top 6 items preview */}
            <div>
              <p className="text-[9px] font-mono tracking-[1.5px] text-[#333] uppercase mb-3">
                Core Technologies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {section.items.slice(0, 6).map((item) => (
                  <span
                    key={item.name}
                    className="text-[9px] px-2 py-0.5 border border-[#1e1e1e] text-[#555] group-hover:text-[#f0ede6] group-hover:border-[#2a2a2a] font-mono tracking-[1px] transition-all duration-200"
                  >
                    {item.name}
                  </span>
                ))}
                {section.items.length > 6 && (
                  <span className="text-[9px] px-2 py-0.5 text-[#333] font-mono">
                    +{section.items.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Call to action ── */}
      <div
        ref={ctaRef}
        className="flex justify-center items-center py-12 px-6 bg-[#0a0a0a]/50"
      >
        <a
          href="/stack"
          className="post-cta-btn post-cta-btn--primary w-full sm:w-auto text-center"
        >
          Explore Full Interactive Stack →
        </a>
      </div>
    </section>
  )
}
