import { cn } from "@/lib/utils";

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl",
        className
      )}
    >
      {children}
    </h2>
  );
}
