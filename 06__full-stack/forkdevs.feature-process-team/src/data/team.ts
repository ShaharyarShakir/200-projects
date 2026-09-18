export type TeamValue = {
  id: string;
  title: string;
  description: string;
};

export const teamValues: TeamValue[] = [
  {
    id: "small-by-design",
    title: "Small by design",
    description:
      "A deliberately small team means few hands on deck and clear ownership at every step.",
  },
  {
    id: "remote-native",
    title: "Remote-native",
    description:
      "We work asynchronously, write things down, and stay accessible across time zones.",
  },
  {
    id: "product-minded",
    title: "Product-minded",
    description:
      "We measure impact, not output — and we argue with the brief when it isn't right.",
  },
];
