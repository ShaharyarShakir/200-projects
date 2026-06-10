import { UserButton } from "@clerk/react"
import { PlusIcon, SparklesIcon } from "lucide-react"
import { Link } from "react-router"

function Header({ onNewChat }: { onNewChat: () => void }) {
    return (
        <div className="p-4 border-base-300 border-b">
            <div className="flex justify-between items-center mb-4">
                <Link to="/chat" className="flex items-center gap-2">
                    <div
                        className="flex justify-center items-center bg-linear-to-br from-amber-400 to-orange-500 rounded-lg w-8 h-8"
                    >
                        <SparklesIcon className="w-4 h-4 text-primary-content" />
                    </div>
                    <span className="font-bold">Whisper</span>
                </Link>
                <UserButton />
            </div>
            <button
                onClick={onNewChat}
                className="btn-block gap-2 bg-linear-to-r from-amber-500 to-orange-500 border-none rounded-xl btn btn-primary"
            >
                <PlusIcon className="w-4 h-4" />
                New Chat
            </button>
        </div>
    )
}

export default Header
