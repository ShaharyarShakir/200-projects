import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { services } from "@/data/services";

export default function Services() {
  return (
    <Section id="services">
      <Container>
        <div className="flex flex-col gap-12">
          <SectionHeading>What we do</SectionHeading>

          <div className="border-t border-border">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="flex flex-col gap-2 border-b border-border py-6 md:flex-row md:items-baseline md:gap-8 md:py-8"
              >
                <div className="flex items-baseline gap-4 md:w-[20%] md:shrink-0">
                  <span className="text-xs font-mono text-subtle-fg tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {service.title}
                  </h3>
                </div>
                <div className="flex flex-col gap-1 md:flex-1">
                  <p className="text-sm leading-relaxed text-muted-fg md:text-base">
                    {service.description}
                  </p>
                  {service.detail ? (
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-accent">
                      {service.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
