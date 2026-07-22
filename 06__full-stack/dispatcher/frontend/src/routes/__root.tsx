import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Container } from '../components/Container';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex flex-col bg-neutral-950 text-neutral-100 selection:bg-brand-600 min-h-screen font-body selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Container>
          <Outlet />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
