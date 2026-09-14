import { anime } from 'animejs'

export function fadeUp(elements: string[] | HTMLElement[], delay?: number) {
  anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [30, 0],
    easing: 'easeOutExpo',
    duration: 900,
    delay: anime.stagger(delay ?? 120),
  })
}
