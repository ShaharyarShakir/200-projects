function HeroImg() {
    return (
        <div className="hidden relative lg:flex flex-1 justify-center items-center bg-base-200 overflow-hidden">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Radial Glow */}
            <div
                className="top-1/2 left-1/2 absolute bg-linear-to-r from-amber-500/20 to-orange-500/20 blur-[100px] rounded-full w-125 h-125 -translate-x-1/2 -translate-y-1/2"
            />

            {/* Image Container */}
            <div className="z-10 relative">
                {/* Decorative border */}
                <div className="absolute -inset-px bg-linear-to-b from-white/20 to-white/5 p-px rounded-3xl">
                    <div className="bg-base-200 rounded-3xl w-full h-full" />
                </div>

                {/* Card */}
                <div className="relative bg-base-200/80 shadow-2xl backdrop-blur-xl p-6 border border-base-300 rounded-3xl">
                    <img src="/auth.png" alt="Chat illustration" className="rounded-2xl w-80 xl:w-96" />

                    {/* Floating elements */}
                    <div className="-top-4 -right-4 absolute bg-emerald-500/20 backdrop-blur-sm px-4 py-2 border border-emerald-500/30 rounded-full font-medium text-emerald-400 text-sm">
                        ● 3 online
                    </div>

                    <div className="-bottom-4 -left-4 absolute bg-base-300/40 backdrop-blur-sm px-4 py-2.5 border border-base-300 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                <div className="flex -space-x-2">
                                    <div className="bg-linear-to-br from-amber-400 to-orange-500 rounded-full w-6 h-6" />
                                    <div className="bg-linear-to-br from-rose-400 to-pink-500 rounded-full w-6 h-6" />
                                </div>
                            </div>
                            <span className="text-sm text-base-content/80">typing...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default HeroImg
