import { useState } from "react";
import { cn } from "../../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt = "",
  name = "",
  size = "md",
  ...props
}) => {
  const [error, setError] = useState(false);

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-border bg-muted font-semibold items-center justify-center text-muted-foreground select-none",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setError(true)}
          className="h-full w-full object-cover animate-fade-in"
        />
      ) : (
        <span className="flex items-center justify-center text-foreground font-medium uppercase">
          {name ? getInitials(name) : "?"}
        </span>
      )}
    </div>
  );
};
