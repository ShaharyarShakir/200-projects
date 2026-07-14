import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '../features/auth/components/LoginForm'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <AppShell>
      <div className="flex justify-center items-center px-6 py-16 min-h-[calc(100vh-12rem)]">
        <LoginForm />
      </div>
    </AppShell>
  )
}
