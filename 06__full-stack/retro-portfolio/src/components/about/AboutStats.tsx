// src/components/about/AboutStats.tsx
import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── Data ──────────────────────────────────────────────────────────
const STATS = [
  { value: 1,    suffix: '+',  label: 'Years Experience',    decimal: false },
  { value: 40,   suffix: '+',  label: 'Projects Shipped',    decimal: false },
  { value: 99.9, suffix: '%',  label: 'Uptime SLA',          decimal: true  },
  { value: 15,   suffix: '+',  label: 'Tools in Daily Use',  decimal: false },
]

// ── Animated counter hook ─────────────────────────────────────────
function useCounter(target: number, decimal: boolean, start: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    const duration = 1400
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target
      setCount(decimal ? Math.round(current * 10) / 10 : Math.floor(current))
      if (progress < 1) requestAnimationFrame(tick)
      else setCount(target)
    }

    requestAnimationFrame(tick)
  }, [start, target, decimal])

  return decimal ? count.toFixed(1) : count.toString()
}

// ── Single stat ───────────────────────────────────────────────────
function Stat({ value, suffix, label, decimal, animate }: typeof STATS[0] & { animate: boolean }) {
  const displayed = useCounter(value, decimal, animate)

  return (
    <div className="stat-item flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <p
        className="text-[40px] sm:text-[48px] md:text-[56px] leading-none text-[#c8f135] tabular-nums"
        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        aria-label={`${value}${suffix} ${label}`}
      >
        {displayed}
        <span className="text-[28px] sm:text-[34px] md:text-[40px]">{suffix}</span>
      </p>
      <p className="text-[10px] tracking-[2px] text-[#333] uppercase font-mono mt-2 text-center">
        {label}
      </p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────
export default function AboutStats() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from(containerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => setAnimate(true),
      },
    })
  }, { scope: containerRef, dependencies: [] })

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 md:grid-cols-4 border-b border-t border-[#1e1e1e] divide-x divide-y divide-[#1e1e1e]"
    >
      {STATS.map((stat) => (
        <Stat key={stat.label} {...stat} animate={animate} />
      ))}
    </div>
  )
}