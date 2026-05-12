import { Suspense } from 'react'
import HeroScene from './HeroScene'
import Terminal from './Terminal'

// ── Loading fallback for R3F canvas ───────────────────────────────
function SceneFallback() {
    return (
        <div className="absolute inset-0 flex justify-center items-center">
            <span className="text-[#333] text-[10px] uppercase tracking-[3px] animate-pulse">
                Initialising scene...
            </span>
        </div>
    )
}

// ── Component ─────────────────────────────────────────────────────
export default function HeroRight() {
    return (
        <div className="flex flex-col border-[#1e1e1e] border-l h-full">

            {/* Three.js canvas — top half */}
            <div className="relative flex-1 bg-[#080808] border-[#1e1e1e] border-b min-h-0 overflow-hidden">
                <Suspense fallback={<SceneFallback />}>
                    <HeroScene />
                </Suspense>

                {/* Overlay label */}
                <div className="top-4 left-4 z-10 absolute flex items-center gap-2">
                    <span className="bg-[#3ddc84] rounded-full w-1.5 h-1.5 animate-pulse" />
                    <span className="text-[#333] text-[9px] uppercase tracking-[2px]">
                        Scene / Active
                    </span>
                </div>
            </div>

            {/* Terminal — bottom half */}
            <div className="flex-shrink-0 h-[260px]">
                <Terminal />
            </div>

        </div>
    )
}