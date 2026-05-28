import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// ── Types ─────────────────────────────────────────────────────────
type LineColor = 'acid' | 'green' | 'yellow' | 'muted' | 'white'

interface TermLine {
    prompt?: boolean
    text: string
    color?: LineColor
    delay?: number      // seconds after previous line
}

// ── Data ──────────────────────────────────────────────────────────
const LINES: TermLine[] = [
    { prompt: true, text: 'kubectl get pods -n production', color: 'white', delay: 0 },
    { text: 'NAME                    READY   STATUS', color: 'acid', delay: 0.3 },
    { text: 'api-gateway-7d9b8f       1/1     Running', color: 'green', delay: 0.15 },
    { text: 'ml-pipeline-worker-3     1/1     Running', color: 'green', delay: 0.15 },
    { text: 'feature-store-v2         0/1     Pending', color: 'yellow', delay: 0.15 },
    { text: 'postgres-primary         1/1     Running', color: 'green', delay: 0.15 },
    { prompt: true, text: 'terraform plan', color: 'white', delay: 0.5 },
    { text: 'Plan: 12 to add, 3 to change, 0 to destroy', color: 'muted', delay: 0.3 },
    { text: '✓ Plan saved. Ready to apply.', color: 'green', delay: 0.2 },
]

const colorMap: Record<LineColor, string> = {
    acid: 'text-[#c8f135]',
    green: 'text-[#3ddc84]',
    yellow: 'text-[#ffd700]',
    muted: 'text-[#555]',
    white: 'text-[#f0ede6]',
}

// ── Component ─────────────────────────────────────────────────────
export default function Terminal() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [visibleLines, setVisibleLines] = useState(0)
    const [showCursor, setShowCursor] = useState(true)

    // Reveal lines one by one with delay
    useEffect(() => {
        let i = 0
        const timeouts: ReturnType<typeof setTimeout>[] = []

        const reveal = (idx: number) => {
            if (idx >= LINES.length) return
            const delay = (LINES[idx].delay ?? 0.2) * 1000
            const t = setTimeout(() => {
                setVisibleLines(idx + 1)
                reveal(idx + 1)
            }, delay + (idx === 0 ? 800 : 0))  // initial delay on first line
            timeouts.push(t)
        }

        reveal(0)
        return () => timeouts.forEach(clearTimeout)
    }, [])

    // Blinking cursor
    useEffect(() => {
        const t = setInterval(() => setShowCursor(p => !p), 530)
        return () => clearInterval(t)
    }, [])

    // Fade in the whole terminal block
    useGSAP(() => {
        gsap.from(containerRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.8,
            delay: 0.4,
            ease: 'power2.out',
        })
    }, [])

    return (
        <div
            ref={containerRef}
            className="bg-[#0d0d0d] p-4 sm:p-5 border border-[#2a2a2a] w-full h-full min-w-0 overflow-x-auto overflow-y-auto font-mono text-[12px] sm:text-[13px] leading-[1.75]"
        >
            {/* Title bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-[#1e1e1e] border-b">
                <span className="bg-[#ff5f57] rounded-full w-2.5 h-2.5" />
                <span className="bg-[#febc2e] rounded-full w-2.5 h-2.5" />
                <span className="bg-[#28c840] rounded-full w-2.5 h-2.5" />
                <span className="ml-2 sm:ml-3 text-[#444] text-[11px] sm:text-[12px] tracking-wide sm:tracking-widest truncate">PRODUCTION — bash</span>
            </div>

            {/* Lines */}
            {LINES.slice(0, visibleLines).map((line, i) => (
                <div key={i} className="flex gap-2 min-w-max sm:min-w-0">
                    {line.prompt && (
                        <span className="text-[#c8f135] select-none shrink-0">$</span>
                    )}
                    <span className={`${line.color ? colorMap[line.color] : 'text-[#555]'} ${!line.prompt ? 'pl-2 sm:pl-4' : ''} whitespace-nowrap sm:whitespace-normal`}>
                        {line.text}
                    </span>
                </div>
            ))}

            {/* Blinking cursor on last line */}
            {visibleLines >= LINES.length && (
                <div className="flex gap-2 mt-0.5">
                    <span className="text-[#c8f135]">$</span>
                    <span
                        className="inline-block bg-[#c8f135] w-[7px] h-[13px]"
                        style={{ opacity: showCursor ? 1 : 0 }}
                    />
                </div>
            )}
        </div>
    )
}