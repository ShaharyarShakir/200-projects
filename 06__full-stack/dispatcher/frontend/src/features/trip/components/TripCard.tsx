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
    <div className="bg-neutral-50/90 border border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 shadow-lg transition-all space-y-4 group">
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
              className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(trip)}
            title="Edit Trip"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(trip.id)}
            title="Delete Trip"
            className="p-1.5 text-error-600 hover:bg-error-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Locations Flow */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
          <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span className="truncate">{trip.current_location}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-success-600 shrink-0" />
          <span className="truncate">{trip.pickup_location}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <MapPin className="w-3.5 h-3.5 text-error-600 shrink-0" />
          <span className="truncate">{trip.dropoff_location}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warning-600" />
            <span>Cycle Used: <strong className="text-neutral-800">{trip.current_cycle_used} hrs</strong></span>
          </span>
        </div>
      </div>

      {trip.notes && (
        <p className="text-xs text-neutral-400 line-clamp-2 italic bg-neutral-0/60 border border-neutral-200 rounded-xl p-2.5">
          "{trip.notes}"
        </p>
      )}
    </div>
  );
};
