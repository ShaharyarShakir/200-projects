"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

interface ThemeToggleProps {
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
}

export function ThemeToggle({
  className,
  variant = "outline",
  size = "icon",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size={size}
            className={cn(
              "relative cursor-pointer transition-all duration-200 border-border/80 hover:border-primary/50 hover:bg-accent/60",
              className
            )}
            aria-label="Select theme mode"
          />
        }
      >
        <div className="relative flex items-center justify-center size-4">
          {!mounted ? (
            <Moon className="size-4 shrink-0 transition-transform duration-200 text-foreground" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="size-4 shrink-0 transition-transform duration-200 text-primary" />
          ) : (
            <Sun className="size-4 shrink-0 transition-transform duration-200 text-amber-500" />
          )}
        </div>
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8.5rem] p-1 font-sans">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer text-xs font-medium rounded-md",
            theme === "light" && "bg-accent/80 font-semibold text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="size-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer text-xs font-medium rounded-md",
            theme === "dark" && "bg-accent/80 font-semibold text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="size-3.5 text-primary" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer text-xs font-medium rounded-md",
            theme === "system" && "bg-accent/80 font-semibold text-primary"
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="size-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
