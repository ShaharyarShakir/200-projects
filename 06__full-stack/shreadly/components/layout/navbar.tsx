import Link from 'next/link'
import React from 'react'

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
      
    </div>
  )
}
