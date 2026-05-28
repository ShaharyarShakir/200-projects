// src/components/projects/ProjectsGrid.tsx
import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { PROJECTS, FILTER_TAGS, TAG_COLOR } from './projectsData'
import type { ProjectTag } from './projectsData'
import ProjectCard from './ProjectCard'

export default function ProjectsGrid() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const filterRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)

  const [activeFilter, setActiveFilter] = useState<ProjectTag | 'all'>('all')

  const filtered = activeFilter === 'all'
    ? PROJECTS
    : PROJECTS.filter((p) => p.type === activeFilter)

  // ── GSAP: scroll entrance ────────────────────────────────────────
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Header
    if (headerRef.current) {
      gsap.from(Array.from(headerRef.current.children), {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }

    // Filter bar
    if (filterRef.current) {
      gsap.from(Array.from(filterRef.current.children), {
        y: 12,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: filterRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    }

    // Cards
    if (gridRef.current) {
      gsap.from(gridRef.current.querySelectorAll('.project-card'), {
        y: 40,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }
  }, { scope: sectionRef, dependencies: [] })

  // ── Filter handler with GSAP fade ───────────────────────────────
  const handleFilter = (tag: ProjectTag | 'all') => {
    if (!gridRef.current) { setActiveFilter(tag); return }

    gsap.to(gridRef.current, {
      opacity: 0,
      y: 8,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        setActiveFilter(tag)
        gsap.to(gridRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.28,
          ease: 'power2.out',
        })
      },
    })
  }

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="border-b border-[#1e1e1e]"
    >

      {/* ── Header ── */}
      <div
        ref={headerRef}
        className="flex items-end justify-between px-12 pt-16 pb-10 border-b border-[#1e1e1e]"
      >
        <div>
          <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-3">
            <span className="text-[#c8f135]">04</span> — Work
          </p>
          <h2
            className="text-[64px] leading-none text-[#f0ede6] tracking-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Selected
            <br />
            <span className="text-[#c8f135]">Projects</span>
          </h2>
        </div>

        {/* Ghost count */}
        <div className="text-right pb-2">
          <p
            className="text-[64px] leading-none text-[#1e1e1e] tabular-nums"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {String(PROJECTS.length).padStart(2, '0')}
          </p>
          <p className="text-[10px] tracking-[2px] text-[#333] uppercase font-mono -mt-1">
            Projects
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div
        ref={filterRef}
        className="flex items-center gap-2 px-12 py-5 border-b border-[#1e1e1e] flex-wrap"
        role="tablist"
        aria-label="Filter projects by category"
      >
        {FILTER_TAGS.map(({ label, value }) => {
          const isActive = activeFilter === value
          const tagColor = value !== 'all' ? TAG_COLOR[value as ProjectTag] : '#f0ede6'

          return (
            <button
              key={value}
              onClick={() => handleFilter(value)}
              role="tab"
              aria-selected={isActive}
              className="
                px-3 py-1.5 text-[10px] tracking-[2px] uppercase font-mono
                border bg-transparent cursor-pointer
                transition-all duration-150
              "
              style={{
                borderColor: isActive ? tagColor : '#1e1e1e',
                color:       isActive ? tagColor : '#555',
              }}
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

      {/* ── Projects grid (2 columns) ── */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2">
        {filtered.length > 0 ? (
          filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))
        ) : (
          <div className="col-span-2 px-12 py-20 text-center">
            <p className="text-[12px] text-[#333] font-mono tracking-[2px] uppercase">
              // No projects in this category yet
            </p>
          </div>
        )}
      </div>

      {/* ── Footer: GitHub CTA ── */}
      <div className="px-12 py-8 border-t border-[#1e1e1e] flex items-center justify-between">
        <p className="text-[11px] text-[#333] font-mono">
          // Click a card to expand · View details for full stack breakdown
        </p>
        <a
          href="https://github.com/ShaharyarShakir"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-2
            text-[11px] tracking-[2px] uppercase font-mono
            text-[#555] hover:text-[#c8f135]
            transition-colors duration-150 no-underline group
          "
        >
          More on GitHub
          <span
            className="group-hover:translate-x-0.5 transition-transform duration-150"
            aria-hidden="true"
          >
            ↗
          </span>
        </a>
      </div>

    </section>
  )
}