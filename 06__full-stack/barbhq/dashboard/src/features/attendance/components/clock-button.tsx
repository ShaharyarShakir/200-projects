import React, { useState } from "react";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { WorkDuration } from "./work-duration";

interface ClockButtonProps {
  isClockedIn: boolean;
  clockInTime?: string | Date;
  breakStart?: string | Date;
  breakEnd?: string | Date;
  onClockIn: (notes?: string) => Promise<void>;
  onClockOut: (notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const ClockButton: React.FC<ClockButtonProps> = ({
  isClockedIn,
  clockInTime,
  breakStart,
  breakEnd,
  onClockIn,
  onClockOut,
  isLoading = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async () => {
    setSubmitting(true);
    try {
      if (isClockedIn) {
        await onClockOut(notes.trim() || undefined);
      } else {
        await onClockIn(notes.trim() || undefined);
      }
      setShowConfirm(false);
      setNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!isClockedIn ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          className="relative inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              <span>Clock In Now</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          className="relative inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 transition-all duration-200 hover:from-rose-500 hover:to-amber-500 hover:shadow-xl hover:shadow-rose-500/30 active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              <span>Clock Out</span>
            </>
          )}
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5 text-center">
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isClockedIn
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {isClockedIn ? (
                  <LogOut className="h-6 w-6" />
                ) : (
                  <LogIn className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {isClockedIn ? "Clock Out Confirmation" : "Clock In Confirmation"}
              </h3>
              {isClockedIn ? (
                <p className="text-sm text-muted-foreground">
                  You have worked{" "}
                  <WorkDuration
                    clockInTime={clockInTime}
                    breakStart={breakStart}
                    breakEnd={breakEnd}
                    size="sm"
                  />{" "}
                  today. Are you ready to clock out?
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Are you ready to start your work shift for today?
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notes / Memo (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isClockedIn
                    ? "e.g. Completed scheduled shift"
                    : "e.g. Starting morning shift"
                }
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-input bg-background hover:bg-muted text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer ${
                  isClockedIn
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isClockedIn ? "Confirm Clock Out" : "Confirm Clock In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
