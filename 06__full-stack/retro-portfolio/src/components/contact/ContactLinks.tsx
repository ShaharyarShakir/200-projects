// src/components/contact/ContactLinks.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Data ──────────────────────────────────────────────────────────
const LINKS = [
  {
    label: 'Email',
    value: 'shakirshaharyar125@gmail.com',
    href:  'mailto:shakirshaharyar125@gmail.com',
    note:  'Best way to reach me',
  },
  {
    label: 'GitHub',
    value: 'github.com/ShaharyarShakir',
    href:  'https://github.com/ShaharyarShakir',
    note:  'Code & open source',
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/shaharyar-shakir-3674a027b',
    href:  'https://www.linkedin.com/in/shaharyar-shakir-3674a027b',
    note:  'Professional network',
  },
  {
    label: 'Twitter / X',
    value: '@ShaharyarShakir',
    href:  'https://twitter.com/@ShaharyarShakir',
    note:  'Dev thoughts & hot takes',
  },
]

const AVAILABILITY = [
  { label: 'Full-time roles',      available: true  },
  { label: 'Freelance / contract', available: true  },
  { label: 'Open source collab',   available: true  },
  { label: 'Currently employed',   available: false },
]

// ── Component ─────────────────────────────────────────────────────
export default function ContactLinks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const linksRef     = useRef<HTMLDivElement>(null)
  const availRef     = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (linksRef.current) {
      gsap.from(linksRef.current.querySelectorAll('.link-row'), {
        x: -24,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: linksRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }

    if (availRef.current) {
      gsap.from(availRef.current.querySelectorAll('.avail-row'), {
        y: 16,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: availRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    }
  }, { scope: containerRef, dependencies: [] })

  return (
    <div
      ref={containerRef}
      className="section-x py-8 md:py-12 md:border-r border-[#1e1e1e] flex flex-col gap-10"
    >

      {/* ── Contact links ── */}
      <div ref={linksRef}>
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-4">
          // Reach me at
        </p>

        {LINKS.map(({ label, value, href, note }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="
              link-row group
              flex items-start justify-between gap-4
              py-4 border-b border-[#1e1e1e]
              no-underline transition-colors duration-150
              hover:bg-[#0f0f0f] -mx-6 sm:-mx-8 md:-mx-12 px-6 sm:px-8 md:px-12
            "
          >
            <div>
              <p className="text-[10px] tracking-[2px] text-[#333] uppercase font-mono mb-1">
                {label}
              </p>
              <p className="text-[13px] text-[#f0ede6] font-mono break-all group-hover:text-[#c8f135] transition-colors duration-150">
                {value}
              </p>
              <p className="text-[10px] text-[#333] font-mono mt-0.5">{note}</p>
            </div>
            <span
              className="
                text-[#2a2a2a] group-hover:text-[#c8f135]
                group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                transition-all duration-150 text-[16px] mt-4 flex-shrink-0
              "
              aria-hidden="true"
            >
              ↗
            </span>
          </a>
        ))}
      </div>

      {/* ── Availability ── */}
      <div ref={availRef}>
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-4">
          // Availability
        </p>

        {AVAILABILITY.map(({ label, available }) => (
          <div
            key={label}
            className="avail-row flex items-center justify-between py-3 border-b border-[#1e1e1e]"
          >
            <p className="text-[12px] text-[#555] font-mono">{label}</p>
            <div className="flex items-center gap-2">
              <span
                className="block w-1.5 h-1.5 rounded-full"
                style={{
                  background: available ? '#3ddc84' : '#333',
                  animation: available ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                }}
                aria-hidden="true"
              />
              <span
                className="text-[10px] tracking-[1px] uppercase font-mono"
                style={{ color: available ? '#3ddc84' : '#333' }}
              >
                {available ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}