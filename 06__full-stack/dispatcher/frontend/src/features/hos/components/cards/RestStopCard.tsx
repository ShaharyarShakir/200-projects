import React from 'react';
import { BedDouble, Coffee, MapPin, Clock } from 'lucide-react';
import { HOSEvent } from '../../types/hos';

interface RestStopCardProps {
  event: HOSEvent;
}

export const RestStopCard: React.FC<RestStopCardProps> = ({ event }) => {
  const isSleep = event.type === 'sleep';
  const startTime = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const bgStyles = isSleep
    ? 'bg-purple-500/10 border-purple-500/30'
    : 'bg-amber-500/10 border-amber-500/30';
  const iconColor = isSleep ? 'text-purple-400' : 'text-amber-400';
  const titleColor = isSleep ? 'text-purple-300' : 'text-amber-300';
  const badgeBg = isSleep ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300';

  return (
    <div className={`border rounded-xl p-4 space-y-2 flex items-center justify-between shadow-sm ${bgStyles}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${badgeBg}`}>
          {isSleep ? <BedDouble className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${titleColor}`}>
              {isSleep ? '10-Hour Sleeper Berth Rest' : '30-Minute Mandatory Break'}
            </span>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${badgeBg}`}>
              {isSleep ? 'FMCSA 11h/14h Limit' : 'FMCSA 8h Drive Rule'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
            <MapPin className={`w-3.5 h-3.5 ${iconColor}`} /> {event.location}
          </p>
        </div>
      </div>

      <div className="text-right font-mono">
        <span className={`text-sm font-bold ${titleColor}`}>{startTime} - {endTime}</span>
        <p className="text-xs text-neutral-400 mt-0.5 flex items-center justify-end gap-1">
          <Clock className={`w-3 h-3 ${iconColor}`} /> {event.hours}h ({event.minutes} min)
        </p>
      </div>
    </div>
  );
};
