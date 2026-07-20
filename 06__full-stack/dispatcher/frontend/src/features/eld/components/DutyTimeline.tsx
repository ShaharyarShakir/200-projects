import React from 'react';
import type { DutyEvent, DutyStatus } from '../types/eld';
import { Clock, MapPin, FileText } from 'lucide-react';

interface DutyTimelineProps {
  events: DutyEvent[];
}

const STATUS_BADGE_STYLE: Record<DutyStatus, { bg: string; text: string; label: string }> = {
  OFF_DUTY: { bg: 'bg-neutral-100 border-neutral-300', text: 'text-neutral-700', label: 'OFF DUTY' },
  SLEEPER_BERTH: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'SLEEPER BERTH' },
  DRIVING: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'DRIVING' },
  ON_DUTY: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'ON DUTY' },
};

const formatTime = (isoStr: string) => {
  if (!isoStr) return '--:--';
  if (!isoStr.includes('T')) return isoStr;
  const parts = isoStr.split('T')[1].split(':');
  return `${parts[0]}:${parts[1]}`;
};

export const DutyTimeline: React.FC<DutyTimelineProps> = ({ events }) => {
  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 tracking-tight flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-600" /> Daily Duty Status Event Timeline
      </h3>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-900 text-neutral-0 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-3">Start</th>
              <th className="py-2.5 px-3">End</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-4">Location</th>
              <th className="py-2.5 px-4">Remarks & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-medium">
            {events.map((ev, idx) => {
              const badge = STATUS_BADGE_STYLE[ev.type] || STATUS_BADGE_STYLE.OFF_DUTY;
              return (
                <tr key={idx} className="hover:bg-neutral-100/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-neutral-700">{formatTime(ev.start_time)}</td>
                  <td className="py-2.5 px-3 font-mono text-neutral-700">{formatTime(ev.end_time)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{ev.duration} h</td>
                  <td className="py-2.5 px-4 text-neutral-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{ev.location || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-neutral-600">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
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
