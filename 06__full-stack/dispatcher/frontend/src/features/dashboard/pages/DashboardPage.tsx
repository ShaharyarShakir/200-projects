import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useTrips } from '../../trip/hooks/useTrips';
import { TripStatusBadge } from '../../trip/components/TripStatusBadge';
import type { Trip } from '../../trip/types/trip';
import {
  Route,
  Navigation,
  Clock,
  ShieldCheck,
  Plus,
  TrendingUp,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateNewTrip: () => void;
  onNavigateTrips?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateNewTrip, onNavigateTrips }) => {
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = useTrips({ page: 1 });

  const trips: Trip[] = Array.isArray(data) ? data : (data as any)?.results || [];
  const totalTrips = Array.isArray(data) ? data.length : (data as any)?.count || 0;

  const draftCount = trips.filter((t) => t.status === 'Draft').length;
  const planningCount = trips.filter((t) => t.status === 'Planning').length;
  const completedCount = trips.filter((t) => t.status === 'Completed').length;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-300/40 via-brand-200/30 to-neutral-50 border border-brand-300/30 rounded-2xl p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-600">
            <ShieldCheck className="w-3.5 h-3.5" /> Dispatcher Control Center v1.0
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Welcome back, {isAuthenticated ? user?.first_name || user?.email : 'Dispatcher'}!
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Manage trip routes, calculate driving distances, track mandatory HOS rest breaks, and generate compliant ELD driver logs.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onNavigateNewTrip}
              className="bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Calculate Route & Plan Trip
            </button>
            {onNavigateTrips && (
              <button
                onClick={onNavigateTrips}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                <Route className="w-4 h-4 text-brand-600" />
                Manage Trip Records ({totalTrips})
              </button>
            )}
          </div>
        </div>

        {/* Decorative Grid SVG */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none hidden lg:block">
          <Route className="w-64 h-64 text-brand-600" />
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Trip Records</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{isLoading ? '...' : totalTrips}</p>
            <p className="text-[11px] text-success-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Live from DB
            </p>
          </div>
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-600">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Draft Trips</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{isLoading ? '...' : draftCount}</p>
            <p className="text-[11px] text-neutral-400 mt-1">Pending route setup</p>
          </div>
          <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Planning Trips</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{isLoading ? '...' : planningCount}</p>
            <p className="text-[11px] text-brand-600 font-medium mt-1">In progress</p>
          </div>
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Trips</p>
            <p className="text-2xl font-bold text-success-600 mt-1">{isLoading ? '...' : completedCount}</p>
            <p className="text-[11px] text-success-600 font-medium mt-1">Fulfilled</p>
          </div>
          <div className="p-3 bg-success-50 border border-success-200 rounded-xl text-success-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Start & Recent Trips Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Start Panel */}
        <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-600" /> Quick Actions
          </h3>
          <p className="text-xs text-neutral-400">
            Get started immediately by running route calculations or managing saved trip records.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={onNavigateNewTrip}
              className="w-full text-left bg-neutral-0 hover:bg-brand-50/40 border border-neutral-200 hover:border-brand-300 p-4 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-800 group-hover:text-brand-600 transition-colors">
                  Calculate New Route
                </span>
                <Navigation className="w-4 h-4 text-neutral-400 group-hover:text-brand-600" />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Geocode addresses and draw polylines on Leaflet map</p>
            </button>

            {onNavigateTrips && (
              <button
                onClick={onNavigateTrips}
                className="w-full text-left bg-neutral-0 hover:bg-brand-50/40 border border-neutral-200 hover:border-brand-300 p-4 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-neutral-800 group-hover:text-brand-600 transition-colors">
                    Manage Trip Database
                  </span>
                  <Route className="w-4 h-4 text-neutral-400 group-hover:text-brand-600" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">Create, edit, and filter PostgreSQL trip entries</p>
              </button>
            )}
          </div>
        </div>

        {/* Recent Trips Table Panel */}
        <div className="lg:col-span-2 bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Route className="w-5 h-5 text-brand-600" /> Recent Saved Trips
            </h3>
            {onNavigateTrips && (
              <button
                onClick={onNavigateTrips}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors cursor-pointer"
              >
                View all ({totalTrips}) →
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="bg-neutral-0 border border-neutral-200 rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-800">Sign in to view your trip records</p>
              <p className="text-xs text-neutral-400">Authenticated users can persist and sync trip logs directly to PostgreSQL.</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-8 text-neutral-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Loading trips from database...</span>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-neutral-0 border border-neutral-200 rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-800">No trips recorded yet</p>
              <p className="text-xs text-neutral-400">Create your first trip record to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Origin</th>
                    <th className="pb-3 px-3">Pickup</th>
                    <th className="pb-3 px-3">Dropoff</th>
                    <th className="pb-3 px-3">Cycle Hours</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-800">
                  {trips.slice(0, 5).map((trip) => (
                    <tr key={trip.id} className="hover:bg-neutral-100 transition-colors">
                      <td className="py-3 px-3 font-medium text-neutral-900">{trip.current_location}</td>
                      <td className="py-3 px-3">{trip.pickup_location}</td>
                      <td className="py-3 px-3">{trip.dropoff_location}</td>
                      <td className="py-3 px-3 font-mono text-warning-600">{trip.current_cycle_used} hrs</td>
                      <td className="py-3 px-3">
                        <TripStatusBadge status={trip.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
