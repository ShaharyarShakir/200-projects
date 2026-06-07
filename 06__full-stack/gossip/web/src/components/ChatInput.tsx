import { SendIcon } from "lucide-react";

export function ChatInput({ value, onChange, onSubmit, disabled }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    disabled: boolean;
}) {
    return (
        <form onSubmit={onSubmit} className="p-4 border-base-300 border-t">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder="Type a message..."
                    className="flex-1 bg-base-300/40 border-base-300 rounded-xl placeholder:text-base-content/60 input input-bordered"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    className="bg-linear-to-r from-amber-500 to-orange-500 border-none rounded-xl btn disabled:btn-disabled"
                >
                    <SendIcon className="size-5" />
                </button>
            </div>
        </form>
    );
}