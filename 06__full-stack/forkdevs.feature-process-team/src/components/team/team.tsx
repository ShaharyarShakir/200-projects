import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { teamValues } from "@/data/team";

export default function Team() {
  return (
    <Section id="team">
      <Container>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
              Team
            </p>
            <SectionHeading>How we&apos;re built</SectionHeading>
            <p className="max-w-2xl text-base leading-relaxed text-muted-fg md:text-lg">
              We&apos;re assembling a small, senior team of designers and
              engineers who care about craft. If that sounds like you, we&apos;d
              love to talk.
            </p>
          </div>

          <div className="border-t border-border">
            {teamValues.map((value, index) => (
              <div
                key={value.id}
                className="grid grid-cols-1 gap-3 border-b border-border py-6 md:grid-cols-[20%_1fr] md:items-baseline md:py-8"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-subtle-fg tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    {value.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-fg md:max-w-2xl">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
