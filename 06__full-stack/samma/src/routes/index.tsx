import { getSession } from '#/lib/auth.function'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href }
      })
    }
    return { user: session.user }
  },
  component: Home
})

function Home() {
  return (
    <div className="mt-14 p-8 text-center">
      <h1 className="font-bold text-4xl">Welcome to TanStack Start</h1>
    </div>
  )
}
