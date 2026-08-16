import React, { useState } from "react";
import { Input, type InputProps } from "./input";
import { Eye, EyeOff } from "lucide-react";

export type PasswordInputProps = Omit<InputProps, "type" | "rightIcon">;

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      ref={ref}
      type={showPassword ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="p-1 rounded focus:outline-none text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = "PasswordInput";
