import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Edit, UserX } from "lucide-react";
import type { Employee } from "../employees.types";

interface EmployeeActionsProps {
  employee: Employee;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDeactivate: (emp: Employee) => void;
  canEdit?: boolean;
  canDeactivate?: boolean;
}

export const EmployeeActions: React.FC<EmployeeActionsProps> = ({
  employee,
  onView,
  onEdit,
  onDeactivate,
  canEdit = true,
  canDeactivate = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/30 hover:bg-secondary transition-all cursor-pointer focus:outline-none"
        aria-label="Actions menu"
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-card p-1 shadow-lg z-50 animate-scale-in origin-top-right">
          <button
            onClick={() => {
              setIsOpen(false);
              onView(employee);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/60 cursor-pointer transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            View Profile
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit(employee);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/60 cursor-pointer transition-colors"
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Profile
            </button>
          )}

          {canDeactivate && employee.isActive && (
            <>
              <div className="my-1 border-t border-border/50" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDeactivate(employee);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
              >
                <UserX className="h-3.5 w-3.5 text-destructive" />
                Deactivate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
