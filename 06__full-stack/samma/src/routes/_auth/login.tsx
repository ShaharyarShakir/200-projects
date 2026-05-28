import LoginForm from '@/components/auth/login-form'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Presentation } from 'lucide-react'
import { z } from 'zod'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()

  return (
    <div className="flex justify-center items-center p-4 min-h-screen">
      <div className="w-full max-w-md">
        <div className="space-y-6 p-8 rounded-3xl glass">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Link to="/" className="no-underline">
              <div className="flex justify-center items-center bg-primary rounded-2xl size-14">
                <Presentation className="size-8 text-primary-foreground" />
              </div>
            </Link>
            <div className="text-center">
              <h1 className="font-bold text-2xl">
                Welcome to <span className="text-primary">PPT.ai</span>
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Sign in to create beautiful presentations
              </p>
            </div>
          </div>

          {/* Login form */}
          <LoginForm redirectTo={redirect} />
        </div>
      </div>
    </div>
  )
}