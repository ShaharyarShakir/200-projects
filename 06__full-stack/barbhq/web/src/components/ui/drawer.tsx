import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: "left" | "right";
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = "right",
  children,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
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
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="z-50 fixed inset-0 flex flex-row">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fade-in duration-300"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "z-50 fixed inset-y-0 flex flex-col bg-card shadow-xl dark:shadow-black/50 p-6 border-border w-full max-w-sm h-full transition-transform duration-300 ease-out",
          {
            "left-0 border-r animate-[slide-in-left_0.2s_ease-out]":
              position === "left",
            "right-0 border-l animate-[slide-in-right_0.2s_ease-out]":
              position === "right",
          },
          className,
        )}
      >
        <style>{`
          @keyframes slide-in-right {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes slide-in-left {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        <div className="flex justify-between items-center mb-5 pb-5 border-border/20 border-b">
          {title ? (
            <h2 id={titleId} className="font-serif font-semibold text-foreground text-lg leading-none">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-secondary p-1.5 rounded-full focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex-1 pr-1 overflow-y-auto text-foreground text-sm">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
