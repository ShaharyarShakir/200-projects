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
            onComplete: () => {
                const root = containerRef.current
                if (!root) return
                const selectors = [
                    '.hero-tag',
                    '.hero-name .line',
                    '.hero-role',
                    '.hero-bio',
                    '.hero-cta > *',
                    '.hero-stats > *',
                ]
                const els = selectors.flatMap((sel) =>
                    Array.from(root.querySelectorAll<HTMLElement>(sel)),
                )
                gsap.set(els, { clearProps: 'opacity,transform' })
            },
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
                <div className="flex flex-wrap gap-3 mb-10 hero-cta">
                    <button
                        type="button"
                        className="
                            inline-flex flex-col items-center justify-center gap-0
                            min-w-[148px] px-8 py-4 rounded-sm
                            bg-transparent border border-[#f0ede6]/85
                            font-mono text-[#f0ede6] text-[10px] uppercase tracking-[0.22em]
                            leading-[1.35] text-center
                            transition-all duration-200
                            hover:border-[#c8f135] hover:text-[#c8f135]
                        "
                    >
                        <span className="block">VIEW</span>
                        <span className="block">PROJECTS</span>
                    </button>
                    <button
                        type="button"
                        className="
                            inline-flex flex-col items-center justify-center gap-0
                            min-w-[148px] px-8 py-4 rounded-sm
                            bg-transparent border border-[#f0ede6]/85
                            font-mono text-[#f0ede6] text-[10px] uppercase tracking-[0.22em]
                            leading-[1.35] text-center
                            transition-all duration-200
                            hover:border-[#c8f135] hover:text-[#c8f135]
                        "
                    >
                        <span className="block">GET IN</span>
                        <span className="block">TOUCH</span>
                    </button>
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-8 border-[#1e1e1e] border-t hero-stats">
                    <div className="pr-10 border-[#1e1e1e] border-r">
                        <p
                            className="mb-1 text-[#c8f135] text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            1+
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