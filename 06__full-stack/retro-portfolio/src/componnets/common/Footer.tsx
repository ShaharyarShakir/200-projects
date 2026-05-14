import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Data ──────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com/ShaharyarShakir', num: '01' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shaharyar-shakir-3674a027b/', num: '02' },
    { label: 'Twitter', href: 'https://twitter.com/yourusername', num: '03' },
    { label: 'Dev.to', href: 'https://dev.to/yourusername', num: '04' },
]

const STACK_LINKS = [
    { label: 'Astro', href: 'https://astro.build' },
    { label: 'React', href: 'https://react.dev' },
    { label: 'R3F', href: 'https://docs.pmnd.rs/react-three-fiber' },
    { label: 'GSAP', href: 'https://gsap.com' },
    { label: 'Tailwind CSS', href: 'https://tailwindcss.com' },
]

// ── Live clock hook ───────────────────────────────────────────────
function useClock() {
    const [time, setTime] = useState('--:--:--')
    const [tz, setTz] = useState('')

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            setTime(
                now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
            )
            setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    return { time, tz }
}

// ── Component ─────────────────────────────────────────────────────
export default function Footer() {
    const { time, tz } = useClock()
    const year = new Date().getFullYear()

    // Refs
    const footerRef = useRef<HTMLElement>(null)
    const col1Ref = useRef<HTMLDivElement>(null)
    const col2Ref = useRef<HTMLDivElement>(null)
    const col3Ref = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const dotRef = useRef<HTMLSpanElement>(null)

    // ── GSAP scroll-triggered entrance ───────────────────────────────
    useGSAP(() => {
        gsap.registerPlugin(ScrollTrigger)

        if (!col1Ref.current || !col2Ref.current || !col3Ref.current || !bottomRef.current) return

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: footerRef.current,
                start: 'top 85%',
                once: true,
            },
            defaults: { ease: 'power3.out' },
        })

        tl.from([col1Ref.current, col2Ref.current, col3Ref.current], {
            y: 40,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
        })
            .from(bottomRef.current.children, {
                y: 12,
                opacity: 0,
                duration: 0.4,
                stagger: 0.08,
            }, '-=0.3')

    }, { scope: footerRef, dependencies: [] })

    // ── Availability dot pulse (CSS keyframe via inline style) ────────
    // Injected once so it works inside React without a global stylesheet

    // ── Render ────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>

            <footer
                ref={footerRef}
                className="bg-[#0a0a0a] border-[#1e1e1e] border-t"
            >

                {/* ── Main grid: 3 columns ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-[#1e1e1e] border-b">

                    {/* Col 1 — Identity */}
                    <div
                        ref={col1Ref}
                        className="px-10 py-12 border-[#1e1e1e] md:border-r border-b md:border-b-0"
                    >
                        <p
                            className="mb-4 text-[#f0ede6] text-[64px] leading-none tracking-tight"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            YK.DEV
                        </p>

                        <p className="mb-6 max-w-[260px] text-[#555] text-[11px] leading-[1.9]">
                            DevOps · MLOps · Full-Stack · React Native.<br />
                            Building systems that scale.
                        </p>

                        {/* Availability badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1e1e1e]">
                            <span
                                ref={dotRef}
                                className="block bg-[#3ddc84] rounded-full w-1.5 h-1.5"
                                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                                aria-hidden="true"
                            />
                            <span className="text-[#555] text-[10px] uppercase tracking-[2px]">
                                Available for work
                            </span>
                        </div>
                    </div>

                    {/* Col 2 — Social links */}
                    <div
                        ref={col2Ref}
                        className="px-10 py-12 border-[#1e1e1e] md:border-r border-b md:border-b-0"
                    >
                        <p className="mb-6 text-[#333] text-[10px] uppercase tracking-[3px]">
              // Find me
                        </p>

                        <ul className="flex flex-col list-none" role="list">
                            {SOCIAL_LINKS.map(({ label, href, num }) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex justify-between items-center py-3 border-[#1e1e1e] border-b text-[#555] text-[11px] hover:text-[#f0ede6] no-underline uppercase tracking-[2px] transition-colors duration-150"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-[#2a2a2a] text-[9px] group-hover:text-[#c8f135] transition-colors duration-150">
                                                {num}
                                            </span>
                                            {label}
                                        </span>
                                        <span
                                            className="text-[#333] group-hover:text-[#c8f135] transition-all group-hover:translate-x-0.5 duration-150"
                                            aria-hidden="true"
                                        >
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3 — Stack + live clock */}
                    <div
                        ref={col3Ref}
                        className="flex flex-col px-10 py-12"
                    >
                        <p className="mb-6 text-[#333] text-[10px] uppercase tracking-[3px]">
              // Built with
                        </p>

                        <ul className="flex flex-col mb-10 list-none" role="list">
                            {STACK_LINKS.map(({ label, href }) => (
                                <li key={href}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex justify-between items-center py-2.5 border-[#1e1e1e] border-b text-[#555] text-[11px] hover:text-[#f0ede6] no-underline transition-colors duration-150"
                                    >
                                        {label}
                                        <span
                                            className="text-[#2a2a2a] text-[10px] group-hover:text-[#555] transition-colors duration-150"
                                            aria-hidden="true"
                                        >
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>

                        {/* Live clock */}
                        <div className="mt-auto">
                            <p className="mb-1 text-[#333] text-[10px] uppercase tracking-[2px]">
                // Your local time
                            </p>
                            <p
                                className="tabular-nums text-[#c8f135] text-[28px] leading-none"
                                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}
                                aria-live="polite"
                                aria-label={`Current local time: ${time}`}
                            >
                                {time}
                            </p>
                            <p className="mt-1 text-[#333] text-[10px] tracking-[1px]">
                                {tz || '\u00A0'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* ── Bottom bar ── */}
                <div
                    ref={bottomRef}
                    className="flex md:flex-row flex-col justify-between items-start md:items-center gap-3 px-10 py-5"
                >
                    <p className="text-[#333] text-[10px] tracking-[1px]">
                        © {year} YK.DEV — All rights reserved.
                    </p>

                    <p className="text-[#2a2a2a] text-[10px] tracking-[1px]">
                        Designed & built by{' '}
                        <span className="text-[#555]">Shaharyar Shakir</span>
                        {' '}· Deployed on{' '}
                        <span className="text-[#555]">Vercel</span>
                    </p>

                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="group flex items-center gap-2 bg-transparent border-none text-[#555] text-[10px] hover:text-[#c8f135] uppercase tracking-[2px] transition-colors duration-150 cursor-pointer"
                        aria-label="Back to top"
                    >
                        Back to top
                        <span
                            className="inline-block transition-transform group-hover:-translate-y-0.5 duration-150"
                            aria-hidden="true"
                        >
                            ↑
                        </span>
                    </button>
                </div>

            </footer>
        </>
    )
}