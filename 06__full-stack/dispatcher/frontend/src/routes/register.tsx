import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

export const Route = createFileRoute('/register')({
  component: RegisterRoutePage,
});

function RegisterRoutePage() {
  const navigate = useNavigate();

  return (
    <RegisterPage
      onSuccess={() => navigate({ to: '/' })}
      onNavigateLogin={() => navigate({ to: '/login' })}
    />
  );
}
