import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  as: Tag = "section",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      id={id}
      className={cn("scroll-mt-24 py-16 md:py-24 lg:py-32", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
