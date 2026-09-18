export type Service = {
  id: string;
  title: string;
  description: string;
  detail?: string;
};

export const services: Service[] = [
  {
    id: "web",
    title: "Web",
    description:
      "Production web applications built with modern frameworks and disciplined engineering.",
    detail: "Next.js, React, TypeScript",
  },
  {
    id: "mobile",
    title: "Mobile",
    description:
      "Native-quality mobile experiences designed and shipped for iOS and Android.",
    detail: "React Native, Expo",
  },
  {
    id: "ai",
    title: "AI",
    description:
      "Practical AI features and products, integrated where they create real leverage.",
    detail: "LLMs, RAG, Agents",
  },
  {
    id: "cloud",
    title: "Cloud & DevOps",
    description:
      "Infrastructure that is boring and dependable, with pipelines that make shipping safe.",
    detail: "AWS, CI/CD, IaC",
  },
  {
    id: "product-engineering",
    title: "Product Engineering",
    description:
      "End-to-end product ownership — from discovery and design to launch and iteration.",
    detail: "Strategy, Design, Build",
  },
];
