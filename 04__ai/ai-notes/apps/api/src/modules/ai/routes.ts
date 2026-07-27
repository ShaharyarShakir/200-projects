import { Hono } from 'hono';
import { AIController } from './controller.js';
import { requireAuth } from '@/middleware/auth.js';
import { rateLimit } from '@/middleware/rateLimit.js';

const app = new Hono();

// All AI routes require login and rate limiting
app.use('*', requireAuth);
app.use('*', rateLimit(20, 60000));

app.post('/summarize', AIController.summarize);
app.post('/explain', AIController.explain);
app.post('/rewrite', AIController.rewrite);

export default app;