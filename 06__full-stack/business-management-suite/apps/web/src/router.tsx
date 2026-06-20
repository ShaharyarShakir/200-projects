import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from './components/layout/AppLayout';
import { DashboardPage } from './routes/index';
import { LoginPage } from './routes/auth/login';
import { EmployeesPage } from './routes/employees/index';
import { InventoryPage } from './routes/inventory/index';
import { CustomersPage } from './routes/customers/index';
import { AttendancePage } from './routes/attendance/index';
import { ReportsPage } from './routes/reports/index';

// Define routes
const rootRoute = createRootRoute({ component: RootLayout });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees',
  component: EmployeesPage,
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: InventoryPage,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: CustomersPage,
});

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attendance',
  component: AttendancePage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  employeesRoute,
  inventoryRoute,
  customersRoute,
  attendanceRoute,
  reportsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
