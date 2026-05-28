// src/components/stack/StackTechItem.tsx
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import type { TechItem } from './stackData'
import { PROFICIENCY_COLOR } from './stackData'

interface StackTechItemProps {
    item: TechItem
    color: string      // category accent color
    animate: boolean     // trigger bar animation when section becomes visible
}

export default function StackTechItem({ item, color, animate }: StackTechItemProps) {
    const [hovered, setHovered] = useState(false)
    const barFillRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const animatedRef = useRef(false)

    const profColor = PROFICIENCY_COLOR[item.proficiency]

    // ── Animate bar fill when triggered ─────────────────────────────
    useGSAP(() => {
        if (!animate || !barFillRef.current || animatedRef.current) return
        animatedRef.current = true

        gsap.fromTo(
            barFillRef.current,
            { width: '0%' },
            {
                width: `${item.pct}%`,
                duration: 1.1,
                ease: 'power2.out',
                delay: Math.random() * 0.3,   // slight random stagger per item
            }
        )
    }, { scope: containerRef, dependencies: [animate] })

    return (
        <div
            ref={containerRef}
            className="tech-item py-4 border-b border-[#1e1e1e] cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex items-start justify-between gap-4 mb-2">
                {/* Left: name + role */}
                <div className="flex items-baseline gap-3 min-w-0">
                    <span
                        className="text-[13px] font-mono font-bold transition-colors duration-150"
                        style={{ color: hovered ? color : '#f0ede6' }}
                    >
                        {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#333] uppercase tracking-[1px] truncate">
                        {item.role}
                    </span>
                </div>

                {/* Right: proficiency badge + since */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                        className="text-[9px] font-mono uppercase tracking-[1.5px] px-2 py-0.5 border"
                        style={{ borderColor: profColor, color: profColor }}
                    >
                        {item.proficiency}
                    </span>
                    <span className="text-[10px] font-mono text-[#2a2a2a]">
                        {item.since}
                    </span>
                </div>
            </div>

            {/* Proficiency bar */}
            <div className="h-px bg-[#1e1e1e] relative mb-2">
                <div
                    ref={barFillRef}
                    className="absolute top-0 left-0 h-full transition-none"
                    style={{ width: animate ? undefined : '0%', background: hovered ? color : profColor }}
                />
            </div>

            {/* Description — visible on hover */}
            <div
                className="overflow-hidden transition-all duration-200"
                style={{ maxHeight: hovered ? '40px' : '0px', opacity: hovered ? 1 : 0 }}
            >
                <p className="text-[11px] font-mono text-[#444] leading-[1.7] pt-1">
                    {item.description}
                </p>
            </div>
        </div>
    )
}