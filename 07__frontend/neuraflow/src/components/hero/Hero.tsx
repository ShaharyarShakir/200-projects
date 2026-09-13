import { useEffect, useRef } from "react";
import { animateHero } from "../../animations/hero";
import HeroScene from "./HeroScene";
import "./hero.css";

function Hero() {
  const scopeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const animation = animateHero(scope);
    return () => {
      animation?.cancel();
      animation?.revert();
    };
  }, []);

  return (
    <section className="hero" ref={scopeRef}>
      <div className="hero__glow" aria-hidden="true" />

      <HeroScene />

      <div className="hero__content">
        <p className="hero__eyebrow">
          <span className="hero__eyebrow-dot" aria-hidden="true" />
          AI workflow automation
        </p>

        <h1 className="hero__title">
          Build AI workflows
          <span className="hero__title-accent">that think.</span>
        </h1>

        <p className="hero__subtitle">
          Orchestrate intelligent agents, tools, and workflows from one
          platform.
        </p>

        <div className="hero__actions">
          <button className="hero__cta hero__cta--primary" type="button">
            Start building
          </button>
          <button className="hero__cta hero__cta--secondary" type="button">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M8 5.14v13.72L19 12 8 5.14Z" />
            </svg>
            Watch demo
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
