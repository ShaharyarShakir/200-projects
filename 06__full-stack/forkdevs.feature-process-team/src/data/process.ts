export type ProcessStep = {
  id: string;
  title: string;
  description: string;
};

export const processSteps: ProcessStep[] = [
  {
    id: "discover",
    title: "Discover",
    description:
      "We start by understanding the problem, the users, and the constraints before any code is written.",
  },
  {
    id: "design",
    title: "Design",
    description:
      "Product and engineering design come together into a clear, testable plan for the build.",
  },
  {
    id: "build",
    title: "Build",
    description:
      "Short iterations, working software, and continuous feedback keep momentum high.",
  },
  {
    id: "ship",
    title: "Ship & Learn",
    description:
      "We release, measure, and iterate — treating launch as the start, not the end.",
  },
];
