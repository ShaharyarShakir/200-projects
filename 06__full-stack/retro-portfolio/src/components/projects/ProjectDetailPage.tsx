import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import type { Project } from './projectsData'
import { TAG_COLOR } from './projectsData'
import TechStackShowcase from './TechStackShowcase'

interface ProjectDetailPageProps {
  project: Project
}

export default function ProjectDetailPage({ project }: ProjectDetailPageProps) {
  const pageRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const accent = TAG_COLOR[project.type]
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (heroRef.current) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.pd-eyebrow', { y: 12, opacity: 0, duration: 0.4 })
        .from('.pd-title', {
          y: 48,
          opacity: 0,
          duration: 0.7,
          ease: 'power4.out',
        }, '-=0.1')
        .from('.pd-image', {
          scale: 0.96,
          opacity: 0,
          duration: 0.65,
        }, '-=0.35')
        .from('.pd-desc', {
          y: 16,
          opacity: 0,
          duration: 0.5,
        }, '-=0.3')
        .from('.pd-cta', {
          y: 12,
          opacity: 0,
          duration: 0.4,
        }, '-=0.3')
    }

    const sections = gsap.utils.toArray<HTMLElement>(
      pageRef.current?.querySelectorAll('.pd-reveal') || []
    )

    sections.forEach((el) => {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      })
    })
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="relative w-full">
      <header
        ref={heroRef}
        className="border-b border-[#1e1e1e] px-6 sm:px-10 md:px-12 pt-10 pb-12 md:pb-16"
      >
        <a
          href="/projects"
          className="pd-eyebrow inline-flex items-center gap-2 mb-8 text-[10px] tracking-[2px] uppercase font-mono text-[#555] hover:text-[#c8f135] no-underline transition-colors duration-150"
        >
          ← All projects
        </a>

        <div className="flex flex-wrap items-start gap-4 mb-4">
          <span
            className="text-[56px] sm:text-[72px] leading-none text-[#1a1a1a] tabular-nums"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            aria-hidden="true"
          >
            {project.num}
          </span>
          {project.wip && (
            <span className="mt-4 text-[9px] px-2 py-0.5 border border-[#fbbf24] text-[#fbbf24] font-mono tracking-[1.5px] uppercase">
              WIP
            </span>
          )}
          <p
            className="mt-5 text-[9px] tracking-[2px] uppercase font-mono"
            style={{ color: accent }}
          >
            {project.type}
          </p>
        </div>

        <h1
          className="pd-title text-[40px] sm:text-[56px] md:text-[64px] leading-[0.95] text-[#f0ede6] tracking-tight mb-8 max-w-4xl"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {project.name}
        </h1>

        <figure className="pd-image mb-8 max-w-4xl">
          <div className="relative border border-[#1e1e1e] overflow-hidden bg-[#0d0d0d] aspect-video">
            <img
              src={project.image}
              alt={`Screenshot of ${project.name}`}
              className="w-full h-full object-cover"
              width={1200}
              height={675}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
              aria-hidden="true"
            />
          </div>
          <figcaption className="mt-2 text-[9px] text-[#333] font-mono tracking-[2px] uppercase">
            // {project.name} — preview
          </figcaption>
        </figure>

        <p className="pd-desc text-[13px] sm:text-[14px] text-[#666] font-mono leading-[1.9] max-w-3xl">
          {project.longDesc}
        </p>


      </header>

      <section className="px-6 sm:px-10 md:px-12 py-14 md:py-20 border-b border-[#1e1e1e] pd-reveal">
        <h2
          className="text-[36px] sm:text-[48px] leading-none text-[#f0ede6] mb-10"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Tech <span style={{ color: accent }}>Stack</span>
        </h2>
        <TechStackShowcase items={project.stackBreakdown} accent={accent} />
      </section>

      <footer className="px-6 sm:px-10 md:px-12 py-12 md:py-16 pd-reveal">
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-6">
          <span style={{ color: accent }}>//</span> Links
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="post-cta-btn post-cta-btn--primary w-full sm:w-auto"
            >
              View Project ↗
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="post-cta-btn post-cta-btn--secondary w-full sm:w-auto"
            >
              View on GitHub ↗
            </a>
          )}
          {!project.github && !project.live && (
            <p className="text-[11px] text-[#333] font-mono">// Links coming soon</p>
          )}
        </div>
      </footer>
    </div>
  )
}
