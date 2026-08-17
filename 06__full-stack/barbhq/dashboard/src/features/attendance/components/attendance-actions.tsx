import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Edit3 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { AttendanceRecord } from "../attendance.types";

interface AttendanceActionsProps {
  record: AttendanceRecord;
  onCorrect?: (record: AttendanceRecord) => void;
  canManage?: boolean;
}

export const AttendanceActions: React.FC<AttendanceActionsProps> = ({
  record,
  onCorrect,
  canManage = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label="Attendance options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate({
                to: "/app/attendance/$attendanceId",
                params: { attendanceId: record.id },
              });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>View Details</span>
          </button>

          {canManage && onCorrect && (
            <button
              onClick={() => {
                setIsOpen(false);
                onCorrect(record);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Correct Attendance</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
