import { SignInButton, SignUpButton } from "@clerk/react"
import { ArrowRight, SparkleIcon } from "lucide-react"

function Navbar() {
    return (
        <nav className='z-10 relative flex justify-between items-center'>
            <div className='flex items-center gap-2.5'>
                <div className='flex justify-center items-center bg-amber-400 bg-linear-to-br to-orange-500 shadow-gray-500/20 shadow-lg rounded-xl size-9 from'>
                    <SparkleIcon className="size-5 text-primary-content" />
                </div>
                <span className="font-bold text-lg">Gossip</span>
            </div>
            <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                    <button className="px-5 py-2.5 font-medium text-sm text-base-content/50 hover:text-base-content transition hover:cursor-pointer">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                    <button className="gap-2 bg-linear-to-r from-amber-500 to-orange-500 hover:opacity-90 shadow-lg shadow-orange-500/25 border-none rounded-full font-semibold text-sm btn">
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </SignUpButton>
            </div>
        </nav>
    )
}

export default Navbar
