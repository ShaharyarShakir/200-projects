import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function HeroIntro() {
    const containerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            delay: 0.15,
        })

        tl.from('.hero-tag', { y: 16, opacity: 0, duration: 0.5 })
            .from('.hero-name .line', {
                y: 72,
                opacity: 0,
                duration: 0.95,
                stagger: 0.1,
                ease: 'power4.out',
            }, '-=0.2')
            .from('.hero-role', { x: -16, opacity: 0, duration: 0.55 }, '-=0.45')
            .from('.hero-bio', { y: 12, opacity: 0, duration: 0.5 }, '-=0.3')
    }, { scope: containerRef })

    return (
        <div
            ref={containerRef}
            className="section-x flex h-full min-h-0 w-full min-w-0 flex-col justify-center py-8 sm:py-10 lg:py-12"
        >
            <p className="hero-tag mb-5 sm:mb-6 text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[2px] sm:tracking-[3px] leading-relaxed break-words">
                [ <span className="text-[#c8f135]">PORTFOLIO</span> ] — v2.0.25 — PRODUCTION
            </p>

            <div className="hero-name mb-4 overflow-hidden">
                <div
                    className="font-display text-[#f0ede6] text-[52px] sm:text-[68px] lg:text-[80px] xl:text-[88px] leading-[0.9] tracking-tight line"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    shaharyar
                </div>
                <div
                    className="font-display text-[#f0ede6] text-[52px] sm:text-[68px] lg:text-[80px] xl:text-[88px] leading-[0.9] tracking-tight line"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                    shakir
                </div>
            </div>

            <div className="hero-role mb-6 sm:mb-8 pl-3 border-[#c8f135] border-l-[3px]">
                <p className="text-[#c8f135] text-[12px] sm:text-[13px] uppercase tracking-[2px] sm:tracking-[3px] leading-relaxed">
                    DevOps · MLOps · Full-Stack
                    <span className="hidden sm:inline"> · </span>
                    <span className="block sm:inline">React Native</span>
                </p>
            </div>

            <p className="hero-bio max-w-full text-[#888] text-[14px] sm:text-[15px] leading-[1.85] lg:max-w-[420px]">
                Building resilient systems at the intersection of infrastructure,
                machine learning pipelines, and product engineering. From container
                orchestration to mobile delivery — I ship things that scale.
            </p>
        </div>
    )
}
