import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { StackBreakdown } from './projectsData'
import { techAccentColor, techIconUrl } from './techIcons'

interface TechStackShowcaseProps {
  items: StackBreakdown[]
  accent?: string
}

interface InfiniteRowProps {
  items: StackBreakdown[]
  reverse?: boolean
  speed?: number
  selected: string | null
  setSelected: React.Dispatch<React.SetStateAction<string | null>>
}

function InfiniteRow({
  items,
  reverse = false,
  speed = 40,
  selected,
  setSelected,
}: InfiniteRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  const doubled = [...items, ...items]

  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    const totalWidth = row.scrollWidth / 2

    gsap.set(row, {
      x: reverse ? -totalWidth : 0,
    })

    tweenRef.current?.kill()

    tweenRef.current = gsap.to(row, {
      x: reverse ? `+=${totalWidth}` : `-=${totalWidth}`,
      duration: speed,
      ease: 'none',
      repeat: -1,
      force3D: true,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          const value = parseFloat(x)

          return reverse
            ? value % totalWidth
            : value % totalWidth
        }),
      },
    })

    if (selected) {
      tweenRef.current.pause()
    }

    return () => {
      tweenRef.current?.kill()
    }
  }, [items, reverse, speed])

  useEffect(() => {
    if (!tweenRef.current) return

    if (selected) {
      tweenRef.current.pause()
    } else {
      tweenRef.current.play()
    }
  }, [selected])

  const handleClick = (name: string) => {
    setSelected((prev) => (prev === name ? null : name))
  }

  return (
    <div className="relative overflow-hidden py-8">
      {/* fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#080808] to-transparent z-10 pointer-events-none" />

      <div
        ref={rowRef}
        className="flex items-center gap-10 px-6 w-max"
        style={{
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {doubled.map((item, i) => {
          const color = techAccentColor(item.name)
          const isSel = selected === item.name

          return (
            <button
              key={`${item.name}-${i}`}
              type="button"
              onClick={() => handleClick(item.name)}
              className="relative flex flex-col items-center gap-3 shrink-0 group"
            >
              {/* glow */}
              <span
                className="absolute inset-0 rounded-full blur-2xl transition-all duration-500"
                style={{
                  background: color,
                  opacity: isSel ? 0.45 : 0,
                  transform: isSel ? 'scale(1.2)' : 'scale(0.8)',
                }}
              />

              {/* icon */}
              <div
                className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 border bg-[#0a0a0a] transition-all duration-300"
                style={{
                  borderColor: isSel ? color : '#1e1e1e',
                  transform: isSel ? 'scale(1.18)' : 'scale(1)',
                  opacity: selected && !isSel ? 0.35 : 1,
                  boxShadow: isSel
                    ? `0 0 24px ${color}88`
                    : 'none',
                }}
              >
                <img
                  src={techIconUrl(item.name)}
                  alt={item.name}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>

              {/* label */}
              <span
                className="text-[10px] uppercase tracking-[1px] font-mono"
                style={{
                  color: isSel ? color : '#666',
                  opacity: selected && !isSel ? 0.35 : 1,
                }}
              >
                {item.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TechStackShowcase({
  items,
  accent = '#c8f135',
}: TechStackShowcaseProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-10">
      {/* motion container */}
      <div className="border border-[#1e1e1e] bg-[#080808] overflow-hidden">
        <p className="px-5 pt-4 text-[9px] tracking-[2px] uppercase text-[#333] font-mono">
          {selected
            ? `// focused on ${selected}`
            : '// infinite stack motion'}
        </p>

        {/* top */}
        <InfiniteRow
          items={items}
          speed={28}
          selected={selected}
          setSelected={setSelected}
        />

        {/* bottom */}
        <InfiniteRow
          items={items}
          reverse
          speed={32}
          selected={selected}
          setSelected={setSelected}
        />
      </div>

      {/* composition */}
      <div>
        <p className="text-[10px] tracking-[3px] text-[#333] uppercase font-mono mb-5">
          <span style={{ color: accent }}>//</span> Stack composition
        </p>

        <ul className="space-y-4">
          {items.map((item) => {
            const color = techAccentColor(item.name)
            const isSel = selected === item.name

            return (
              <li key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={techIconUrl(item.name)}
                      alt={item.name}
                      className="w-4 h-4 object-contain"
                    />

                    <span
                      className="text-[11px] font-mono"
                      style={{
                        color: isSel ? color : '#888',
                      }}
                    >
                      {item.name}
                    </span>
                  </div>

                  <span
                    className="text-[11px] font-mono"
                    style={{
                      color: isSel ? accent : '#555',
                    }}
                  >
                    {item.percent}%
                  </span>
                </div>

                <div className="h-1.5 bg-[#111] border border-[#1e1e1e] overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      background: isSel ? color : accent,
                      boxShadow: isSel
                        ? `0 0 14px ${color}88`
                        : undefined,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}