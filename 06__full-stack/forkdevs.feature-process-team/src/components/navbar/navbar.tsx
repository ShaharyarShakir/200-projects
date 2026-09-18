import { Container } from "@/components/layout/container";
import { navLinks } from "@/data/navigation";

const linkClassName =
  "text-sm text-muted-fg transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <a
            href="#"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Forkdevs<span className="text-accent">.</span>
          </a>

          <nav
            className="hidden md:flex md:items-center md:gap-7"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={linkClassName}>
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:inline-flex"
          >
            Start a project
          </a>
        </div>

        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 pb-4 md:hidden"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={linkClassName}>
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}
