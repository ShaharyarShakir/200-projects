import { LucideIcon } from "lucide-react";

export default function EmptyState({
    message,
    icon: Icon }: {
        message: string;
        icon?: LucideIcon
    }) {
    return (
        <div className='empty-state'>
            {Icon && (
                <Icon className='mx-auto mb-4 size-12 text-muted-foreground/50' />
            )}
            <p className="text-muted-foreground text-lg">{message}</p>
        </div>
    )
}
