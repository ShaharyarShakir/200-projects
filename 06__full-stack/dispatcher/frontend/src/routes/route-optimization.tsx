import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { OptimizationPage } from '../features/optimization/pages/OptimizationPage';

export const Route = createFileRoute('/route-optimization')({
  component: RouteOptimizationPage,
});

function RouteOptimizationPage() {
  const navigate = useNavigate();

  return (
    <OptimizationPage
      onNavigateELD={() => navigate({ to: '/hos-logs' })}
    />
  );
}
