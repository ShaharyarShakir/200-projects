import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command";
import {
  navigationConfig,
  renderIcon,
  type NavigationItem,
} from "../../lib/navigation";
import { Kbd } from "../ui/kbd";

export const SearchCommand: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Flatten the navigation structure to perform searches
  const getFlatItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [];
    navigationConfig.forEach((configItem) => {
      if ("items" in configItem) {
        configItem.items.forEach((subItem) => {
          items.push(subItem);
        });
      } else {
        items.push(configItem);
      }
    });
    // Add Profile page option
    items.push({
      label: "Profile",
      path: "/profile",
      iconName: "User",
    });
    return items;
  };

  const flatItems = getFlatItems();

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate({ to: path });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9.5 w-44 sm:w-64 items-center justify-between rounded-lg border border-border bg-card/45 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-all cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="font-semibold">Search items...</span>
        </div>
        <Kbd className="pointer-events-none select-none text-[10px] font-bold">
          ⌘K
        </Kbd>
      </button>

      <CommandDialog isOpen={open} onClose={() => setOpen(false)}>
        <CommandInput placeholder="Search navigation items..." />
        <CommandList>
          <CommandEmpty>No navigation items found.</CommandEmpty>
          <CommandGroup heading="Dashboard Routes">
            {flatItems.map((item) => {
              return (
                <CommandItem
                  key={item.path}
                  value={item.label}
                  onSelect={() => handleSelect(item.path)}
                >
                  {renderIcon(item.iconName, "mr-2 h-4 w-4 text-muted-foreground group-data-selected:text-primary")}
                  <span className="font-bold">{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
export default SearchCommand;
