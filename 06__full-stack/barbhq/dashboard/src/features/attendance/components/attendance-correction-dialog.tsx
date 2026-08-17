import React, { useState } from "react";
import { Loader2, Edit3, X } from "lucide-react";
import type { AttendanceRecord } from "../attendance.types";

interface AttendanceCorrectionDialogProps {
  record: AttendanceRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    clockIn?: string;
    clockOut?: string;
    status?: any;
    notes?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const AttendanceCorrectionDialog: React.FC<AttendanceCorrectionDialogProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const employeeName = record.employee
    ? `${record.employee.firstName} ${record.employee.lastName}`
    : "Employee";

  // Pre-fill existing clockIn & clockOut formatted ISO or datetime-local
  const formatForInput = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const [clockInInput, setClockInInput] = useState<string>(
    formatForInput(record.clockIn),
  );
  const [clockOutInput, setClockOutInput] = useState<string>(
    formatForInput(record.clockOut),
  );
  const [statusInput, setStatusInput] = useState<string>(record.status);
  const [reasonInput, setReasonInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      setErrorMsg("Please provide a reason for correcting this attendance record.");
      return;
    }

    try {
      setErrorMsg("");
      await onSave({
        clockIn: clockInInput ? new Date(clockInInput).toISOString() : undefined,
        clockOut: clockOutInput ? new Date(clockOutInput).toISOString() : undefined,
        status: statusInput as any,
        notes: record.notes
          ? `${record.notes}; Correction: ${reasonInput.trim()}`
          : `Correction: ${reasonInput.trim()}`,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save correction");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Correct Attendance
              </h3>
              <p className="text-xs text-muted-foreground">
                Audit Logged Modification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-muted/40 p-3 border border-border text-sm">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Employee & Date
            </span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-foreground">{employeeName}</span>
              <span className="text-xs font-medium text-muted-foreground">{record.date}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Clock In Time
              </label>
              <input
                type="datetime-local"
                value={clockInInput}
                onChange={(e) => setClockInInput(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Clock Out Time
              </label>
              <input
                type="datetime-local"
                value={clockOutInput}
                onChange={(e) => setClockOutInput(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Status Override
            </label>
            <select
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
            >
              <option value="WORKING">Working 🟢</option>
              <option value="LATE">Late 🟡</option>
              <option value="COMPLETED">Completed 🔵</option>
              <option value="ABSENT">Absent 🔴</option>
              <option value="HALF_DAY">Half Day 🟠</option>
              <option value="ON_LEAVE">On Leave 🟣</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="e.g. Employee forgot to clock out at the end of shift"
              rows={2}
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-primary-foreground transition-colors cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Save Correction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
