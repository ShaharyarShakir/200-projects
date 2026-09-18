import { Container } from "@/components/layout/container";
import { navLinks } from "@/data/navigation";

const linkClassName =
  "text-sm text-muted-fg transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between md:py-16">
        <div className="flex flex-col gap-3">
          <a
            href="#"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Forkdevs<span className="text-accent">.</span>
          </a>
          <p className="max-w-xs text-sm leading-relaxed text-muted-fg">
            Product engineering studio crafting web, mobile, and AI products.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <nav aria-label="Footer">
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClassName}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-xs text-subtle-fg">
            © {new Date().getFullYear()} Forkdevs. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
