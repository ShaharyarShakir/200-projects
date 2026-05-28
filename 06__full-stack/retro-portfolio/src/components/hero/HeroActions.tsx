import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export default function HeroActions() {
    const containerRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const root = containerRef.current
        if (!root) return

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            delay: 0.35,
            onComplete: () => {
                gsap.set(
                    root.querySelectorAll('.hero-cta > *, .hero-stats > *'),
                    { clearProps: 'opacity,transform' },
                )
            },
        })

        tl.from(root.querySelectorAll('.hero-cta > *'), {
            y: 14,
            opacity: 0,
            duration: 0.45,
            stagger: 0.1,
        }).from(root.querySelectorAll('.hero-stats > *'), {
            y: 14,
            opacity: 0,
            duration: 0.45,
            stagger: 0.08,
        }, '-=0.2')
    }, { scope: containerRef })

    const ctaClass = `
        relative z-10 inline-flex flex-col items-center justify-center gap-0
        w-full sm:w-auto min-w-0 sm:min-w-[148px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-sm
        bg-[#0a0a0a] border border-[#f0ede6] text-[#f0ede6]
        font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.18em]
        leading-[1.35] text-center no-underline
        transition-all duration-200
        hover:border-[#c8f135] hover:text-[#c8f135] hover:bg-[#111]
    `

    return (
        <div
            ref={containerRef}
            className="section-x relative z-10 flex h-full min-h-0 w-full min-w-0 flex-col justify-center gap-8 overflow-visible py-8 sm:py-10 lg:min-h-[220px] lg:py-10"
        >
            <div className="hero-cta flex flex-col sm:flex-row flex-wrap gap-3">
                <a href="/#blog" className={ctaClass}>
                    <span className="block">VIEW</span>
                    <span className="block">PROJECTS</span>
                </a>
                <a href="/contact" className={ctaClass}>
                    <span className="block">GET IN</span>
                    <span className="block">TOUCH</span>
                </a>
            </div>

            <div className="hero-stats grid min-w-0 grid-cols-3 gap-3 sm:gap-6 border-[#1e1e1e] border-t pt-6 sm:pt-8">
                {[
                    { value: '1+', label: 'Years Exp', border: 'pr-2 sm:pr-6 border-r' },
                    { value: '40+', label: 'Projects', border: 'px-2 sm:px-6 border-r' },
                    { value: '99%', label: 'Uptime SLA', border: 'pl-2 sm:pl-6' },
                ].map(({ value, label, border }) => (
                    <div key={label} className={`min-w-0 ${border} border-[#1e1e1e]`}>
                        <p
                            className="mb-1 text-[#c8f135] text-[30px] sm:text-[38px] lg:text-[42px] leading-none"
                            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        >
                            {value}
                        </p>
                        <p className="text-[#555] text-[11px] sm:text-[12px] uppercase tracking-[1px] sm:tracking-[2px] leading-tight">
                            {label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}
