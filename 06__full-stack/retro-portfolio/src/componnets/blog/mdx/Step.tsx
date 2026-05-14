// src/components/blog/mdx/Step.tsx
import type { ReactNode } from 'react'

interface StepProps {
    number: number
    title: string
    children: ReactNode
}

export default function Step({ number, title, children }: StepProps) {
    return (
        <div className="flex gap-5 my-6">
            {/* Number */}
            <div className="flex-shrink-0 mt-0.5">
                <span
                    className="flex justify-center items-center border border-[#c8f135] w-7 h-7 font-mono text-[#c8f135] text-[11px]"
                    aria-hidden="true"
                >
                    {String(number).padStart(2, '0')}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="mb-2 font-mono font-bold text-[#f0ede6] text-[13px] tracking-[1px]">
                    {title}
                </p>
                <div className="[&_code]:bg-[#1a1a1a] [&_code]:px-1.5 [&_code]:py-0.5 font-mono text-[#888] text-[13px] [&_code]:text-[#c8f135] [&_code]:text-[12px] leading-[1.8]">
                    {children}
                </div>
            </div>
        </div>
    )
}