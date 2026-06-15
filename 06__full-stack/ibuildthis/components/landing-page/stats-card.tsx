import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import React from 'react'

export default function StatsCard({
    icon: Icon,
    value,
    label,
    hasBorder
}: {
    icon: LucideIcon,
    value: string,
    label: string,
    hasBorder?: boolean
}) {
    return (
        <div className={cn("space-y-2", hasBorder && "border-x border-border/50")}>
            <div className='flex justify-center items-center gap-2'>
                <Icon className='size-5 text-primary/70' />
                <p className='font-bold text-3xl sm:text-4xl' > {value} </p>
            </div>
            <p className='text-muted-foreground text-sm'>{label} </p>
        </div>
    )
}
