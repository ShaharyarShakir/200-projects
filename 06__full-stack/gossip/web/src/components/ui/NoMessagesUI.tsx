import { MessageSquareIcon } from "lucide-react";

function NoMessagesUI() {
    return (
        <div className="flex flex-col justify-center items-center h-full text-center">
            <div className="flex justify-center items-center bg-base-300/40 mb-4 rounded-2xl w-16 h-16">
                <MessageSquareIcon className="w-8 h-8 text-base-content/20" />
            </div>
            <p className="text-base-content/70">No messages yet</p>
            <p className="mt-1 text-sm text-base-content/60">Send a message to start the conversation</p>
        </div>
    );
}

export default NoMessagesUI;