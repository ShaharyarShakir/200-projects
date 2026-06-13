import { Search } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Input } from '../ui/input'

export default function Navbar() {
  return (
    <div>
        <Link 
            href={'/'}
            className= "flex items-center gap-2 font-semibold text-foreground tracking-tight"
        >
        <span  className="flex justify-center items-center bg-primary rounded-full size-8 font-bold text-primary-foreground text-sm"
            aria-hidden>
            S
        </span>
        <span className="text-lg">
    Shreadtly
        </span>
        </Link>

        <div className="hidden md:block relative flex-1 mx-auto max-w-xl">
          <Search className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
          <Input
            readOnly
            placeholder="Search posts..."
            className="bg-card pr-16 pl-10 border-border rounded-full w-full h-10 text-sm"
            aria-label="Search posts"
          />
        </div>
      
    </div>
  )
}
