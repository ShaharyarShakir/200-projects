import { createTimeline, stagger } from "animejs";

export type HeroAnimation = {
  cancel: () => void;
  revert: () => void;
};

/**
 * Plays the Hero entrance animation and returns handles for cleanup.
 * Returns null when the user prefers reduced motion.
 */
export function animateHero(scope: HTMLElement): HeroAnimation | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  const eyebrow = Array.from(scope.querySelectorAll<HTMLElement>(".hero__eyebrow"));
  const title = Array.from(scope.querySelectorAll<HTMLElement>(".hero__title"));
  const subtitle = Array.from(scope.querySelectorAll<HTMLElement>(".hero__subtitle"));
  const ctas = Array.from(scope.querySelectorAll<HTMLElement>(".hero__cta"));

  const timeline = createTimeline({ defaults: { ease: "outExpo" } });

  timeline
    .add(eyebrow, { duration: 500, opacity: [0, 1], translateY: [-10, 0] })
    .add(title, { duration: 800, opacity: [0, 1], translateY: [22, 0] })
    .add(subtitle, { duration: 650, opacity: [0, 1], translateY: [16, 0] })
    .add(ctas, {
      duration: 600,
      opacity: [0, 1],
      translateY: [12, 0],
      delay: stagger(90, { start: 60 }),
    });

  return {
    cancel: () => timeline.cancel(),
    revert: () => timeline.revert(),
  };
}
