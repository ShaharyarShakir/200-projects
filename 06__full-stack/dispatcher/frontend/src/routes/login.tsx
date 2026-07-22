import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LoginPage } from '../features/auth/pages/LoginPage';

export const Route = createFileRoute('/login')({
  component: LoginRoutePage,
});

function LoginRoutePage() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onSuccess={() => navigate({ to: '/' })}
      onNavigateRegister={() => navigate({ to: '/register' })}
    />
  );
}
