import React from "react";
import { Button, type ButtonProps } from "./button";
import { Filter } from "lucide-react";
import { cn } from "../../lib/utils";

export interface FilterButtonProps extends ButtonProps {
  isActive?: boolean;
  label?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  isActive = false,
  label = "Filter",
  className,
  ...props
}) => {
  return (
    <Button
      variant={isActive ? "primary" : "outline"}
      size="sm"
      className={cn(
        "flex items-center gap-1.5 font-semibold cursor-pointer",
        className,
      )}
      {...props}
    >
      <Filter className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};
