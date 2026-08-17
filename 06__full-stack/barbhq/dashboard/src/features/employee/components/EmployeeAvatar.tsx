import React from "react";
import { cn } from "../../../lib/utils";

interface EmployeeAvatarProps {
  src?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // fallback if firstName/lastName is pre-joined
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  src,
  firstName = "",
  lastName = "",
  name = "",
  size = "md",
  className,
}) => {
  // Compute initials
  let initials = "";
  if (firstName || lastName) {
    initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  } else if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      initials = `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
    } else {
      initials = name.slice(0, 2).toUpperCase();
    }
  }

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };

  const hasImage = !!src && src.trim().startsWith("http");

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden select-none font-bold",
        hasImage ? "bg-muted" : "bg-gradient-to-br from-primary/20 to-primary/45 text-primary border border-primary/20",
        sizeClasses[size],
        className,
      )}
    >
      {hasImage ? (
        <img
          src={src}
          alt={name || `${firstName} ${lastName}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Hide broken images
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
};

export default EmployeeAvatar;
