import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { projects } from "@/data/projects";

export default function Work() {
  return (
    <Section id="work">
      <Container>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
              Selected Work
            </p>
            <SectionHeading>Selected projects</SectionHeading>
          </div>

          <div className="border-t border-border">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="grid grid-cols-1 gap-3 border-b border-border py-6 md:grid-cols-[20%_1fr_auto] md:items-baseline md:py-8"
              >
                <div className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-subtle-fg tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {project.name}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-muted-fg md:max-w-2xl">
                  {project.description}
                </p>

                <div className="flex items-baseline gap-4 text-right md:shrink-0">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-accent">
                    {project.category}
                  </span>
                  <span className="text-xs font-mono text-subtle-fg tabular-nums">
                    {project.year}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
