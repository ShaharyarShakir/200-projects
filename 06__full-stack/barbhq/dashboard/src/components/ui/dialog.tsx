import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      previouslyFocusedElement.current?.focus();
      return;
    }

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );

    const firstFocusable = focusableElements?.[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      panelRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="z-50 fixed inset-0 flex justify-center items-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in duration-300"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "z-50 relative bg-card shadow-xl dark:shadow-black/50 p-6 border border-border rounded-xl w-full max-w-md animate-scale-in",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="top-4.5 right-4.5 absolute hover:bg-secondary p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4.5 h-4.5" />
          <span className="sr-only">Close</span>
        </button>

        {(title || description) && (
          <div className="flex flex-col space-y-1.5 mb-5 text-left">
            {title && (
              <h2
                id={titleId}
                className="font-serif font-semibold text-foreground text-lg md:text-xl leading-none tracking-tight"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="text-muted-foreground text-sm">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="text-foreground text-sm">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// Named sub-components for shadcn compatibility
export const DialogTrigger: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="cursor-pointer">
    {children}
  </button>
);

export const DialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("space-y-4", className)}>{children}</div>
);

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 sm:text-left text-center",
      className,
    )}
    {...props}
  />
);

export const DialogTitle: React.FC<
  React.HTMLAttributes<HTMLHeadingElement>
> = ({ className, ...props }) => (
  <h3
    className={cn(
      "font-serif font-semibold text-lg leading-none tracking-tight",
      className,
    )}
    {...props}
  />
);

export const DialogDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className, ...props }) => (
  <p className={cn("text-muted-foreground text-sm", className)} {...props} />
);
