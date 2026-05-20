import { authClient } from '#/lib/auth-client'
import { cn } from '#/lib/utils'
import { Link, useRouter } from '@tanstack/react-router'
import { LogOut, Presentation, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { ModeToggle } from '../model-toggle'
export default function Navbar() {
    const { data: session, isPending } = authClient.useSession()
    const router = useRouter()
    const handleSignOut = async () => {
        await authClient.signOut()
        router.navigate({ to: '/login' })
    }
    return (
        <header className="top-0 right-0 left-0 z-50 fixed">
            <nav className="mx-auto px-4 py-3 max-w-5xl">
                <div className="flex justify-between items-center px-4 py-2.5 rounded-2xl glass">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 no-underline">
                        <div className="flex justify-center items-center bg-primary rounded-xl size-9">
                            <Presentation className="size-5 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-foreground text-lg">
                            Samma<span className="text-primary">.ai</span>
                        </span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Theme toggle */}
                        <ModeToggle />

                        {/* User menu */}
                        {isPending ? (
                            <div className="bg-muted rounded-full size-9 animate-pulse" />
                        ) : session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative p-0 rounded-full size-9"
                                    >
                                        <Avatar className="border-2 border-primary/30 size-9">
                                            <AvatarImage
                                                src={session.user.image}
                                                alt={session.user.name}
                                            />
                                            <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                                {session.user.name ? (
                                                    session.user.name.charAt(0).toUpperCase()
                                                ) : (
                                                    <User className="size-4" />
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="border-border/50 w-56 glass"
                                >
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium text-sm">{session.user.name}</p>
                                            <p className="text-muted-foreground text-xs truncate">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <LogOut className="mr-2 size-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild size="sm" className="rounded-xl">
                                <Link to="/login">Sign in</Link>
                            </Button>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    )
}