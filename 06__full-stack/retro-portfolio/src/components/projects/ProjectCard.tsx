import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import type { Project } from './projectsData'
import { TAG_COLOR } from './projectsData'

interface ProjectCardProps {
  project: Project
  index:   number
}

function stopCardToggle(e: React.SyntheticEvent) {
  e.stopPropagation()
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const drawerRef  = useRef<HTMLDivElement>(null)
  const innerRef   = useRef<HTMLDivElement>(null)
  const arrowRef   = useRef<HTMLSpanElement>(null)
  const [open, setOpenState] = useState(false)

  const color = TAG_COLOR[project.type]
  const detailHref = `/projects/${project.id}`
  const githubHref = project.github?.replace(/\.git$/, '')

  const setOpen = (next: boolean) => {
    if (open === next) return
    setOpenState(next)

    const drawer = drawerRef.current
    const inner  = innerRef.current
    const arrow  = arrowRef.current
    if (!drawer || !inner) return

    if (next) {
      gsap.set(drawer, { height: 'auto', overflow: 'hidden' })
      const targetH = inner.offsetHeight
      gsap.fromTo(
        drawer,
        { height: 0, opacity: 0 },
        { height: targetH, opacity: 1, duration: 0.38, ease: 'power2.out' },
      )
      if (arrow) gsap.to(arrow, { rotate: 45, duration: 0.25, ease: 'power2.out' })
    } else {
      gsap.to(drawer, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => gsap.set(drawer, { overflow: 'hidden' }),
      })
      if (arrow) gsap.to(arrow, { rotate: 0, duration: 0.2, ease: 'power2.out' })
    }

    drawer.setAttribute('aria-hidden', String(!next))
  }

  useEffect(() => {
    const drawer = drawerRef.current
    if (drawer) {
      gsap.set(drawer, { height: 0, opacity: 0, overflow: 'hidden' })
    }
  }, [])

  const toggle = () => setOpen(!open)

  return (
    <div
      className={`
        project-card border-b border-[#1e1e1e]
        ${index % 2 === 0 ? 'md:border-r' : ''}
      `}
    >
      <button
        type="button"
        className="w-full text-left p-8 pb-5 cursor-pointer group hover:bg-[#0d0d0d] transition-colors duration-150 border-0 bg-transparent"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`project-drawer-${project.id}`}
      >
        <div className="flex items-start justify-between mb-5">
          <span
            className="text-[48px] leading-none text-[#1e1e1e] group-hover:text-[#2a2a2a] transition-colors duration-300 tabular-nums"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            aria-hidden="true"
          >
            {project.num}
          </span>

          <div className="flex items-center gap-2 mt-1">
            {project.wip && (
              <span className="text-[9px] px-2 py-0.5 border border-[#fbbf24] text-[#fbbf24] font-mono tracking-[1.5px] uppercase">
                WIP
              </span>
            )}
            {project.featured && (
              <span className="text-[9px] text-[#c8f135] font-mono tracking-[1.5px] uppercase">
                ★ Featured
              </span>
            )}
            <span
              ref={arrowRef}
              className="text-[#333] group-hover:text-[#c8f135] transition-colors duration-150 text-[18px] ml-1 inline-block"
              aria-hidden="true"
            >
              +
            </span>
          </div>
        </div>

        <p
          className="text-[9px] tracking-[2px] uppercase font-mono mb-2"
          style={{ color }}
        >
          {project.type}
        </p>

        <h3 className="text-[18px] text-[#f0ede6] font-mono font-bold mb-3 leading-snug group-hover:text-[#c8f135] transition-colors duration-150">
          {project.name}
        </h3>

        <p className="text-[12px] text-[#555] font-mono leading-[1.8] mb-5">
          {project.desc}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="text-[9px] px-2 py-0.5 border border-[#1e1e1e] text-[#333] font-mono tracking-[1px]"
            >
              {tech}
            </span>
          ))}
        </div>
      </button>

      {/* Actions always visible — not inside collapsed drawer */}
      <div className="relative z-10 flex items-center gap-3 flex-wrap px-8 pb-6">
        <a
          href={detailHref}
          onClick={stopCardToggle}
          onPointerDown={stopCardToggle}
          className="
            flex items-center gap-1.5
            px-4 py-2 text-[10px] tracking-[2px] uppercase font-mono
            border border-[#c8f135] text-[#c8f135]
            hover:bg-[#c8f135] hover:text-[#0a0a0a]
            transition-all duration-150 no-underline
          "
        >
          View details →
        </a>
        {githubHref && (
          <a
            href={githubHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardToggle}
            onPointerDown={stopCardToggle}
            className="
              flex items-center gap-1.5
              px-4 py-2 text-[10px] tracking-[2px] uppercase font-mono
              border border-[#1e1e1e] text-[#555]
              hover:border-[#c8f135] hover:text-[#c8f135]
              transition-all duration-150 no-underline
            "
          >
            GitHub ↗
          </a>
        )}
        {project.live && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopCardToggle}
            onPointerDown={stopCardToggle}
            className="
              flex items-center gap-1.5
              px-4 py-2 text-[10px] tracking-[2px] uppercase font-mono
              bg-[#c8f135] text-[#0a0a0a] border border-[#c8f135]
              hover:bg-transparent hover:text-[#c8f135]
              transition-all duration-150 no-underline
            "
          >
            Live →
          </a>
        )}
      </div>

      <div
        ref={drawerRef}
        id={`project-drawer-${project.id}`}
        aria-hidden="true"
        className="relative z-0"
      >
        <div ref={innerRef} className="px-8 pb-8 pt-2 border-t border-[#1e1e1e] bg-[#0a0a0a]">
          <p className="text-[12px] text-[#666] font-mono leading-[1.9]">
            {project.longDesc}
          </p>
        </div>
      </div>
    </div>
  )
}
