import React from 'react';
import { HOSStatus } from '../../types/hos';
import { Clock, ShieldAlert, CheckCircle } from 'lucide-react';

interface RemainingHoursCardProps {
  status?: HOSStatus | null;
  initialCycleUsed?: number;
  finalCycleUsed?: number;
  totalDriveHours?: number;
  totalDutyHours?: number;
}

export const RemainingHoursCard: React.FC<RemainingHoursCardProps> = ({
  status,
  initialCycleUsed = 0,
  finalCycleUsed = 0,
  totalDriveHours = 0,
  totalDutyHours = 0,
}) => {
  // FMCSA Maximums
  const MAX_DRIVE = 11;
  const MAX_DUTY = 14;
  const MAX_CYCLE = 70;

  // Calculate current drive/duty/cycle used
  const driveUsed = status ? Math.max(0, MAX_DRIVE - status.remaining_drive) : Math.min(MAX_DRIVE, totalDriveHours);
  const dutyUsed = status ? Math.max(0, MAX_DUTY - status.remaining_duty) : Math.min(MAX_DUTY, totalDutyHours);
  const cycleUsed = finalCycleUsed > 0 ? finalCycleUsed : initialCycleUsed;

  const drivePct = Math.min(100, Math.round((driveUsed / MAX_DRIVE) * 100));
  const dutyPct = Math.min(100, Math.round((dutyUsed / MAX_DUTY) * 100));
  const cyclePct = Math.min(100, Math.round((cycleUsed / MAX_CYCLE) * 100));

  const getBarColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-600" /> Driver Hours Dashboard
        </h3>
        <span className="text-xs font-mono bg-neutral-100 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded-lg">
          FMCSA 70h/8d Rules
        </span>
      </div>

      <div className="space-y-4">
        {/* Driving Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-neutral-700 flex items-center gap-1">
              Driving
              {status && status.remaining_drive <= 1 && (
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 inline" />
              )}
            </span>
            <span className="font-mono text-neutral-900">
              {driveUsed.toFixed(1)} / {MAX_DRIVE} Hours ({MAX_DRIVE - driveUsed >= 0 ? (MAX_DRIVE - driveUsed).toFixed(1) : 0}h remaining)
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-300">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(drivePct)}`}
              style={{ width: `${drivePct}%` }}
            ></div>
          </div>
        </div>

        {/* Duty Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-neutral-700">Duty Window</span>
            <span className="font-mono text-neutral-900">
              {dutyUsed.toFixed(1)} / {MAX_DUTY} Hours ({MAX_DUTY - dutyUsed >= 0 ? (MAX_DUTY - dutyUsed).toFixed(1) : 0}h remaining)
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-300">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(dutyPct)}`}
              style={{ width: `${dutyPct}%` }}
            ></div>
          </div>
        </div>

        {/* Cycle Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-neutral-700">70-Hour / 8-Day Cycle</span>
            <span className="font-mono text-neutral-900">
              {cycleUsed.toFixed(1)} / {MAX_CYCLE} Hours ({MAX_CYCLE - cycleUsed >= 0 ? (MAX_CYCLE - cycleUsed).toFixed(1) : 0}h remaining)
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-300">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(cyclePct)}`}
              style={{ width: `${cyclePct}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
