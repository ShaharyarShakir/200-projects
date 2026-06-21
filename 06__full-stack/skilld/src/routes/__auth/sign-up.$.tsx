import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__auth/sign-up/$')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
     <section id="sing-up">
        <SignUp
         routing='path' 
         path='/sign-up' 
         signInUrl='/sing-up' 
         fallbackRedirectUrl='/' />
    </section>
  )
}
