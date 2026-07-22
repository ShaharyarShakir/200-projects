import React, { useState, useEffect } from 'react';
import { useOptimizeRoute, useUpdateStop, useDeleteStop } from '../hooks/useOptimization';
import type { Stop, OptimizationResult, DriverPreferences } from '../types/optimization';

import { OptimizationBadge } from '../components/OptimizationBadge';
import { RouteStatistics } from '../components/RouteStatistics';
import { RouteComparison } from '../components/RouteComparison';
import { StopTimeline } from '../components/StopTimeline';
import { OptimizationPanel } from '../components/OptimizationPanel';
import { AlternativeRoutes } from '../components/AlternativeRoutes';
import { RouteSimulation } from '../components/RouteSimulation';
import { InteractiveStopEditor } from '../components/InteractiveStopEditor';
import { StopMap } from '../components/StopMap';

import { ArrowRight, RefreshCw } from 'lucide-react';

interface OptimizationPageProps {
  initialTripId?: string;
  onNavigateELD?: () => void;
}

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  initialTripId,
  onNavigateELD,
}) => {
  const [currentLocation, setCurrentLocation] = useState<string>('Dallas, TX');
  const [pickupLocation, setPickupLocation] = useState<string>('Oklahoma City, OK');
  const [dropoffLocation, setDropoffLocation] = useState<string>('Tulsa, OK');
  const [cycleUsed, setCycleUsed] = useState<number>(10.0);

  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [activeStop, setActiveStop] = useState<Stop | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('fastest');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);

  const optimizeMutation = useOptimizeRoute();
  const updateStopMutation = useUpdateStop();
  const deleteStopMutation = useDeleteStop();

  const handleRunOptimization = (driverPrefs?: DriverPreferences) => {
    optimizeMutation.mutate(
      {
        tripId: initialTripId,
        current_location: currentLocation,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        current_cycle_used: cycleUsed,
        driver_preferences: driverPrefs,
      },
      {
        onSuccess: (data) => {
          setOptResult(data);
          if (data.optimized_stops.length > 0) {
            setActiveStop(data.optimized_stops[0]);
          }
        },
      }
    );
  };

  useEffect(() => {
    handleRunOptimization();
  }, [initialTripId]);

  const handleLockToggle = (stopId: string, isLocked: boolean) => {
    if (!optResult) return;
    const updatedStops = optResult.optimized_stops.map((s) =>
      s.id === stopId ? { ...s, is_locked: isLocked } : s
    );
    setOptResult({ ...optResult, optimized_stops: updatedStops });
    if (stopId.includes('-')) {
      updateStopMutation.mutate({ stopId, data: { is_locked: isLocked } });
    }
  };

  const handleDeleteStop = (stopId: string) => {
    if (!optResult) return;
    const updatedStops = optResult.optimized_stops.filter((s) => s.id !== stopId);
    setOptResult({ ...optResult, optimized_stops: updatedStops });
    if (stopId.includes('-')) {
      deleteStopMutation.mutate(stopId);
    }
  };

  const handleSaveStop = (stopData: Partial<Stop>) => {
    if (!optResult) return;
    if (stopData.id) {
      // Edit existing stop
      const updatedStops = optResult.optimized_stops.map((s) =>
        s.id === stopData.id ? ({ ...s, ...stopData } as Stop) : s
      );
      setOptResult({ ...optResult, optimized_stops: updatedStops });
    } else {
      // Add custom stop
      const newStop: Stop = {
        id: `custom-${Date.now()}`,
        name: stopData.name || 'Custom Stop',
        category: stopData.category || 'Fuel',
        latitude: 35.5,
        longitude: -97.0,
        distance_from_start: stopData.distance_from_start || 150,
        arrival_time: new Date().toISOString(),
        departure_time: new Date().toISOString(),
        duration: stopData.duration || 0.5,
        priority: 90,
        source: 'User Custom',
        is_locked: true,
        is_custom: true,
        order: optResult.optimized_stops.length + 1,
        metadata: stopData.metadata || {},
      };
      setOptResult({
        ...optResult,
        optimized_stops: [...optResult.optimized_stops, newStop],
      });
    }
  };

  const geometry: [number, number][] =
    optResult?.optimized_stops
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [s.latitude, s.longitude]) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
              Route Stop Planning & Optimization
            </h1>
            <OptimizationBadge score={optResult?.optimization_score || 94} />
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Location-aware truck stop, fuel station, and FMCSA rest area planner with rules-based routing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunOptimization()}
            disabled={optimizeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${optimizeMutation.isPending ? 'animate-spin' : ''}`} />
            Re-Optimize Itinerary
          </button>

          {onNavigateELD && (
            <button
              onClick={onNavigateELD}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
            >
              Generate ELD Logs <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-neutral-400 font-medium mb-1">Current Location</label>
          <input
            type="text"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-semibold"
          />
        </div>
        <div>
          <label className="block text-neutral-400 font-medium mb-1">Pickup Location</label>
          <input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-semibold"
          />
        </div>
        <div>
          <label className="block text-neutral-400 font-medium mb-1">Dropoff Destination</label>
          <input
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-semibold"
          />
        </div>
        <div>
          <label className="block text-neutral-400 font-medium mb-1">Initial Cycle Hours</label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="70"
            value={cycleUsed}
            onChange={(e) => setCycleUsed(Number(e.target.value))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-neutral-100 font-semibold"
          />
        </div>
      </div>

      {/* Top Route Statistics Cards */}
      {optResult && <RouteStatistics optimizationResult={optResult} />}

      {/* Main Grid: Control Panel & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <OptimizationPanel
            onOptimize={(prefs) => handleRunOptimization(prefs)}
            onSimulate={() => setIsSimulating(true)}
            isLoading={optimizeMutation.isPending}
          />

          {optResult && (
            <AlternativeRoutes
              alternatives={optResult.alternative_routes}
              selectedId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
            />
          )}
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Leaflet Map */}
          {optResult && (
            <StopMap
              stops={optResult.optimized_stops}
              geometry={geometry}
              activeStopId={activeStop?.id}
              onSelectStop={(s) => setActiveStop(s)}
              isLoading={optimizeMutation.isPending}
            />
          )}

          {/* Route Simulation Controller Overlay */}
          {isSimulating && optResult && (
            <RouteSimulation
              stops={optResult.optimized_stops}
              onActiveStopChange={(stop) => setActiveStop(stop)}
              onClose={() => setIsSimulating(false)}
            />
          )}
        </div>
      </div>

      {/* Route Comparison Section */}
      {optResult && <RouteComparison comparison={optResult.route_comparison} />}

      {/* Travel Itinerary Timeline */}
      {optResult && (
        <StopTimeline
          stops={optResult.optimized_stops}
          activeStopId={activeStop?.id}
          onSelectStop={(s) => setActiveStop(s)}
          onLockToggle={handleLockToggle}
          onEditStop={(s) => {
            setEditingStop(s);
            setIsEditorOpen(true);
          }}
          onDeleteStop={handleDeleteStop}
          onAddCustomStop={() => {
            setEditingStop(null);
            setIsEditorOpen(true);
          }}
        />
      )}

      {/* Interactive Stop Editor Modal */}
      <InteractiveStopEditor
        isOpen={isEditorOpen}
        stop={editingStop}
        onSave={handleSaveStop}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
};
