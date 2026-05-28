// Home — featured projects preview (2 cards) + link to full archive
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { FEATURED_PROJECTS } from './projectsData'
import ProjectCard from './ProjectCard'

export default function FeaturedProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const ctaRef     = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (headerRef.current) {
      gsap.from(Array.from(headerRef.current.children), {
        y: 28,
        opacity: 0,
        duration: 0.65,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }

    if (gridRef.current) {
      gsap.from(gridRef.current.querySelectorAll('.project-card'), {
        y: 36,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 88%',
          once: true,
        },
      })
    }

    if (ctaRef.current) {
      gsap.from(ctaRef.current, {
        y: 12,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 92%',
          once: true,
        },
      })
    }
  }, { scope: sectionRef, dependencies: [] })

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="border-b border-[#1e1e1e]"
    >
      <div
        ref={headerRef}
        className="flex items-end justify-between px-6 sm:px-10 md:px-12 pt-16 pb-10 border-b border-[#1e1e1e]"
      >
        <div>
          <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-3">
            <span className="text-[#c8f135]">04</span> — Work
          </p>
          <h2
            className="text-[48px] sm:text-[64px] leading-none text-[#f0ede6] tracking-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Featured
            <br />
            <span className="text-[#c8f135]">Projects</span>
          </h2>
        </div>

        <div className="text-right pb-2">
          <p
            className="text-[48px] sm:text-[64px] leading-none text-[#1e1e1e] tabular-nums"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {String(FEATURED_PROJECTS.length).padStart(2, '0')}
          </p>
          <p className="text-[10px] tracking-[2px] text-[#333] uppercase font-mono -mt-1">
            Highlighted
          </p>
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2">
        {FEATURED_PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>

      <div
        ref={ctaRef}
        className="px-6 sm:px-10 md:px-12 py-10 border-t border-[#1e1e1e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      >
        <p className="text-[11px] text-[#333] font-mono max-w-md leading-relaxed">
          // End-to-end MLOps with DVC, MLflow, FastAPI &amp; a Chrome extension — full stack breakdown on the archive page.
        </p>
        <a
          href="/projects"
          className="
            group inline-flex items-center gap-3 shrink-0
            px-5 py-3 text-[10px] tracking-[2px] uppercase font-mono no-underline
            border border-[#c8f135] text-[#c8f135]
            hover:bg-[#c8f135] hover:text-[#0a0a0a]
            transition-colors duration-200
          "
        >
          View all projects
          <span
            className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          >
            →
          </span>
        </a>
      </div>
    </section>
  )
}
