import Nav from './Nav'

interface RouterWrapperProps {
  children: React.ReactNode
}

/** Single client island: Nav + layout children. No react-router — Astro owns URLs. */
export default function RouterWrapper({ children }: RouterWrapperProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Nav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
