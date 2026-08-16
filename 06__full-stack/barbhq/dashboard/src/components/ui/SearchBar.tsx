import React from "react";
import { SearchInput, type SearchInputProps } from "./SearchInput";

export type SearchBarProps = SearchInputProps;

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (props, ref) => {
    return <SearchInput ref={ref} {...props} />;
  },
);
SearchBar.displayName = "SearchBar";
