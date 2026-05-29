// src/components/stack/StackSidebar.tsx
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { STACK_DATA } from './stackData'
import type { StackCategory } from './stackData'

interface StackSidebarProps {
    active: StackCategory
    onChange: (id: StackCategory) => void
}

export default function StackSidebar({ active, onChange }: StackSidebarProps) {
    const indicatorRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    // ── Slide the acid-green indicator to the active item & center it on mobile ──
    useEffect(() => {
        const activeIdx = STACK_DATA.findIndex((s) => s.id === active)
        const btn = itemRefs.current[activeIdx]
        const indicator = indicatorRef.current
        if (!btn || !indicator) return

        // GSAP Responsive animation
        const mm = gsap.matchMedia()

        mm.add("(max-width: 1023px)", () => {
            // Horizontal indicator at the bottom of the tab bar
            gsap.set(indicator, { left: 0, top: 'auto', bottom: 0, height: 3, y: 0 })
            gsap.to(indicator, {
                x: btn.offsetLeft,
                width: btn.offsetWidth,
                duration: 0.35,
                ease: 'power3.out',
            })

            // Scroll the active tab button into view on mobile
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        })

        mm.add("(min-width: 1024px)", () => {
            // Vertical indicator on the left edge of the sidebar
            gsap.set(indicator, { left: 0, top: 0, bottom: 'auto', width: 3, x: 0 })
            gsap.to(indicator, {
                y: btn.offsetTop,
                height: btn.offsetHeight,
                duration: 0.35,
                ease: 'power3.out',
            })
        })

        return () => mm.revert()
    }, [active])

    return (
        <div className="relative border-b lg:border-b-0 lg:border-r border-[#1e1e1e] flex-shrink-0 w-full lg:w-[200px] flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible scrollbar-none">

            {/* Sliding active indicator */}
            <div
                ref={indicatorRef}
                className="absolute bg-[#c8f135]"
                aria-hidden="true"
            />

            {STACK_DATA.map((section, i) => {
                const isActive = active === section.id
                return (
                    <button
                        key={section.id}
                        ref={(el) => { itemRefs.current[i] = el }}
                        onClick={() => onChange(section.id)}
                        className="
              flex-shrink-0 w-auto lg:w-full text-left px-6 py-4 sm:px-8 sm:py-5 lg:px-6 lg:py-5
              border-r lg:border-r-0 lg:border-b last:border-r-0 border-[#1e1e1e]
              bg-transparent cursor-pointer
              transition-colors duration-150
              hover:bg-[#0d0d0d]
              group
            "
                        aria-pressed={isActive}
                        aria-label={`${section.label} stack`}
                    >
                        {/* Number */}
                        <span
                            className="block text-[9px] font-mono tracking-[2px] mb-1.5 transition-colors duration-150"
                            style={{ color: isActive ? section.color : '#2a2a2a' }}
                        >
                            {section.num}
                        </span>

                        {/* Label */}
                        <span
                            className="block text-[11px] font-mono tracking-[1.5px] uppercase transition-colors duration-150"
                            style={{ color: isActive ? '#f0ede6' : '#555' }}
                        >
                            {section.label}
                        </span>

                        {/* Item count */}
                        <span
                            className="block text-[9px] font-mono mt-1.5 transition-colors duration-150"
                            style={{
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: '20px',
                                lineHeight: 1,
                                color: isActive ? section.color : '#1e1e1e',
                            }}
                        >
                            {String(section.items.length).padStart(2, '0')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}