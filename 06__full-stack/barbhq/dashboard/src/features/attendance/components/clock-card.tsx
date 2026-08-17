import React, { useState, useEffect } from "react";
import { Clock, Calendar, CheckCircle, Coffee } from "lucide-react";
import { AttendanceStatusBadge } from "./attendance-status-badge";
import { WorkDuration } from "./work-duration";
import { ClockButton } from "./clock-button";
import type { AttendanceRecord } from "../attendance.types";

interface ClockCardProps {
  userName: string;
  todayRecord?: AttendanceRecord | null;
  onClockIn: (notes?: string) => Promise<void>;
  onClockOut: (notes?: string) => Promise<void>;
  onStartBreak?: () => Promise<void>;
  onEndBreak?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  userName,
  todayRecord,
  onClockIn,
  onClockOut,
  onStartBreak,
  onEndBreak,
  isLoading = false,
  className = "",
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isClockedIn = !!todayRecord?.clockIn && !todayRecord?.clockOut;
  const isClockedOut = !!todayRecord?.clockOut;
  const isOnBreak = !!todayRecord?.breakStart && !todayRecord?.breakEnd;

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const clockInFormatted = todayRecord?.clockIn
    ? new Date(todayRecord.clockIn).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const clockOutFormatted = todayRecord?.clockOut
    ? new Date(todayRecord.clockOut).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  // Determine greeting based on current hour
  const currentHour = currentTime.getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  else if (currentHour >= 17) greeting = "Good evening";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6 ${className}`}
    >
      {/* Background Glow */}
      <div
        className={`absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl pointer-events-none ${
          isClockedIn
            ? "bg-emerald-500/15"
            : isClockedOut
            ? "bg-blue-500/15"
            : "bg-amber-500/15"
        }`}
      />

      {/* Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            {greeting}, {userName}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {todayRecord && (
          <AttendanceStatusBadge
            status={
              isClockedOut
                ? "COMPLETED"
                : isClockedIn
                ? todayRecord.status
                : "NOT_STARTED"
            }
          />
        )}
      </div>

      {/* Main Clock & Duration Display */}
      <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-3">
        <div className="flex items-center gap-2 text-4xl md:text-5xl font-black font-mono tracking-tight text-foreground">
          <Clock className="h-8 w-8 text-primary animate-pulse hidden md:block" />
          <span>{formattedTime}</span>
        </div>

        {isClockedIn ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>You're currently working</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Elapsed shift time:</span>
              <WorkDuration
                clockInTime={todayRecord.clockIn}
                breakStart={todayRecord.breakStart}
                breakEnd={todayRecord.breakEnd}
                size="lg"
              />
            </div>
            {clockInFormatted && (
              <p className="text-xs text-muted-foreground">
                Clocked in at <span className="font-semibold text-foreground">{clockInFormatted}</span>
              </p>
            )}
          </div>
        ) : isClockedOut ? (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <CheckCircle className="h-4 w-4" />
              <span>Completed for today</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Clocked in: <span className="font-semibold text-foreground">{clockInFormatted}</span> | Clocked out:{" "}
              <span className="font-semibold text-foreground">{clockOutFormatted}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">
              You haven't clocked in today
            </p>
            <p className="text-xs text-muted-foreground">
              Press the button below when you are ready to start work.
            </p>
          </div>
        )}
      </div>

      {/* Break Indicator / Controls */}
      {isClockedIn && onStartBreak && onEndBreak && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background text-sm">
          <div className="flex items-center gap-2.5">
            <Coffee className={`h-4 w-4 ${isOnBreak ? "text-amber-500 animate-bounce" : "text-muted-foreground"}`} />
            <span className="font-medium text-foreground">
              {isOnBreak ? "Currently on Break" : "Take a Break"}
            </span>
          </div>
          <button
            type="button"
            onClick={isOnBreak ? onEndBreak : onStartBreak}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isOnBreak
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {isOnBreak ? "End Break" : "Start Break"}
          </button>
        </div>
      )}

      {/* Clock Button Action */}
      {!isClockedOut && (
        <ClockButton
          isClockedIn={isClockedIn}
          clockInTime={todayRecord?.clockIn}
          breakStart={todayRecord?.breakStart}
          breakEnd={todayRecord?.breakEnd}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
