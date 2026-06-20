import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { employeeRoutes } from './routes/employee.routes';
import { attendanceRoutes } from './routes/attendance.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { customerRoutes } from './routes/customer.routes';
import { reportRoutes } from './routes/report.routes';
import { aiRoutes } from './routes/ai.routes';
import { uploadRoutes } from './routes/upload.routes';

export const app = new Hono().basePath('/api/v1');

// Global middleware
app.use('*', cors({ origin: '*', credentials: true }));
app.use('*', logger());
app.use('*', prettyJSON());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/employees', employeeRoutes);
app.route('/attendance', attendanceRoutes);
app.route('/inventory', inventoryRoutes);
app.route('/customers', customerRoutes);
app.route('/reports', reportRoutes);
app.route('/ai', aiRoutes);
app.route('/upload', uploadRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Route not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});
