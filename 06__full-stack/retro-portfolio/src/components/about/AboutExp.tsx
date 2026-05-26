// src/components/about/AboutExperience.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Types ─────────────────────────────────────────────────────────
interface ExperienceItem {
  role:    string
  company: string
  period:  string
  type:    string
  desc:    string
  tags:    string[]
}

interface EducationItem {
  degree:  string
  school:  string
  period:  string
  note?:   string
}

// ── Data ──────────────────────────────────────────────────────────
const EXPERIENCE: ExperienceItem[] = [
  {
    role:    'DevOps & MLOps Engineer',
    company: 'Company Name',
    period:  '2024 — NOW',
    type:    'Full-time',
    desc:    'Leading Kubernetes infrastructure migration. Built MLOps platform processing 2M+ daily model inferences. Reduced deployment time 70% with GitOps workflows.',
    tags:    ['k8s', 'terraform', 'mlflow', 'argocd', 'python'],
  },
  {
    role:    'Full-Stack Developer',
    company: 'Company Name',
    period:  '2023 — 2024',
    type:    'Full-time',
    desc:    'Built React Native app from 0 to 50k users. Designed GraphQL API serving 5M+ requests/day. Implemented real-time features with WebSockets and Redis pub/sub.',
    tags:    ['react native', 'expo', 'graphql', 'node.js', 'redis'],
  },
  {
    role:    'Backend Engineer',
    company: 'Company Name',
    period:  '2022 — 2023',
    type:    'Freelance',
    desc:    'Designed microservices architecture for a fintech platform. Set up first CI/CD pipelines and observability stack. FastAPI + PostgreSQL + Docker.',
    tags:    ['python', 'fastapi', 'docker', 'postgres', 'github actions'],
  },
]

const EDUCATION: EducationItem[] = [
  {
    degree: 'BS Computer Science',
    school: 'KFUEIT, Rahim Yar Khan',
    period: '2024 — 2028',
    note:   'Focus on distributed systems & software engineering',
  },
]

// ── Tag pill ──────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  return (
    <span
      className="
        text-[9px] px-2 py-0.5 font-mono uppercase tracking-[1px]
        text-[#c8f135] bg-[rgba(200,241,53,0.08)] border border-[#c8f135]/35
      "
    >
      {label}
    </span>
  )
}

// ── Experience item ───────────────────────────────────────────────
function ExpItem({ item }: { item: ExperienceItem }) {
  return (
    <div className="exp-item py-6 border-b border-[#1e1e1e]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-1">
        <p className="text-[13px] text-[#f0ede6] font-mono font-bold leading-snug">
          {item.role}
        </p>
        <span className="text-[10px] text-[#c8f135] font-mono tracking-[1px] sm:whitespace-nowrap shrink-0">
          {item.period}
        </span>
      </div>

      <p className="text-[11px] text-[#333] font-mono mb-3">
        {item.company}
        <span className="ml-2 text-[#2a2a2a]">· {item.type}</span>
      </p>

      <p className="text-[12px] text-[#555] font-mono leading-[1.8] mb-3">
        {item.desc}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {item.tags.map((t) => <Tag key={t} label={t} />)}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────
export default function AboutExperience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const expRef       = useRef<HTMLDivElement>(null)
  const eduRef       = useRef<HTMLDivElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Experience items stagger
    if (expRef.current) {
      gsap.from(expRef.current.querySelectorAll('.exp-item'), {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: expRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }

    // Education + CTA
    const others = [eduRef.current, ctaRef.current].filter(Boolean)
    if (others.length) {
      gsap.from(others, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: eduRef.current,
          start: 'top 90%',
          once: true,
        },
      })
    }

  }, { scope: containerRef, dependencies: [] })

  return (
    <div ref={containerRef} className="section-x py-8 md:py-12 flex flex-col gap-10">

      {/* ── Experience ── */}
      <div ref={expRef}>
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-0">
          // Experience
        </p>

        {EXPERIENCE.map((item) => (
          <ExpItem key={item.period} item={item} />
        ))}
      </div>

      {/* ── Education ── */}
      <div ref={eduRef}>
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-4">
          // Education
        </p>

        {EDUCATION.map((edu) => (
          <div key={edu.period} className="py-5 border-t border-[#1e1e1e]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-1">
              <p className="text-[13px] text-[#f0ede6] font-mono font-bold">
                {edu.degree}
              </p>
              <span className="text-[10px] text-[#c8f135] font-mono tracking-[1px] sm:whitespace-nowrap shrink-0">
                {edu.period}
              </span>
            </div>
            <p className="text-[11px] text-[#333] font-mono mb-1">{edu.school}</p>
            {edu.note && (
              <p className="text-[11px] text-[#444] font-mono">{edu.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Download CV CTA ── */}
      <div ref={ctaRef} className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
        <a
          href="/Shaharyar_Shakir_Resume.pdf"
          download="Shaharyar_Shakir_Resume.pdf"
          className="
            flex items-center gap-2
            px-5 py-2.5 text-[11px] tracking-[2px] uppercase font-mono
            bg-[#c8f135] text-[#0a0a0a] border border-[#c8f135]
            hover:bg-transparent hover:text-[#c8f135]
            transition-all duration-150 no-underline
          "
        >
          Download CV
          <span aria-hidden="true">↓</span>
        </a>

        <a
          href="https://linkedin.com/in/shaharyar-shakir-3674a027b"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-2
            px-5 py-2.5 text-[11px] tracking-[2px] uppercase font-mono
            bg-transparent text-[#555] border border-[#1e1e1e]
            hover:border-[#333] hover:text-[#f0ede6]
            transition-all duration-150 no-underline
          "
        >
          LinkedIn
          <span aria-hidden="true">↗</span>
        </a>
      </div>

    </div>
  )
}