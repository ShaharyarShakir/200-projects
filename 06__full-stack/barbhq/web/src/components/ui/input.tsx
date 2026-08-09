import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      "aria-describedby": ariaDescribedby,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const describedBy = [
      ariaDescribedby,
      error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-semibold text-muted-foreground text-xs uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="left-3.5 absolute flex justify-center items-center text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "bg-card disabled:opacity-50 px-3.5 py-2.5 border border-border focus:border-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-full placeholder:text-muted-foreground text-sm transition-all duration-200 disabled:cursor-not-allowed",
              {
                "pl-10": leftIcon,
                "pr-10": rightIcon,
                "border-destructive focus:border-destructive focus:ring-destructive":
                  error,
              },
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="right-3.5 absolute flex justify-center items-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span
            id={`${inputId}-error`}
            className="font-medium text-destructive text-xs animate-fade-in"
          >
            {error}
          </span>
        ) : helperText ? (
          <span id={`${inputId}-helper`} className="text-muted-foreground text-xs">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
