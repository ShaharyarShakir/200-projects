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
        <div
            ref={containerRef}
            className="section-x flex w-full min-w-0 flex-col gap-8 py-8 sm:gap-10 sm:py-10 md:py-14 lg:h-full lg:min-h-0 lg:justify-between lg:gap-0"
        >

            {/* Top block */}
            <div className="min-w-0">
                {/* Status tag */}
                <p className="mb-6 sm:mb-8 text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[2px] sm:tracking-[3px] leading-relaxed break-words hero-tag">
                    [ <span className="text-[#c8f135]">PORTFOLIO</span> ] — v2.0.25 — PRODUCTION
                </p>

                {/* Name — clipped overflow for slide-up effect */}
                <div className="mb-4 overflow-hidden hero-name">
                    <div
                        className="font-display text-[#f0ede6] text-[56px] sm:text-[72px] lg:text-[88px] leading-[0.9] tracking-tight line"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      shaharyar
                    </div>
                    <div
                        className="font-display text-[#f0ede6] text-[56px] sm:text-[72px] lg:text-[88px] leading-[0.9] tracking-tight line"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                        shakir
                    </div>
                </div>

                {/* Role */}
                <div className="mb-8 sm:mb-10 pl-3 border-[#c8f135] border-l-[3px] hero-role">
                    <p className="text-[#c8f135] text-[12px] sm:text-[13px] uppercase tracking-[2px] sm:tracking-[3px] leading-relaxed">
                        DevOps · MLOps · Full-Stack
                        <span className="hidden sm:inline"> · </span>
                        <span className="block sm:inline">React Native</span>
                    </p>
                </div>

                {/* Bio */}
                <p className="max-w-full sm:max-w-[380px] text-[#888] text-[14px] sm:text-[15px] leading-[1.85] hero-bio">
                    Building resilient systems at the intersection of infrastructure,
                    machine learning pipelines, and product engineering. From container
                    orchestration to mobile delivery — I ship things that scale.
                </p>
            </div>

            {/* Bottom block */}
            <div className="min-w-0">
                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8 sm:mb-10 hero-cta">
                    <button
                        type="button"
                        className="
                            inline-flex flex-col items-center justify-center gap-0
                            w-full sm:w-auto min-w-0 sm:min-w-[140px] px-5 sm:px-8 py-3.5 sm:py-4 rounded-sm
                            bg-transparent border border-[#f0ede6]/85
                            font-mono text-[#f0ede6] text-[12px] sm:text-[13px] uppercase tracking-[0.18em]
                            leading-[1.35] text-center
                            transition-all duration-200
                            hover:border-[#c8f135] hover:text-[#c8f135]
                        "
                    >
                        <span className="block">VIEW</span>
                        <span className="block">PROJECTS</span>
                    </button>
                    <a
                        href="/contact"
                        className="
                            inline-flex flex-col items-center justify-center gap-0
                            w-full sm:w-auto min-w-0 sm:min-w-[140px] px-5 sm:px-8 py-3.5 sm:py-4 rounded-sm
                            bg-transparent border border-[#f0ede6]/85
                            font-mono text-[#f0ede6] text-[12px] sm:text-[13px] uppercase tracking-[0.18em]
                            leading-[1.35] text-center no-underline
                            transition-all duration-200
                            hover:border-[#c8f135] hover:text-[#c8f135]
                        "
                    >
                        <span className="block">GET IN</span>
                        <span className="block">TOUCH</span>
                    </a>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-6 md:gap-8 pt-6 sm:pt-8 border-[#1e1e1e] border-t hero-stats min-w-0">
                    <div className="min-w-0 pr-1 sm:pr-6 md:pr-10 border-[#1e1e1e] border-r">
                        <p
                            className="mb-1 text-[#c8f135] text-[32px] sm:text-[40px] md:text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            1+
                        </p>
                        <p className="text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[1px] sm:tracking-[2px] leading-tight">Years Exp</p>
                    </div>
                    <div className="min-w-0 px-1 sm:px-6 md:px-10 border-[#1e1e1e] border-r">
                        <p
                            className="mb-1 text-[#c8f135] text-[32px] sm:text-[40px] md:text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            40+
                        </p>
                        <p className="text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[1px] sm:tracking-[2px] leading-tight">Projects</p>
                    </div>
                    <div className="min-w-0 pl-1 sm:pl-6 md:pl-10">
                        <p
                            className="mb-1 text-[#c8f135] text-[32px] sm:text-[40px] md:text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            99%
                        </p>
                        <p className="text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[1px] sm:tracking-[2px] leading-tight">Uptime SLA</p>
                    </div>
                </div>
            </div>

        </div>
    )
}