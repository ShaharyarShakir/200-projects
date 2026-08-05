import React from "react";
import { cn } from "../../utils";

export const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  const baseStyles = 
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
  
  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/30",
    destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-500",
    outline: "border border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    ghost: "text-slate-400 hover:bg-slate-900 hover:text-white",
    link: "text-purple-400 underline-offset-4 hover:underline"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-lg px-3 text-xs",
    lg: "h-11 rounded-xl px-8",
    icon: "h-10 w-10"
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";
