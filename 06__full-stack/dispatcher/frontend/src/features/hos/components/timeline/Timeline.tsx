import React from 'react';
import { HOSEvent } from '../../types/hos';
import { TimelineCard } from '../cards/TimelineCard';
import { Route, Clock, AlertCircle } from 'lucide-react';

interface TimelineProps {
  events: HOSEvent[];
  isLoading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ events, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-8 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-neutral-400 font-medium">Generating HOS compliant schedule...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-8 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto" />
        <p className="text-xs font-semibold text-neutral-800">No driving schedule generated yet</p>
        <p className="text-xs text-neutral-400">Calculate a route or enter distance to generate your FMCSA timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
          <Route className="w-5 h-5 text-brand-600" /> Trip Plan Timeline
        </h3>
        <span className="text-xs text-neutral-400 font-mono">
          {events.length} Events Scheduled
        </span>
      </div>

      <div className="relative pl-6 space-y-4 border-l-2 border-brand-500/30 ml-3">
        {events.map((event, index) => {
          const startTimeFormatted = new Date(event.start_time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          return (
            <div key={`${event.order}-${index}`} className="relative group">
              {/* Dot indicator */}
              <div className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-neutral-50 ring-4 ring-neutral-50 shadow-sm transition-transform group-hover:scale-125" />

              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-brand-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {startTimeFormatted}
                </div>
                <TimelineCard
                  event={event}
                  isFirst={index === 0}
                  isLast={index === events.length - 1}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
