import React, { useState } from 'react';
import type { DailyLog } from '../types/eld';
import { DailyLogCard } from './DailyLogCard';
import { ExportButton } from './ExportButton';
import { Calendar, ChevronRight, FileSpreadsheet, Layers } from 'lucide-react';

interface ELDViewerProps {
  logs: DailyLog[];
  tripId?: string | null;
  isLoading?: boolean;
}

export const ELDViewer: React.FC<ELDViewerProps> = ({ logs, tripId, isLoading }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-12 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-neutral-700">Generating FMCSA Daily ELD Log Sheets...</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-10 text-center space-y-3">
        <FileSpreadsheet className="w-10 h-10 text-neutral-400 mx-auto" />
        <h4 className="text-base font-bold text-neutral-800">No ELD Logs Generated Yet</h4>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Run the HOS schedule calculation to automatically generate multi-day FMCSA daily log sheets.
        </p>
      </div>
    );
  }

  const activeLog = logs[selectedDayIndex] || logs[0];

  return (
    <div className="space-y-6">
      {/* ELD Viewer Navigation Bar */}
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-600 border border-brand-200 text-xs font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Multi-Day ELD Engine
            </span>
            <span className="text-xs text-neutral-400">Total {logs.length} Log Sheets</span>
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            FMCSA Daily Log Sheets
          </h2>
        </div>

        {/* Export Controls */}
        <ExportButton tripId={tripId} />
      </div>

      {/* Day Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {logs.map((log, idx) => {
          const isActive = idx === selectedDayIndex;
          return (
            <button
              key={log.day_number}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                isActive
                  ? 'bg-brand-600 text-neutral-0 border-brand-500 shadow-md shadow-brand-600/30'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day {log.day_number}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-brand-700 text-neutral-0' : 'bg-neutral-200 text-neutral-700'}`}>
                {log.date}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Single-Day Log Card */}
      <DailyLogCard log={activeLog} />
    </div>
  );
};
