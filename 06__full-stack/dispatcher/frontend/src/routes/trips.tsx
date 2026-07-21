import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { TripListPage } from '../features/trip/pages/TripListPage';

export const Route = createFileRoute('/trips')({
  component: TripsRoutePage,
});

function TripsRoutePage() {
  const navigate = useNavigate();

  return (
    <TripListPage
      onCalculateRoute={(_trip) => {
        navigate({ to: '/route-planner' });
      }}
    />
  );
}
