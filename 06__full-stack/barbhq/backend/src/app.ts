import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { notFound } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';
import apiRouter from './routes';
import { sendResponse } from './utils/ApiResponse';

const app = express();

// Request logging using morgan
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Security & performance middleware
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route welcome endpoint
app.get('/', (_req, res) => {
  sendResponse(res, 200, { service: 'BarberSaaS API', apiVersion: 'v1', status: 'online' }, 'Welcome to the BarberSaaS API!');
});

// API Routes prefix /api/v1
app.use('/api/v1', apiRouter);

// 404 Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
