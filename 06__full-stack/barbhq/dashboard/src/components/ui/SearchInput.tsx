import React from "react";
import { Search } from "lucide-react";
import { Input, type InputProps } from "./input";

export type SearchInputProps = Omit<InputProps, "leftIcon">;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = "Search...", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        placeholder={placeholder}
        leftIcon={<Search className="h-4.5 w-4.5 text-muted-foreground" />}
        {...props}
      />
    );
  },
);

SearchInput.displayName = "SearchInput";
