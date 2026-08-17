import React, { useState, useEffect } from "react";

interface WorkDurationProps {
  clockInTime?: string | Date;
  breakStart?: string | Date;
  breakEnd?: string | Date;
  clockOutTime?: string | Date;
  workedMinutes?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const WorkDuration: React.FC<WorkDurationProps> = ({
  clockInTime,
  breakStart,
  breakEnd,
  clockOutTime,
  workedMinutes,
  className = "",
  size = "md",
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!clockInTime || clockOutTime) return;

    const calculateElapsed = () => {
      const start = new Date(clockInTime).getTime();
      const now = new Date().getTime();

      let breakMs = 0;
      if (breakStart) {
        const bStart = new Date(breakStart).getTime();
        const bEnd = breakEnd ? new Date(breakEnd).getTime() : now;
        breakMs = Math.max(0, bEnd - bStart);
      }

      const diffSeconds = Math.max(0, Math.floor((now - start - breakMs) / 1000));
      setElapsedSeconds(diffSeconds);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [clockInTime, breakStart, breakEnd, clockOutTime]);

  if (clockOutTime && workedMinutes !== undefined) {
    const hours = Math.floor(workedMinutes / 60);
    const mins = workedMinutes % 60;
    return (
      <span className={`font-semibold text-foreground ${className}`}>
        {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
      </span>
    );
  }

  if (!clockInTime) {
    return <span className={`text-muted-foreground ${className}`}>—</span>;
  }

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const textSize =
    size === "lg"
      ? "text-3xl font-extrabold tracking-tight font-mono text-emerald-600 dark:text-emerald-400"
      : size === "sm"
      ? "text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400"
      : "text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400";

  return <span className={`${textSize} ${className}`}>{formattedTime}</span>;
};
