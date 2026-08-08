import React from "react";
import { cn } from "../../lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8 animate-fade-in",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
