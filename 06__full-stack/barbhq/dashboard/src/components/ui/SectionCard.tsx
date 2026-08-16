import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";
import { cn } from "../../lib/utils";

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  headerActions?: React.ReactNode;
  isGlass?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  headerActions,
  children,
  isGlass,
  className,
  ...props
}) => {
  return (
    <Card
      isGlass={isGlass}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/10 mb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold font-serif md:text-lg">
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
};
