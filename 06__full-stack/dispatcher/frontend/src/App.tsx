import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Container } from './components/Container';

// Feature Pages
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { TripListPage } from './features/trip/pages/TripListPage';

// Route Planner Components
import { TripForm } from './features/routing/components/TripForm';
import { TripSummary } from './features/routing/components/TripSummary';
import { RouteMap } from './features/routing/components/RouteMap';
import { useRoute } from './features/routing/hooks/useRoute';
import type { CoordinatePair, RouteResponse } from './features/routing/types/routing';
import { Compass } from 'lucide-react';



const RoutePlannerContent: React.FC = () => {
  const [originCoords, setOriginCoords] = useState<CoordinatePair | null>([74.3587, 31.5204]); // Lahore
  const [pickupCoords, setPickupCoords] = useState<CoordinatePair | null>([73.0169, 33.5651]); // Rawalpindi
  const [dropoffCoords, setDropoffCoords] = useState<CoordinatePair | null>([73.0479, 33.6844]); // Islamabad

  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const routeMutation = useRoute();

  const handleCalculateRoute = (values: {
    origin: CoordinatePair;
    pickup: CoordinatePair;
    dropoff: CoordinatePair;
  }) => {
    setOriginCoords(values.origin);
    setPickupCoords(values.pickup);
    setDropoffCoords(values.dropoff);
    setErrorMessage(null);

    routeMutation.mutate(values, {
      onSuccess: (data) => {
        setRouteResult(data);
      },
      onError: (error) => {
        setErrorMessage(error.message || 'Failed to calculate route. Please check coordinates.');
      },
    });
  };

  return (
    <div className="space-y-6">
      <section id="trip-form-section">
        <TripForm
          onCalculateRoute={handleCalculateRoute}
          isLoading={routeMutation.isPending}
          errorMsg={errorMessage}
        />
      </section>

      <section id="trip-summary-section">
        <TripSummary
          routeData={routeResult}
          isLoading={routeMutation.isPending}
        />
      </section>

      <section id="map-section" className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="flex items-center gap-2 font-bold text-slate-200 text-base">
            <Compass className="w-5 h-5 text-blue-400" /> Interactive Route Map
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="bg-blue-500 rounded-full w-2.5 h-2.5"></span> Origin
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="bg-emerald-500 rounded-full w-2.5 h-2.5"></span> Pickup
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="bg-red-500 rounded-full w-2.5 h-2.5"></span> Dropoff
            </span>
          </div>
        </div>

        <RouteMap
          originCoords={originCoords}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          geometry={routeResult?.geometry || null}
          isLoading={routeMutation.isPending}
        />
      </section>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');

  return (
    <div className="flex flex-col bg-neutral-0 selection:bg-brand-600 min-h-screen font-body text-neutral-900 selection:text-neutral-0">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1">
        <Container>
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigateNewTrip={() => setCurrentView('route-planner')}
              onNavigateTrips={() => setCurrentView('trip-history')}
            />
          )}

          {currentView === 'route-planner' && <RoutePlannerContent />}

          {currentView === 'login' && (
            <LoginPage
              onSuccess={() => setCurrentView('dashboard')}
              onNavigateRegister={() => setCurrentView('register')}
            />
          )}

          {currentView === 'register' && (
            <RegisterPage
              onSuccess={() => setCurrentView('dashboard')}
              onNavigateLogin={() => setCurrentView('login')}
            />
          )}

          {currentView === 'trip-history' && (
            <TripListPage
              onCalculateRoute={(_trip) => {
                setCurrentView('route-planner');
              }}
            />
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
        <MainLayout />
      
  );
}
