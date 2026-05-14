// src/components/blog/mdx/Callout.tsx
import type { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'danger' | 'tip'

interface CalloutProps {
    type?: CalloutType
    title?: string
    children: ReactNode
}

const CONFIG: Record<CalloutType, { icon: string; accent: string; bg: string; label: string }> = {
    info: { icon: 'ℹ', accent: '#3b82f6', bg: 'rgba(59,130,246,0.06)', label: 'INFO' },
    warning: { icon: '⚠', accent: '#fbbf24', bg: 'rgba(251,191,36,0.06)', label: 'WARNING' },
    danger: { icon: '✕', accent: '#ef4444', bg: 'rgba(239,68,68,0.06)', label: 'DANGER' },
    tip: { icon: '→', accent: '#c8f135', bg: 'rgba(200,241,53,0.06)', label: 'TIP' },
}

export default function Callout({ type = 'info', title, children }: CalloutProps) {
    const { icon, accent, bg, label } = CONFIG[type]

    return (
        <div
            className="my-6 px-5 py-4 border-l-[3px]"
            style={{ borderColor: accent, background: bg }}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[13px]" style={{ color: accent }} aria-hidden="true">
                    {icon}
                </span>
                <span
                    className="font-mono text-[10px] uppercase tracking-[2px]"
                    style={{ color: accent }}
                >
                    {title ?? label}
                </span>
            </div>

            <div className="font-mono text-[#888] text-[13px] [&_a]:text-[#c8f135] [&_strong]:text-[#f0ede6] [&_a]:underline leading-[1.8]">
                {children}
            </div>
        </div>
    )
}