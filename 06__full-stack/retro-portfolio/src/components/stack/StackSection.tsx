// src/components/stack/StackSection.tsx
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { STACK_DATA } from './stackData'
import type { StackCategory } from './stackData'
import StackSidebar from './StackSidebar'
import StackContent from './StackContent'

export default function StackSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const bodyRef = useRef<HTMLDivElement>(null)

    const [active, setActive] = useState<StackCategory>('devops')

    const activeSection = STACK_DATA.find((s) => s.id === active)!

    // ── Scroll entrance ──────────────────────────────────────────────
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
                    start: 'top 85%',
                    once: true,
                },
            })
        }

        if (bodyRef.current) {
            gsap.from(bodyRef.current, {
                y: 30,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: bodyRef.current,
                    start: 'top 88%',
                    once: true,
                },
            })
        }
    }, { scope: sectionRef, dependencies: [] })

    return (
        <section
            id="stack"
            ref={sectionRef}
            className="border-b border-[#1e1e1e]"
        >

            {/* ── Section header ── */}
            <div
                ref={headerRef}
                className="flex items-end justify-between px-12 pt-16 pb-10 border-b border-[#1e1e1e]"
            >
                <div>
                    <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-3">
                        <span className="text-[#c8f135]">02</span> — Tooling
                    </p>
                    <h2
                        className="text-[64px] leading-none text-[#f0ede6] tracking-tight"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        Tech Stack
                    </h2>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 pb-2">
                    {[
                        { label: 'Expert', color: '#c8f135' },
                        { label: 'Advanced', color: '#3ddc84' },
                        { label: 'Intermediate', color: '#fbbf24' },
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span
                                className="block w-2 h-2 rounded-full"
                                style={{ background: color }}
                                aria-hidden="true"
                            />
                            <span className="text-[9px] font-mono text-[#333] uppercase tracking-[1px]">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Body: sidebar + content ── */}
            <div
                ref={bodyRef}
                className="flex"
                style={{ minHeight: '560px' }}
            >
                <StackSidebar active={active} onChange={setActive} />

                <div className="flex-1 min-w-0">
                    <StackContent section={activeSection} />
                </div>
            </div>

        </section>
    )
}