import { useRef, useEffect } from 'react'

export function useScrollProgress(sectionId: string) {
  const progressRef = useRef(0)

  useEffect(() => {
    const section = document.getElementById(sectionId)
    if (!section) return

    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const viewHeight = window.innerHeight
      const start = rect.top
      const end = rect.bottom - viewHeight
      const range = Math.max(end - start, 1)
      let p = (viewHeight - rect.top) / range
      p = Math.max(0, Math.min(1, p))
      progressRef.current = p
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [sectionId])

  return progressRef
}
