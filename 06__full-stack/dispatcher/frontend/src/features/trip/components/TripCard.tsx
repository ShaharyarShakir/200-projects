import React from 'react';
import type { Trip } from '../types/trip';
import { TripStatusBadge } from './TripStatusBadge';
import { MapPin, Clock, ArrowRight, Edit, Trash2, Navigation } from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onCalculateRoute?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onEdit, onDelete, onCalculateRoute }) => {
  const formattedDate = new Date(trip.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 shadow-lg backdrop-blur-md transition-all space-y-4 group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TripStatusBadge status={trip.status} />
          <span className="text-[11px] text-neutral-400 font-mono">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {onCalculateRoute && (
            <button
              onClick={() => onCalculateRoute(trip)}
              title="Calculate Route"
              className="p-1.5 text-brand-400 hover:bg-brand-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(trip)}
            title="Edit Trip"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(trip.id)}
            title="Delete Trip"
            className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Locations Flow */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
          <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">{trip.current_location}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{trip.pickup_location}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">{trip.dropoff_location}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycle Used: <strong className="text-neutral-200">{trip.current_cycle_used} hrs</strong></span>
          </span>
        </div>
      </div>

      {trip.notes && (
        <p className="text-xs text-neutral-400 line-clamp-2 italic bg-neutral-950/60 border border-neutral-800 rounded-xl p-2.5">
          "{trip.notes}"
        </p>
      )}
    </div>
  );
};
