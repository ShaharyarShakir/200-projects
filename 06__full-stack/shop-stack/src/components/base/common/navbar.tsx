import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
}

export default function Navbar({
  items,
  className = "hidden items-center gap-6 text-sm @5xl:flex",
  linkClassName = "",
  activeLinkClassName = "",
}: NavBarProps) {
  return (
    <nav className={cn(className)}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex justify-center items-center bg-transparent hover:bg-primary px-7.5 border hover:border-transparent border-dashed rounded-xl @7xl:h-16 hover:text-background dark:hover:text-background dark:text-body-70 text-lg transition-all",
            linkClassName,
          )}
          activeProps={{
            className: cn(
              "bg-foreground! dark:bg-body-10! px-7.5 border-transparent rounded-xl h-12 @7xl:h-16 text-background hover:dark:text-foreground text-lg",
              activeLinkClassName,
            ),
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
