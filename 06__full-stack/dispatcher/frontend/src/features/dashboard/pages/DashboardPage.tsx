import React from 'react';
import { Link } from '@tanstack/react-router';
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
  onNavigateNewTrip?: () => void;
  onNavigateTrips?: () => void;
  onNavigateHos?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateNewTrip, onNavigateTrips, onNavigateHos }) => {
  const { user, isAuthenticated } = useAuth();
  const { data: tripsData, isLoading, isError, error } = useTrips({ page: 1 });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : (tripsData as any)?.results || [];
  const totalTrips = Array.isArray(tripsData) ? tripsData.length : (tripsData as any)?.count || 0;

  const draftCount = trips.filter((t: Trip) => t.status === 'Draft').length;
  const planningCount = trips.filter((t: Trip) => t.status === 'Planning').length;
  const completedCount = trips.filter((t: Trip) => t.status === 'Completed').length;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-950/80 via-neutral-900 to-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl backdrop-blur-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 border border-brand-500/30 text-brand-300">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> Dispatcher Control Center v1.0
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">
            Welcome back, {isAuthenticated ? user?.first_name || user?.email : 'Dispatcher'}!
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Manage trip routes, calculate driving distances, track mandatory HOS rest breaks, and generate compliant ELD driver logs.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/route-planner"
              onClick={onNavigateNewTrip}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Calculate Route & Plan Trip
            </Link>
            <Link
              to="/hos-logs"
              onClick={onNavigateHos}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Clock className="w-4 h-4 text-brand-400" />
              HOS Driving Engine
            </Link>
            <Link
              to="/trips"
              onClick={onNavigateTrips}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <Route className="w-4 h-4 text-emerald-400" />
              Manage Trip Records ({totalTrips})
            </Link>
          </div>
        </div>

        {/* Decorative Grid SVG */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <Route className="w-64 h-64 text-brand-400" />
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Trip Records</p>
            <p className="text-2xl font-bold text-neutral-100 mt-1">{isLoading ? '...' : totalTrips}</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Live from DB
            </p>
          </div>
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Draft Trips</p>
            <p className="text-2xl font-bold text-neutral-100 mt-1">{isLoading ? '...' : draftCount}</p>
            <p className="text-[11px] text-neutral-400 mt-1">Pending route setup</p>
          </div>
          <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Planning Trips</p>
            <p className="text-2xl font-bold text-neutral-100 mt-1">{isLoading ? '...' : planningCount}</p>
            <p className="text-[11px] text-brand-400 font-medium mt-1">In progress</p>
          </div>
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Trips</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{isLoading ? '...' : completedCount}</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">Fulfilled</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Start & Recent Trips Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Start Panel */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <h3 className="text-lg font-bold text-neutral-100 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-400" /> Quick Actions
          </h3>
          <p className="text-xs text-neutral-400">
            Get started immediately by running route calculations or managing saved trip records.
          </p>

          <div className="space-y-3 pt-2">
            <Link
              to="/route-planner"
              onClick={onNavigateNewTrip}
              className="block w-full text-left bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-750 hover:border-brand-500/50 p-4 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-200 group-hover:text-brand-400 transition-colors">
                  Calculate New Route
                </span>
                <Navigation className="w-4 h-4 text-neutral-400 group-hover:text-brand-400" />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Geocode addresses and draw polylines on Leaflet map</p>
            </Link>

            <Link
              to="/trips"
              onClick={onNavigateTrips}
              className="block w-full text-left bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-750 hover:border-brand-500/50 p-4 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-neutral-200 group-hover:text-brand-400 transition-colors">
                  Manage Trip Database
                </span>
                <Route className="w-4 h-4 text-neutral-400 group-hover:text-brand-400" />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Create, edit, and filter PostgreSQL trip entries</p>
            </Link>
          </div>
        </div>

        {/* Recent Trips Table Panel */}
        <div className="lg:col-span-2 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-neutral-100 tracking-tight flex items-center gap-2">
              <Route className="w-5 h-5 text-brand-400" /> Recent Saved Trips
            </h3>
            <Link
              to="/trips"
              onClick={onNavigateTrips}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors cursor-pointer"
            >
              View all ({totalTrips}) →
            </Link>
          </div>

          {!isAuthenticated ? (
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-200">Sign in to view your trip records</p>
              <p className="text-xs text-neutral-400">Authenticated users can persist and sync trip logs directly to PostgreSQL.</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-8 text-neutral-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              <span>Loading trips from database...</span>
            </div>
          ) : isError ? (
            <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
              <p className="text-xs font-semibold text-rose-200">Failed to load trip records</p>
              <p className="text-xs text-rose-400">{(error as any)?.message || 'Please check API connection.'}</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-200">No trips recorded yet</p>
              <p className="text-xs text-neutral-400">Create your first trip record to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Origin</th>
                    <th className="pb-3 px-3">Pickup</th>
                    <th className="pb-3 px-3">Dropoff</th>
                    <th className="pb-3 px-3">Cycle Hours</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
                  {trips.slice(0, 5).map((trip: Trip) => (
                    <tr key={trip.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-neutral-100">{trip.current_location}</td>
                      <td className="py-3 px-3">{trip.pickup_location}</td>
                      <td className="py-3 px-3">{trip.dropoff_location}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{trip.current_cycle_used} hrs</td>
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
