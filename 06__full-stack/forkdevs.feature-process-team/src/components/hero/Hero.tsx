import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <Section as="div" className="flex flex-1 items-center">
      <Container>
        <div className="flex flex-col gap-8 max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
            Product Engineering Studio
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            We build digital products.
          </h1>

          <p className="text-lg text-muted-fg max-w-2xl leading-relaxed md:text-xl">
            We design and engineer web, mobile, AI, and cloud products from idea
            to production.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href="#contact">Start a project</a>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
              className="w-full sm:w-auto"
            >
              <a href="#work">View our work</a>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
