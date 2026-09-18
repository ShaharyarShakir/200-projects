export type ContactDetail = {
  label: string;
  value: string;
  href?: string;
};

export type ContactData = {
  eyebrow: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  details: ContactDetail[];
};

export const contactData: ContactData = {
  eyebrow: "Contact",
  headline: "Have something worth building?",
  description:
    "Tell us what you're working on. We'll figure out the next step together.",
  ctaText: "Start a project →",
  ctaHref: "mailto:hello@example.com",
  details: [
    {
      label: "Direct Inquiries",
      value: "hello@example.com",
      href: "mailto:hello@example.com",
    },
    {
      label: "Location",
      value: "Remote / Worldwide",
    },
    {
      label: "Availability",
      value: "Currently accepting select projects",
    },
  ],
};
