import { CompassIcon, HomeIcon, LoaderIcon, SparkleIcon, SparklesIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { Button } from '../ui/button'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

const Logo = () => {
    return (
        <Link href={'/'} className='group flex items-center gap-2'>
            <div className='flex justify-center items-center bg-primary rounded-lg size-8'>
                <SparkleIcon className='size-5' />
            </div>
            <span className='font-bold text-xl'>
                i<span className='text-primary'>Build</span>This</span>
        </Link>
    )
}
export default function Header() {
    const isSignedIn = false
    return (
        <header className='top-0 z-50 sticky bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur border-b'>
            <div className='px-12 wrapper'>
                <div className='flex justify-between items-center h-16'>
                    <Logo />
                    <nav className='flex items-center gap-1'>
                        <Link href={'/'} className='flex items-center gap-2 hover:bg-muted/50 px-3 py-2 font-medium text-muted-foreground hover:text-foreground text-sm transition-colors'>
                            <HomeIcon className='size-4' />
                            <span>Home</span>
                        </Link>
                        <Link href={'/explore'} className='flex items-center gap-2 hover:bg-muted/50 px-3 py-2 font-medium text-muted-foreground hover:text-foreground text-sm transition-colors'>
                            <CompassIcon className='size-4' />
                            <span>Explore</span>
                        </Link>

                    </nav>
                    <div className='flex items-center gap-3'>
                        <Suspense fallback={<div>
                            <LoaderIcon className='size-4 animate-spin' />

                        </div>}>
                            <Show when="signed-out">
                                <SignInButton />
                                <SignUpButton>
                                    <Button >
                                        Sign Up
                                    </Button>
                                </SignUpButton>
                            </Show>
                            <Show when="signed-in">
                                <Button asChild>
                                    <Link href={'submit'}>
                                        <SparkleIcon className='size-4' />
                                        Submit Project
                                    </Link>
                                </Button>
                                <UserButton />
                            </Show>
                        </Suspense>
                    </div>
                </div>
            </div>
        </header>
    )
}
