import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { processSteps } from "@/data/process";

export default function Process() {
  return (
    <Section id="process">
      <Container>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
              Process
            </p>
            <SectionHeading>How we work</SectionHeading>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-border pt-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col gap-3">
                <span className="text-xs font-mono text-subtle-fg tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-fg">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
