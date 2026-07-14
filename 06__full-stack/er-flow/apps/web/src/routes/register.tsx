import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '../features/auth/components/RegisterForm'
import { AppShell } from '../features/layout/AppShell'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <AppShell>
      <div className="flex justify-center items-center px-6 py-16 min-h-[calc(100vh-12rem)]">
        <RegisterForm />
      </div>
    </AppShell>
  )
}
