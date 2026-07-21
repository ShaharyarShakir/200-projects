import React from 'react';
import type { HOSEvent } from '../../types/hos';
import { DriverStatusBadge } from './DriverStatusBadge';
import { FuelStopCard } from './FuelStopCard';
import { RestStopCard } from './RestStopCard';
import { Clock, MapPin } from 'lucide-react';

interface TimelineCardProps {
  event: HOSEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ event, isFirst: _isFirst, isLast: _isLast }) => {
  if (event.type === 'fuel') {
    return <FuelStopCard event={event} />;
  }
  if (event.type === 'break' || event.type === 'sleep') {
    return <RestStopCard event={event} />;
  }

  const startTime = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-md backdrop-blur-md">
      <div className="flex items-center gap-3">
        <DriverStatusBadge type={event.type} />
        <div>
          <p className="font-semibold text-sm text-neutral-100 flex items-center gap-1">
            {event.notes}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-400" /> {event.location}
            {event.distance > 0 && <span className="font-mono text-neutral-400">({event.distance} miles)</span>}
          </p>
        </div>
      </div>

      <div className="text-right font-mono">
        <span className="text-sm font-bold text-neutral-100">{startTime} - {endTime}</span>
        <p className="text-xs text-neutral-400 mt-0.5 flex items-center justify-end gap-1">
          <Clock className="w-3 h-3 text-neutral-400" /> {event.hours}h ({event.minutes}m)
        </p>
      </div>
    </div>
  );
};
