import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { TripForm } from '../features/routing/components/TripForm';
import { TripSummary } from '../features/routing/components/TripSummary';
import { RouteMap } from '../features/routing/components/RouteMap';
import { useCalculateRoute } from '../features/routing/hooks/useRoute';
import type { CoordinatePair, RouteResponse } from '../features/routing/types/routing';
import { Compass } from 'lucide-react';

export const Route = createFileRoute('/route-planner')({
  component: RoutePlannerPage,
});

function RoutePlannerPage() {
  const [originCoords, setOriginCoords] = useState<CoordinatePair | null>([74.3587, 31.5204]); // Lahore
  const [pickupCoords, setPickupCoords] = useState<CoordinatePair | null>([73.0169, 33.5651]); // Rawalpindi
  const [dropoffCoords, setDropoffCoords] = useState<CoordinatePair | null>([73.0479, 33.6844]); // Islamabad

  const [originName, setOriginName] = useState<string>('Lahore');
  const [pickupName, setPickupName] = useState<string>('Rawalpindi');
  const [dropoffName, setDropoffName] = useState<string>('Islamabad');

  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculateRouteMutation = useCalculateRoute();

  const triggerCalculation = (
    orig: CoordinatePair,
    pick: CoordinatePair,
    drop: CoordinatePair
  ) => {
    setErrorMessage(null);
    calculateRouteMutation.mutate(
      { origin: orig, pickup: pick, dropoff: drop },
      {
        onSuccess: (data) => {
          setRouteResult(data);
        },
        onError: (error) => {
          setErrorMessage(error.message || 'Failed to calculate route. Please check coordinates.');
        },
      }
    );
  };

  const handleCalculateRoute = (values: {
    origin: CoordinatePair;
    pickup: CoordinatePair;
    dropoff: CoordinatePair;
    originName: string;
    pickupName: string;
    dropoffName: string;
  }) => {
    setOriginCoords(values.origin);
    setPickupCoords(values.pickup);
    setDropoffCoords(values.dropoff);
    setOriginName(values.originName);
    setPickupName(values.pickupName);
    setDropoffName(values.dropoffName);

    triggerCalculation(values.origin, values.pickup, values.dropoff);
  };

  const handleRecalculate = () => {
    if (originCoords && pickupCoords && dropoffCoords) {
      triggerCalculation(originCoords, pickupCoords, dropoffCoords);
    }
  };

  return (
    <div className="space-y-6">
      <section id="trip-form-section">
        <TripForm
          onCalculateRoute={handleCalculateRoute}
          isLoading={calculateRouteMutation.isPending}
          errorMsg={errorMessage}
        />
      </section>

      <section id="trip-summary-section">
        <TripSummary
          routeData={routeResult}
          isLoading={calculateRouteMutation.isPending}
        />
      </section>

      <section id="map-section" className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="flex items-center gap-2 font-bold text-neutral-100 text-base">
            <Compass className="w-5 h-5 text-brand-400" /> Interactive Route Map
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="bg-brand-500 rounded-full w-2.5 h-2.5"></span> Current
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="bg-emerald-500 rounded-full w-2.5 h-2.5"></span> Pickup
            </span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="bg-rose-500 rounded-full w-2.5 h-2.5"></span> Dropoff
            </span>
          </div>
        </div>

        <RouteMap
          originCoords={originCoords}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          originName={originName}
          pickupName={pickupName}
          dropoffName={dropoffName}
          geometry={routeResult?.geometry || null}
          bbox={routeResult?.bbox || null}
          steps={routeResult?.steps || null}
          isLoading={calculateRouteMutation.isPending}
          onRecalculate={handleRecalculate}
        />
      </section>
    </div>
  );
}
