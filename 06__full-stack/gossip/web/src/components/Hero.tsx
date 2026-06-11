import { SignInButton, SignUpButton } from '@clerk/react'
import { ArrowRightIcon } from 'lucide-react'

function Hero() {
    return (
        <div className="z-10 relative flex flex-col flex-1 justify-center max-w-xl">
            {/* Tag */}
            <div className="mt-4 mb-8">
                <span className="inline-flex items-center gap-2 bg-amber-500/10 px-4 py-2 border border-amber-500/20 rounded-full font-mono text-amber-400 text-xs uppercase tracking-wider">
                    <span className="bg-amber-400 rounded-full w-1.5 h-1.5 animate-pulse" />
                    Now Available
                </span>
            </div>

            {/* Headline */}
            <h1 className="font-mono font-bold text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight">
                Messaging for
                <br />
                <span className="bg-clip-text bg-linear-to-r from-amber-300 via-orange-400 to-rose-400 text-transparent">
                    everyone
                </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-md text-base-content/70 text-lg leading-relaxed">
                Secure, blazing-fast conversations with real-time presence and instant delivery. Connect
                with anyone, anywhere.
            </p>

            {/* CTA BTNS */}
            <div className="flex items-center gap-4 mt-10">
                <SignUpButton mode="modal">
                    <button className="group flex items-center gap-3 bg-base-100 hover:bg-base-200 px-8 py-4 rounded-2xl font-semibold text-base-content transition">
                        Start chatting
                        <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </SignUpButton>

                <SignInButton mode="modal">
                    <button className="px-8 py-4 font-semibold text-base-content/60 hover:text-base-content transition">
                        I have an account
                    </button>
                </SignInButton>
            </div>

            {/* Avatars */}
            <div className="flex items-center gap-4 mt-8">
                <div className="avatar-group -space-x-3">
                    <div className="avatar">
                        <div className="border-2 border-base-100 rounded-full w-10">
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                                alt="User avatar"
                            />
                        </div>
                    </div>
                    <div className="avatar">
                        <div className="border-2 border-base-100 rounded-full w-10">
                            <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                                alt="User avatar"
                            />
                        </div>
                    </div>
                    <div className="avatar">
                        <div className="border-2 border-base-100 rounded-full w-10">
                            <img
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                                alt="User avatar"
                            />
                        </div>
                    </div>
                    <div className="avatar">
                        <div className="border-2 border-base-100 rounded-full w-10">
                            <img
                                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                                alt="User avatar"
                            />
                        </div>
                    </div>
                    <div className="avatar avatar-placeholder">
                        <div className="bg-base-300 border-2 border-base-100 rounded-full w-10 text-base-content">
                            <span className="font-mono text-xs">+5k</span>
                        </div>
                    </div>
                </div>
                <span className="text-sm text-base-content/70">
                    Join <span className="font-mono text-base-content/80">10,000+</span> happy users
                </span>
            </div>

            {/* STATS */}
            <div className="flex items-center gap-10 mt-12">
                <div>
                    <div className="font-mono font-bold text-2xl">10K+</div>
                    <div className="mt-1 text-xs text-base-content/60 uppercase tracking-wider">
                        Users
                    </div>
                </div>
                <div className="bg-white/10 w-px h-10" />
                <div>
                    <div className="font-mono font-bold text-2xl">99.9%</div>
                    <div className="mt-1 text-xs text-base-content/60 uppercase tracking-wider">
                        Uptime
                    </div>
                </div>
                <div className="bg-white/10 w-px h-10" />
                <div>
                    <div className="font-mono font-bold text-2xl">&lt;50ms</div>
                    <div className="mt-1 text-xs text-base-content/60 uppercase tracking-wider">
                        Latency
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Hero
