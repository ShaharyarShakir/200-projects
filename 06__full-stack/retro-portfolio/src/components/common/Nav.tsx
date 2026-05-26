import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// ── Nav links data ────────────────────────────────────────────────
const NAV_LINKS = [
    { href: '/', label: 'Home', num: '00' },
    { href: '/#stack', label: 'Stack', num: '01' },
    { href: '/about', label: 'About', num: '02' },
    { href: '/#projects', label: 'Projects', num: '03' },
    { href: '/blog', label: 'Blog', num: '04' },
    { href: '/contact', label: 'Contact', num: '05' },
]

// ── Smooth scroll helper ──────────────────────────────────────────
function scrollToSection(hash: string) {
    const target = document.getElementById(hash)
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

// ── Component ─────────────────────────────────────────────────────
export default function Nav() {

    // Refs
    const navRef = useRef<HTMLElement>(null)
    const logoRef = useRef<HTMLAnchorElement>(null)
    const linksRef = useRef<HTMLUListElement>(null)
    const rightRef = useRef<HTMLDivElement>(null)
    const mobileMenuRef = useRef<HTMLDivElement>(null)
    const hbTopRef = useRef<HTMLSpanElement>(null)
    const hbMidRef = useRef<HTMLSpanElement>(null)
    const hbBotRef = useRef<HTMLSpanElement>(null)

    // State
    const [menuOpen, setMenuOpen] = useState(false)
    const [activeHref, setActiveHref] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActiveHref(window.window.location.pathname + (window.location.hash || ''))
        }
    }, [])

    // ── GSAP entrance animation ──────────────────────────────────────
    useGSAP(() => {
        if (!logoRef.current || !linksRef.current || !rightRef.current) return

        const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => {
                // Drop inline opacity/transform so hydration/remount never leaves logo /
                // “Hire me” stuck off-screen (from() x offsets). Do not clear navRef —
                // scroll-hide uses the same transform.
                const strip: HTMLElement[] = []
                if (logoRef.current) strip.push(logoRef.current)
                strip.push(...Array.from(linksRef.current!.children) as HTMLElement[])
                strip.push(...Array.from(rightRef.current!.children) as HTMLElement[])
                gsap.set(strip, { clearProps: 'opacity,transform' })
            },
        })

        tl.from(navRef.current, {
            y: -56,
            opacity: 0,
            duration: 0.6,
            delay: 0.1,
        })
            .from(logoRef.current, {
                opacity: 0,
                x: -12,
                duration: 0.4,
            }, '-=0.3')
            .from(Array.from(linksRef.current.children), {
                opacity: 0,
                y: -8,
                duration: 0.3,
                stagger: 0.06,
            }, '-=0.3')
            .from(rightRef.current.children, {
                opacity: 0,
                x: 12,
                duration: 0.4,
                stagger: 0.08,
            }, '-=0.4')
    }, { scope: navRef, dependencies: [] })

    // ── Hide / reveal nav on scroll ──────────────────────────────────
    useEffect(() => {
        let lastY = window.scrollY
        let ticking = false

        const onScroll = () => {
            if (ticking) return
            ticking = true

            requestAnimationFrame(() => {
                const currentY = window.scrollY
                const scrollingDown = currentY > lastY

                if (navRef.current) {
                    if (currentY > 80 && scrollingDown) {
                        gsap.to(navRef.current, {
                            y: -56,
                            duration: 0.3,
                            ease: 'power2.in',
                            overwrite: true,
                        })
                    } else {
                        gsap.to(navRef.current, {
                            y: 0,
                            duration: 0.35,
                            ease: 'power2.out',
                            overwrite: true,
                        })
                    }
                }

                lastY = currentY
                ticking = false
            })
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // ── IntersectionObserver — active section tracking ───────────────
    useEffect(() => {
        const sections = document.querySelectorAll<HTMLElement>('section[id]')

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveHref(`#${entry.target.id}`)
                    }
                })
            },
            { rootMargin: '-35% 0px -60% 0px', threshold: 0 }
        )

        sections.forEach((s) => observer.observe(s))
        return () => observer.disconnect()
    }, [])

    // ── Hamburger open / close ────────────────────────────────────────
    useEffect(() => {
        const top = hbTopRef.current
        const mid = hbMidRef.current
        const bot = hbBotRef.current
        const menu = mobileMenuRef.current
        if (!top || !mid || !bot || !menu) return

        if (menuOpen) {
            // Animate menu open
            gsap.to(menu, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' })
            gsap.to(top, { rotate: 45, y: 6, duration: 0.25 })
            gsap.to(mid, { opacity: 0, duration: 0.15 })
            gsap.to(bot, { rotate: -45, y: -6, width: 20, duration: 0.25 })
        } else {
            // Animate menu close
            gsap.to(menu, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.in' })
            gsap.to(top, { rotate: 0, y: 0, duration: 0.25 })
            gsap.to(mid, { opacity: 1, duration: 0.2 })
            gsap.to(bot, { rotate: 0, y: 0, width: 12, duration: 0.25 })
        }
    }, [menuOpen])

    // Close menu on Escape key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && menuOpen) setMenuOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [menuOpen])

    // ── Render ────────────────────────────────────────────────────────
    return (
        <>
            <header
                ref={navRef}
                className="top-0 right-0 left-0 z-40 fixed bg-[#0a0a0a]/90 backdrop-blur-sm border-[#1e1e1e] border-b h-14"
            >
                <nav
                    className="flex justify-between items-center px-4 sm:px-6 md:px-8 h-full"
                    aria-label="Main navigation"
                >

                    {/* ── Logo ── */}
                    <a
                        ref={logoRef}
                        href="/"
                        onClick={(e) => { e.preventDefault(); window.location.href = '/' }}
                        className="hover:opacity-60 text-[#c8f135] text-xl no-underline tracking-[4px] transition-opacity duration-150 select-none"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                        aria-label="YK.DEV — back to top"
                    >
                        YK.DEV
                    </a>

                    {/* ── Desktop links ── */}
                    <ul
                        ref={linksRef}
                        className="hidden md:flex items-center gap-1 list-none"
                        role="list"
                    >
                        {NAV_LINKS.map(({ href, label, num }) => {
                            const isActive = activeHref === href
                            return (
                                <li key={href}>
                                    <button
                                        onClick={() => {
                                            if (href.startsWith('/blog') || href === '/about' || href === '/contact') {
                                                window.location.href = href
                                            } else if (href.includes('#')) {
                                                const [path, hash] = href.split('#')
                                                if (window.location.pathname === path) {
                                                    scrollToSection(hash)
                                                } else {
                                                    window.location.href = href
                                                }
                                            } else {
                                                window.location.href = href
                                            }
                                        }}
                                        className={`
                                            group relative flex items-center gap-1.5 bg-transparent px-3 py-1.5 border-none
                                            text-[10px] uppercase tracking-[2px] cursor-pointer
                                            transition-colors duration-150
                                            ${isActive ? 'text-[#f0ede6]' : 'text-[#555] hover:text-[#f0ede6]'}
                                        `}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {/* Number */}
                                        <span
                                            className={`
                                                inline-block origin-center font-mono text-[8px] transition-all duration-200 ease-out
                                                ${isActive
                                                    ? 'text-[#c8f135]'
                                                    : 'text-[#333]'
                                                }
                                                group-hover:scale-[1.18] group-hover:text-[#c8f135]
                                                group-hover:[text-shadow:0_0_10px_rgba(200,241,53,0.75),0_0_22px_rgba(200,241,53,0.35)]
                                            `}
                                        >
                                            {num}
                                        </span>

                                        {label}

                                        {/* Underline: active or hover */}
                                        <span
                                            className={`
                                                absolute bottom-0 left-3 right-3 h-px origin-left bg-[#c8f135]
                                                transition-transform duration-200 ease-out
                                                ${isActive ? 'scale-x-100' : 'scale-x-0'}
                                                group-hover:scale-x-100
                                            `}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* ── Right: status + CTA ── */}
                    <div
                        ref={rightRef}
                        className="hidden md:flex items-center gap-6"
                    >
                        {/* Availability dot */}
                        <div className="flex items-center gap-2" aria-label="Open to work">
                            <span
                                className="block bg-[#3ddc84] rounded-full w-1.5 h-1.5"
                                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                                aria-hidden="true"
                            />
                            <span className="text-[#555] text-[10px] uppercase tracking-[2px]">
                                Open to work
                            </span>
                        </div>

                        {/* Hire me */}
                        <button
                            onClick={() => { window.location.href = '/contact' }}
                            className="bg-transparent hover:bg-[#c8f135] px-4 py-1.5 border border-[#c8f135] text-[#c8f135] text-[10px] hover:text-[#0a0a0a] uppercase tracking-[2px] transition-all duration-150 cursor-pointer"
                        >
                            Hire Me
                        </button>
                    </div>

                    {/* ── Mobile: hamburger ── */}
                    <button
                        className="md:hidden flex flex-col justify-center items-center gap-[5px] bg-transparent border-none w-8 h-8 cursor-pointer"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                    >
                        <span ref={hbTopRef} className="block bg-[#f0ede6] w-5 h-px origin-center" />
                        <span ref={hbMidRef} className="block bg-[#f0ede6] w-5 h-px" />
                        <span ref={hbBotRef} className="block bg-[#c8f135] w-3 h-px origin-center" />
                    </button>

                </nav>

                {/* ── Mobile menu ── */}
                <div
                    ref={mobileMenuRef}
                    id="mobile-menu"
                    className="md:hidden bg-[#0a0a0a] border-[#1e1e1e] border-t overflow-hidden"
                    style={{ height: 0, opacity: 0 }}
                    role="dialog"
                    aria-label="Mobile navigation"
                >
                    <ul className="flex flex-col py-2 list-none" role="list">
                        {NAV_LINKS.map(({ href, label, num }) => {
                            const isActive = activeHref === href
                            return (
                                <li key={href}>
                                    <button
                                        onClick={() => {
                                            if (href.startsWith('/blog') || href === '/about' || href === '/contact') {
                                                window.location.href = href
                                            } else if (href.includes('#')) {
                                                const [path, hash] = href.split('#')
                                                if (window.location.pathname === path) {
                                                    scrollToSection(hash)
                                                } else {
                                                    window.location.href = href
                                                }
                                            } else {
                                                window.location.href = href
                                            }
                                            setMenuOpen(false)
                                        }}
                                        className="flex items-center gap-3 bg-transparent hover:bg-[#111] px-4 sm:px-6 md:px-8 py-3 border-none w-full text-[11px] text-left uppercase tracking-[2px] transition-all duration-150 cursor-pointer"
                                        style={{ color: isActive ? '#f0ede6' : '#555' }}
                                    >
                                        <span
                                            className="text-[9px]"
                                            style={{ color: isActive ? '#c8f135' : '#333' }}
                                        >
                                            {num}
                                        </span>
                                        {label}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    {/* Mobile bottom bar */}
                    <div className="flex justify-between items-center px-4 sm:px-6 md:px-8 pt-3 pb-5 border-[#1e1e1e] border-t">
                        <div className="flex items-center gap-2">
                            <span className="block bg-[#3ddc84] rounded-full w-1.5 h-1.5" aria-hidden="true" />
                            <span className="text-[#555] text-[10px] uppercase tracking-[2px]">
                                Open to work
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                window.location.href = '/contact'
                                setMenuOpen(false)
                            }}
                            className="bg-transparent hover:bg-[#c8f135] px-4 py-1.5 border border-[#c8f135] text-[#c8f135] text-[10px] hover:text-[#0a0a0a] uppercase tracking-[2px] transition-all duration-150 cursor-pointer"
                        >
                            Hire Me
                        </button>
                    </div>
                </div>

            </header>

            {/* Spacer — pushes page content below fixed nav */}
            <div className="h-14" aria-hidden="true" />

            <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
        </>
    )
}
