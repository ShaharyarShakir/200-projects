import React from "react";
import { cn } from "../../lib/utils";

export type PageTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const PageTitle: React.FC<PageTitleProps> = ({
  className,
  ...props
}) => {
  return (
    <h1
      className={cn(
        "font-serif text-2xl font-bold tracking-tight md:text-3xl text-foreground select-none",
        className,
      )}
      {...props}
    />
  );
};
