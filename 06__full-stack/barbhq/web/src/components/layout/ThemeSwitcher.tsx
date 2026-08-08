import React, { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../store/themeStore";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "../../lib/utils";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const themeIcons = {
    light: <Sun className="h-4.5 w-4.5" />,
    dark: <Moon className="h-4.5 w-4.5 text-amber-500" />,
    system: <Laptop className="h-4.5 w-4.5" />,
  };

  const themes = [
    {
      value: "light" as const,
      label: "Light Mode",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      value: "dark" as const,
      label: "Dark Mode",
      icon: <Moon className="h-4 w-4" />,
    },
    {
      value: "system" as const,
      label: "System Default",
      icon: <Laptop className="h-4 w-4" />,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-border bg-card/50 hover:bg-secondary transition-all cursor-pointer focus:outline-none"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        {themeIcons[theme]}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-44 rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-scale-in dark:shadow-black/40 origin-top-right">
          <div className="flex flex-col gap-0.5 select-none">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all font-semibold cursor-pointer",
                  theme === t.value
                    ? "bg-secondary text-primary"
                    : "text-foreground hover:bg-secondary/60",
                )}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ThemeSwitcher;
