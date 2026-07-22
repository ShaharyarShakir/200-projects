import React from 'react';
import type { Stop } from '../types/optimization';
import { StopCard, getCategoryBadgeStyle } from './StopCard';
import { ArrowDown, MapPin, Clock, Plus } from 'lucide-react';

interface StopTimelineProps {
  stops: Stop[];
  activeStopId?: string;
  onSelectStop?: (stop: Stop) => void;
  onLockToggle?: (stopId: string, locked: boolean) => void;
  onEditStop?: (stop: Stop) => void;
  onDeleteStop?: (stopId: string) => void;
  onAddCustomStop?: () => void;
}

export const StopTimeline: React.FC<StopTimelineProps> = ({
  stops,
  activeStopId,
  onSelectStop,
  onLockToggle,
  onEditStop,
  onDeleteStop,
  onAddCustomStop,
}) => {
  const sortedStops = [...stops].sort(
    (a, b) => a.order - b.order || a.distance_from_start - b.distance_from_start
  );

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" /> Optimized Travel Itinerary
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Sequential timeline with ETA recalculation & HOS compliance
          </p>
        </div>

        {onAddCustomStop && (
          <button
            type="button"
            onClick={onAddCustomStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stop
          </button>
        )}
      </div>

      <div className="relative pl-4 space-y-3">
        {/* Timeline connector line */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-800" />

        {sortedStops.map((stop, index) => {
          const badgeStyle = getCategoryBadgeStyle(stop.category);
          const isLast = index === sortedStops.length - 1;

          return (
            <React.Fragment key={stop.id || index}>
              <div className="relative flex items-start gap-4">
                {/* Node Dot */}
                <div
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] z-10 shadow ${badgeStyle.marker}`}
                >
                  {index + 1}
                </div>

                {/* Card Container */}
                <div className="flex-1">
                  <StopCard
                    stop={stop}
                    isActive={activeStopId === stop.id}
                    onSelect={() => onSelectStop && onSelectStop(stop)}
                    onLockToggle={onLockToggle}
                    onEdit={onEditStop}
                    onDelete={onDeleteStop}
                  />
                </div>
              </div>

              {!isLast && (
                <div className="flex justify-center my-1 ml-6 pl-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-400">
                    <Clock className="w-3 h-3 text-brand-400" />
                    <span>
                      Drive segment ~
                      {roundTo(
                        (sortedStops[index + 1].distance_from_start - stop.distance_from_start) / 55,
                        1
                      )}{' '}
                      hrs
                    </span>
                    <ArrowDown className="w-3 h-3 text-neutral-500" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const roundTo = (num: number, dec: number) => {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
};
