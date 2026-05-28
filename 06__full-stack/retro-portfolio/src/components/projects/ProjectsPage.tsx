// Full projects archive — page-load + scroll animations, filters, hover tilt
import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { PROJECTS, FILTER_TAGS, TAG_COLOR } from './projectsData'
import type { ProjectTag } from './projectsData'
import ProjectCard from './ProjectCard'

const MARQUEE_ITEMS = [
  'DVC', 'MLFLOW', 'LIGHTGBM', 'FASTAPI', 'NLTK',
  'PROMETHEUS',  'TF-IDF', 'UV', 'MLOPS',
]

export default function ProjectsPage() {
  const pageRef     = useRef<HTMLDivElement>(null)
  const heroRef     = useRef<HTMLElement>(null)
  const gridBgRef   = useRef<HTMLDivElement>(null)
  const marqueeRef  = useRef<HTMLDivElement>(null)
  const filterRef   = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const gridRef     = useRef<HTMLDivElement>(null)

  const [activeFilter, setActiveFilter] = useState<ProjectTag | 'all'>('all')

  const filtered = activeFilter === 'all'
    ? PROJECTS
    : PROJECTS.filter((p) => p.type === activeFilter)

  // ── Page load + ambient motion ───────────────────────────────────
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (gridBgRef.current) {
      gsap.to(gridBgRef.current, {
        backgroundPosition: '0px 48px',
        duration: 4,
        ease: 'none',
        repeat: -1,
      })
    }

    if (marqueeRef.current) {
      const track = marqueeRef.current.querySelector('.marquee-track')
      if (track) {
        gsap.to(track, {
          xPercent: -50,
          duration: 28,
          ease: 'none',
          repeat: -1,
        })
      }
    }

    if (heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.proj-eyebrow', { y: 14, opacity: 0, duration: 0.45 })
        .from('.proj-title-line', {
          y: 80,
          opacity: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power4.out',
        }, '-=0.15')
        .from('.proj-sub', { y: 16, opacity: 0, duration: 0.5 }, '-=0.35')
        .from('.proj-stat', { scale: 0.6, opacity: 0, duration: 0.55, ease: 'back.out(1.6)' }, '-=0.25')
    }

    if (filterRef.current) {
      gsap.from(Array.from(filterRef.current.querySelectorAll('button')), {
        y: 10,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        delay: 0.5,
        ease: 'power2.out',
      })
    }
  }, { scope: pageRef, dependencies: [] })

  // ── Card scroll entrance (re-run when filter changes) ─────────────
  useGSAP(() => {
    if (!gridRef.current) return

    const cards = gridRef.current.querySelectorAll('.project-card')
    gsap.fromTo(
      cards,
      { y: 48, opacity: 0, rotateX: 8 },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 88%',
          once: true,
        },
      },
    )

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === gridRef.current) st.kill()
      })
    }
  }, { scope: pageRef, dependencies: [activeFilter] })

  // ── Hover tilt on cards ───────────────────────────────────────────
  useGSAP(() => {
    if (!gridRef.current) return

    const cards = gridRef.current.querySelectorAll<HTMLElement>('.project-card')

    const cleanups: (() => void)[] = []

    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        gsap.to(card, {
          rotateY: x * 6,
          rotateX: -y * 5,
          transformPerspective: 800,
          duration: 0.35,
          ease: 'power2.out',
        })
      }
      const onLeave = () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.5,
          ease: 'power2.out',
        })
      }

      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, { scope: pageRef, dependencies: [activeFilter] })

  const moveIndicator = (btn: HTMLButtonElement) => {
    if (!indicatorRef.current || !filterRef.current) return
    const bar = filterRef.current
    gsap.to(indicatorRef.current, {
      x: btn.offsetLeft - bar.scrollLeft,
      width: btn.offsetWidth,
      duration: 0.35,
      ease: 'power3.out',
    })
  }

  useEffect(() => {
    const bar = filterRef.current
    if (!bar) return
    const activeBtn = bar.querySelector<HTMLButtonElement>('button[aria-selected="true"]')
    if (activeBtn) moveIndicator(activeBtn)
  }, [activeFilter])

  const handleFilter = (tag: ProjectTag | 'all', btn: HTMLButtonElement) => {
    if (!gridRef.current) {
      setActiveFilter(tag)
      moveIndicator(btn)
      return
    }

    gsap.to(gridRef.current, {
      opacity: 0,
      y: 12,
      scale: 0.98,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setActiveFilter(tag)
        moveIndicator(btn)
        gsap.fromTo(
          gridRef.current,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' },
        )
      },
    })
  }

  const marqueeDoubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div ref={pageRef} className="relative w-full overflow-x-hidden">
      {/* Animated grid backdrop */}
      <div
        ref={gridBgRef}
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(#1e1e1e 1px, transparent 1px),
            linear-gradient(90deg, #1e1e1e 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0',
        }}
        aria-hidden="true"
      />

      {/* Hero */}
      <header
        ref={heroRef}
        className="relative border-b border-[#1e1e1e] px-6 sm:px-10 md:px-12 pt-14 pb-12 md:pb-16"
      >
        <p className="proj-eyebrow text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-4">
          <span className="text-[#c8f135]">03</span> — Archive
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="overflow-hidden">
            <h1
              className="proj-title-line text-[56px] sm:text-[80px] md:text-[96px] leading-[0.92] text-[#f0ede6] tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              All
            </h1>
            <h1
              className="proj-title-line text-[56px] sm:text-[80px] md:text-[96px] leading-[0.92] tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <span className="text-[#c8f135]">Projects</span>
            </h1>
          </div>

          <div className="proj-stat flex items-end gap-6 lg:pb-2">
            <div className="text-right">
              <p
                className="text-[72px] md:text-[88px] leading-none text-[#1a1a1a] tabular-nums"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {String(PROJECTS.length).padStart(2, '0')}
              </p>
              <p className="text-[10px] tracking-[2px] text-[#333] uppercase font-mono -mt-1">
                Total builds
              </p>
            </div>
            <p className="proj-sub max-w-[280px] text-[12px] text-[#555] font-mono leading-[1.85] pb-2">
              Shipped work — expand a card for the full story, stack breakdown, and links.
            </p>
          </div>
        </div>
      </header>

      {/* Marquee */}
      <div
        ref={marqueeRef}
        className="relative border-b border-[#1e1e1e] overflow-hidden py-3 bg-[#080808]/80"
        aria-hidden="true"
      >
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {marqueeDoubled.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="text-[10px] tracking-[4px] uppercase font-mono text-[#2a2a2a]"
            >
              {label}
              <span className="mx-4 text-[#c8f135]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div
        ref={filterRef}
        className="relative flex items-center gap-2 px-6 sm:px-10 md:px-12 py-5 border-b border-[#1e1e1e] flex-wrap overflow-x-auto"
        role="tablist"
        aria-label="Filter projects by category"
      >
        <span
          ref={indicatorRef}
          className="absolute bottom-5 h-[calc(100%-2.5rem)] bg-[#111] border border-[#2a2a2a] pointer-events-none -z-0"
          style={{ left: 0, width: 0 }}
          aria-hidden="true"
        />

        {FILTER_TAGS.map(({ label, value }) => {
          const isActive = activeFilter === value
          const tagColor = value !== 'all' ? TAG_COLOR[value as ProjectTag] : '#f0ede6'

          return (
            <button
              key={value}
              onClick={(e) => handleFilter(value, e.currentTarget)}
              role="tab"
              aria-selected={isActive}
              className="
                relative z-10 px-3 py-1.5 text-[10px] tracking-[2px] uppercase font-mono
                border border-transparent bg-transparent cursor-pointer
                transition-colors duration-150
              "
              style={{ color: isActive ? tagColor : '#555' }}
            >
              {label}
              {value !== 'all' && (
                <span className="ml-1.5 text-[8px] opacity-50">
                  {PROJECTS.filter((p) => p.type === value).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative grid grid-cols-1 md:grid-cols-2"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {filtered.length > 0 ? (
          filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))
        ) : (
          <div className="col-span-2 px-12 py-24 text-center">
            <p className="text-[12px] text-[#333] font-mono tracking-[2px] uppercase">
              // No projects in this category yet
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="relative px-6 sm:px-10 md:px-12 py-10 border-t border-[#1e1e1e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-[11px] text-[#333] font-mono">
          // Click a card to expand · View details for full stack breakdown
        </p>
        <a
          href="https://github.com/ShaharyarShakir"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-2
            text-[11px] tracking-[2px] uppercase font-mono no-underline
            text-[#555] hover:text-[#c8f135]
            transition-colors duration-150 group
          "
        >
          More on GitHub
          <span className="group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </div>
  )
}
