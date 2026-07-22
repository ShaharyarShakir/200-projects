import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  return (
    <DashboardPage
      onNavigateNewTrip={() => navigate({ to: '/route-planner' })}
      onNavigateTrips={() => navigate({ to: '/trips' })}
      onNavigateHos={() => navigate({ to: '/hos-logs' })}
    />
  );
}
