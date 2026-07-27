import { Hono } from 'hono';
import { AIController } from './controller.js';
import { requireAuth } from '@/middleware/auth.js';

const app = new Hono();

// All AI routes require login
app.use('*', requireAuth);

app.post('/summarize', AIController.summarize);
app.post('/explain', AIController.explain);
app.post('/rewrite', AIController.rewrite);

export default app;