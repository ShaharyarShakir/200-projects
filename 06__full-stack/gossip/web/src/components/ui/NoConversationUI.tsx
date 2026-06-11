import { MessageSquareIcon } from "lucide-react";

function NoConversationsUI() {
    return (
        <div className="flex flex-col justify-center items-center px-4 py-12 text-center">
            <MessageSquareIcon className="mb-3 w-10 h-10 text-amber-400" />
            <p className="text-sm text-base-content/70">No conversations yet</p>
            <p className="mt-1 text-xs text-base-content/60">Start a new chat to begin</p>
        </div>
    );
}

export default NoConversationsUI;