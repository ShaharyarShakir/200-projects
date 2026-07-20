import React from 'react';
import type { Trip } from '../types/trip';
import { TripStatusBadge } from './TripStatusBadge';
import { Edit, Trash2, Navigation, MapPin } from 'lucide-react';

interface TripTableProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onCalculateRoute?: (trip: Trip) => void;
}

export const TripTable: React.FC<TripTableProps> = ({ trips, onEdit, onDelete, onCalculateRoute }) => {
  return (
    <div className="overflow-x-auto bg-neutral-50/90 border border-neutral-200 rounded-2xl shadow-xl">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider bg-neutral-0/40">
            <th className="py-3 px-4">Current Location</th>
            <th className="py-3 px-4">Pickup Location</th>
            <th className="py-3 px-4">Dropoff Location</th>
            <th className="py-3 px-4">Cycle Hours</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Created</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800">
          {trips.map((trip) => (
            <tr key={trip.id} className="hover:bg-neutral-100 transition-colors group">
              <td className="py-3 px-4 font-semibold text-neutral-900">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{trip.current_location}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-success-600 shrink-0" />
                  <span>{trip.pickup_location}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-error-600 shrink-0" />
                  <span>{trip.dropoff_location}</span>
                </div>
              </td>
              <td className="py-3 px-4 font-mono text-warning-600 font-medium">
                {trip.current_cycle_used} hrs
              </td>
              <td className="py-3 px-4">
                <TripStatusBadge status={trip.status} />
              </td>
              <td className="py-3 px-4 text-neutral-400 text-[11px] font-mono">
                {new Date(trip.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
