import React from 'react';
import type { DutyEvent, DutyStatus } from '../types/eld';
import { Clock, MapPin, FileText } from 'lucide-react';

interface DutyTimelineProps {
  events: DutyEvent[];
}

const STATUS_BADGE_STYLE: Record<DutyStatus, { bg: string; text: string; label: string }> = {
  OFF_DUTY: { bg: 'bg-neutral-800 border-neutral-700', text: 'text-neutral-300', label: 'OFF DUTY' },
  SLEEPER_BERTH: { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-300', label: 'SLEEPER BERTH' },
  DRIVING: { bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-300', label: 'DRIVING' },
  ON_DUTY: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300', label: 'ON DUTY' },
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return '--:--';
  if (!isoStr.includes('T')) return isoStr;
  const parts = isoStr.split('T')[1].split(':');
  return `${parts[0]}:${parts[1]}`;
};

export const DutyTimeline: React.FC<DutyTimelineProps> = ({ events }) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <h3 className="text-sm font-bold text-neutral-100 tracking-tight flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-400" /> Daily Duty Status Event Timeline
      </h3>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-3">Start</th>
              <th className="py-2.5 px-3">End</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-4">Location</th>
              <th className="py-2.5 px-4">Remarks & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80 font-medium text-neutral-200">
            {events.map((ev, idx) => {
              const badge = STATUS_BADGE_STYLE[ev.type] || STATUS_BADGE_STYLE.OFF_DUTY;
              return (
                <tr key={idx} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-neutral-300">{formatTime(ev.start_time)}</td>
                  <td className="py-2.5 px-3 font-mono text-neutral-300">{formatTime(ev.end_time)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-100">{ev.duration} h</td>
                  <td className="py-2.5 px-4 text-neutral-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{ev.location || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-neutral-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{ev.notes || '-'}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
