import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__auth/sign-in/$')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section id="sing-in">
        <SignIn
         routing='path' 
         path='/sign-in' 
         signInUrl='/sing-in' 
         fallbackRedirectUrl='/' />
    </section>
  )
}
