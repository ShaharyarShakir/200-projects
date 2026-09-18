import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { contactData } from "@/data/contact";

export default function Contact() {
  return (
    <Section id="contact" aria-labelledby="contact-heading">
      <Container>
        <div className="flex flex-col gap-12 md:gap-16">
          <div className="border-t border-border pt-12 md:pt-16">
            <div className="flex flex-col gap-8 max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
                {contactData.eyebrow}
              </p>

              <h2
                id="contact-heading"
                className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
              >
                {contactData.headline}
              </h2>

              <p className="text-lg leading-relaxed text-muted-fg md:text-xl">
                {contactData.description}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-2">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <a href={contactData.ctaHref}>{contactData.ctaText}</a>
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {contactData.details.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <dt className="text-xs font-mono uppercase tracking-wider text-subtle-fg">
                    {item.label}
                  </dt>
                  <dd>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-base"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-fg md:text-base">
                        {item.value}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </Section>
  );
}
