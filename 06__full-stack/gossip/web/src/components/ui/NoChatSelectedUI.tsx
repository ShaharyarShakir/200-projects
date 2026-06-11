import { MessageSquareIcon } from "lucide-react";

function NoChatSelectedUI() {
    return (
        <div className="flex flex-col flex-1 justify-center items-center px-8 text-center">
            <div className="flex justify-center items-center bg-linear-to-br from-amber-500/20 to-orange-500/20 mb-6 rounded-3xl w-20 h-20">
                <MessageSquareIcon className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="mb-2 font-bold text-2xl">Welcome to Whisper</h2>
            <p className="max-w-sm text-base-content/70">
                Select a conversation from the sidebar or start a new chat to begin messaging
            </p>
        </div>
    );
}

export default NoChatSelectedUI;