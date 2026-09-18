export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "Web" | "Mobile" | "AI" | "Cloud" | "Product Engineering";
  year: string;
  href?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: "p1",
    name: "Project One",
    slug: "project-one",
    description: "Placeholder — temporary content for selected work showcase.",
    category: "Product Engineering",
    year: "2026",
    featured: true,
  },
  {
    id: "p2",
    name: "Project Two",
    slug: "project-two",
    description: "Placeholder — temporary content for selected work showcase.",
    category: "Web",
    year: "2026",
  },
  {
    id: "p3",
    name: "Project Three",
    slug: "project-three",
    description: "Placeholder — temporary content for selected work showcase.",
    category: "AI",
    year: "2026",
  },
];
