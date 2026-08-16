import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "default"
    | "link";
  size?: "sm" | "md" | "lg" | "default" | "icon" | "icon-sm" | "icon-xs";
  isLoading?: boolean;
  render?: React.ReactNode;
}

export const buttonVariants = (options?: {
  variant?: string;
  size?: string;
  className?: string;
}) => {
  const variant = options?.variant || "primary";
  const size = options?.size || "md";
  const className = options?.className || "";

  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20":
        variant === "primary" || variant === "default",
      "bg-secondary text-secondary-foreground hover:bg-secondary/80":
        variant === "secondary",
      "border border-border bg-transparent text-foreground hover:bg-secondary/60":
        variant === "outline",
      "bg-transparent text-foreground hover:bg-secondary/85":
        variant === "ghost",
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/10":
        variant === "destructive",
      "bg-transparent text-primary underline-offset-4 hover:underline active:scale-100":
        variant === "link",
    },
    {
      "px-3 py-1.5 text-xs gap-1.5": size === "sm",
      "px-4 py-2.5 text-sm gap-2": size === "md" || size === "default",
      "px-6 py-3.5 text-base gap-2.5": size === "lg",
      "h-9 w-9 p-0 justify-center shrink-0": size === "icon",
      "h-8 w-8 p-0 justify-center shrink-0 text-xs": size === "icon-sm",
      "h-7 w-7 p-0 justify-center shrink-0 text-[10px]": size === "icon-xs",
    },
    className,
  );
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      render,
      children,
      ...props
    },
    ref,
  ) => {
    // Support custom inline element rendering (radix-slot pattern)
    if (render && React.isValidElement(render)) {
      const renderElement = render as React.ReactElement<{
        className?: string;
        ref?: React.Ref<HTMLElement>;
        disabled?: boolean;
      }>;
      return React.cloneElement(renderElement, {
        ref,
        className: cn(
          buttonVariants({ variant, size, className }),
          renderElement.props.className,
        ),
        disabled: disabled || isLoading,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
