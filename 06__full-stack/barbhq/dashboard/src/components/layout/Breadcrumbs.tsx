import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  const paths = location.pathname.split("/").filter(Boolean);

  if (paths.length === 0) {
    return (
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
        <Home className="h-3.5 w-3.5" />
        <ChevronRight className="h-3 w-3 text-border" />
        <span className="text-foreground font-bold">Dashboard</span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
      <Link
        to="/dashboard"
        className="hover:text-primary transition-colors flex items-center gap-1"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {paths.map((p, idx) => {
        const path = "/" + paths.slice(0, idx + 1).join("/");
        const isLast = idx === paths.length - 1;
        const label = p.replace("-", " ");

        if (p === "dashboard" && idx === 0 && paths.length > 1) {
          return null;
        }

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-3 w-3 text-border" />
            {isLast ? (
              <span className="text-foreground font-extrabold truncate max-w-[100px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                to={path}
                className="hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-none"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
export default Breadcrumbs;
