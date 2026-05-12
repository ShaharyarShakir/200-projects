import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// ── Component ─────────────────────────────────────────────────────
export default function HeroText() {
    const containerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            delay: 0.2,
        })

        tl.from('.hero-tag', { y: 16, opacity: 0, duration: 0.5 })
            .from('.hero-name .line', {
                y: 80,
                opacity: 0,
                duration: 1,
                stagger: 0.12,
                ease: 'power4.out',
            }, '-=0.2')
            .from('.hero-role', { x: -16, opacity: 0, duration: 0.6 }, '-=0.5')
            .from('.hero-bio', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3')
            .from('.hero-cta > *', {
                y: 12,
                opacity: 0,
                duration: 0.4,
                stagger: 0.1,
            }, '-=0.2')
            .from('.hero-stats > *', {
                y: 12,
                opacity: 0,
                duration: 0.4,
                stagger: 0.1,
            }, '-=0.3')
    }, { scope: containerRef })

    return (
        <div ref={containerRef} className="flex flex-col justify-between px-12 py-14 h-full">

            {/* Top block */}
            <div>
                {/* Status tag */}
                <p className="mb-8 text-[#555] text-[10px] uppercase tracking-[3px] hero-tag">
                    [ <span className="text-[#c8f135]">PORTFOLIO</span> ] — v2.0.25 — PRODUCTION
                </p>

                {/* Name — clipped overflow for slide-up effect */}
                <div className="mb-4 overflow-hidden hero-name">
                    <div
                        className="font-display text-[#f0ede6] text-[88px] leading-[0.9] tracking-tight line"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      shaharyar
                    </div>
                    <div
                        className="font-display text-[#f0ede6] text-[88px] leading-[0.9] tracking-tight line"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        shakir
                    </div>
                </div>

                {/* Role */}
                <div className="mb-10 pl-3 border-[#c8f135] border-l-[3px] hero-role">
                    <p className="text-[#c8f135] text-[11px] uppercase tracking-[4px]">
                        DevOps · MLOps · Full-Stack · React Native
                    </p>
                </div>

                {/* Bio */}
                <p className="max-w-[380px] text-[#555] text-[12px] leading-[1.9] hero-bio">
                    Building resilient systems at the intersection of infrastructure,
                    machine learning pipelines, and product engineering. From container
                    orchestration to mobile delivery — I ship things that scale.
                </p>
            </div>

            {/* Bottom block */}
            <div>
                {/* CTA buttons */}
                <div className="flex gap-3 mb-10 hero-cta">
                    <button
                        className="bg-[#c8f135] hover:bg-transparent px-6 py-2.5 border border-[#c8f135] font-mono text-[#0a0a0a] text-[11px] hover:text-[#c8f135] uppercase tracking-[2px] transition-all duration-150"
                    >
                        View Projects
                    </button>
                    <button
                        className="bg-transparent hover:bg-[#f0ede6] px-6 py-2.5 border border-[#333] font-mono text-[#f0ede6] text-[11px] hover:text-[#0a0a0a] uppercase tracking-[2px] transition-all duration-150"
                    >
                        Get in Touch
                    </button>
                </div>

                {/* Stats */}
                <div className="flex gap-0 pt-8 border-[#1e1e1e] border-t hero-stats">
                    <div className="pr-10 border-[#1e1e1e] border-r">
                        <p
                            className="mb-1 text-[#c8f135] text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            5+
                        </p>
                        <p className="text-[#555] text-[10px] uppercase tracking-[2px]">Years Exp</p>
                    </div>
                    <div className="px-10 border-[#1e1e1e] border-r">
                        <p
                            className="mb-1 text-[#c8f135] text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            40+
                        </p>
                        <p className="text-[#555] text-[10px] uppercase tracking-[2px]">Projects</p>
                    </div>
                    <div className="pl-10">
                        <p
                            className="mb-1 text-[#c8f135] text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            99%
                        </p>
                        <p className="text-[#555] text-[10px] uppercase tracking-[2px]">Uptime SLA</p>
                    </div>
                </div>
            </div>

        </div>
    )
}