// src/components/stack/StackContent.tsx
import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import type { StackSection } from './stackData'
import StackTechItem from './StackTechItem'

interface StackContentProps {
    section: StackSection
}

export default function StackContent({ section }: StackContentProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const headlineRef = useRef<HTMLHeadingElement>(null)
    const taglineRef = useRef<HTMLParagraphElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [animateBars, setAnimateBars] = useState(false)

    // ── Animate on category switch ───────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        setAnimateBars(false)

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        tl.fromTo(containerRef.current,
            { opacity: 0, x: 16 },
            { opacity: 1, x: 0, duration: 0.35 }
        )

        if (headlineRef.current) {
            tl.from(Array.from(headlineRef.current.children), {
                y: 30, opacity: 0, duration: 0.55, stagger: 0.08,
            }, '-=0.2')
        }

        if (taglineRef.current) {
            tl.from(taglineRef.current, { y: 12, opacity: 0, duration: 0.4 }, '-=0.3')
        }

        if (listRef.current) {
            tl.from(listRef.current.querySelectorAll('.tech-item'), {
                y: 20, opacity: 0, duration: 0.4, stagger: 0.05,
            }, '-=0.25')
        }

        // Trigger bar animations after content appears
        const timer = setTimeout(() => setAnimateBars(true), 350)

        return () => {
            clearTimeout(timer)
            tl.kill()
        }
    }, [section.id])

    // ── Expert count stat ────────────────────────────────────────────
    const expertCount = section.items.filter((i) => i.proficiency === 'expert').length

    return (
        <div ref={containerRef} className="flex flex-col h-full">

            {/* ── Header ── */}
            <div
                className="px-4 sm:px-8 md:px-12 py-6 sm:py-8 md:py-10 border-b border-l-[3px] border-[#1e1e1e]"
                style={{ borderLeftColor: section.color }}
            >
                {/* Headline split into lines for stagger */}
                <h3
                    ref={headlineRef}
                    className="text-[36px] sm:text-[48px] md:text-[56px] leading-[0.95] tracking-tight text-[#f0ede6] mb-4 overflow-hidden"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    {section.headline.split('\n').map((line, i) => (
                        <span key={i} className="block" style={{ color: i === 1 ? section.color : '#f0ede6' }}>
                            {line}
                        </span>
                    ))}
                </h3>

                <p ref={taglineRef} className="text-[12px] text-[#555] font-mono leading-[1.8] max-w-[420px]">
                    {section.tagline}
                </p>

                {/* Mini stats row */}
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[#1e1e1e]">
                    <div>
                        <p
                            className="text-[32px] leading-none tabular-nums"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", color: section.color }}
                        >
                            {String(section.items.length).padStart(2, '0')}
                        </p>
                        <p className="text-[9px] font-mono text-[#333] tracking-[1.5px] uppercase mt-0.5">
                            Technologies
                        </p>
                    </div>
                    <div className="w-px h-8 bg-[#1e1e1e]" />
                    <div>
                        <p
                            className="text-[32px] leading-none tabular-nums"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", color: section.color }}
                        >
                            {String(expertCount).padStart(2, '0')}
                        </p>
                        <p className="text-[9px] font-mono text-[#333] tracking-[1.5px] uppercase mt-0.5">
                            Expert Level
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Tech list ── */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-4 sm:py-6">
                {section.items.map((item) => (
                    <StackTechItem
                        key={item.name}
                        item={item}
                        color={section.color}
                        animate={animateBars}
                    />
                ))}
            </div>

        </div>
    )
}