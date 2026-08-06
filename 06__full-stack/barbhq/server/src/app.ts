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
    origin: true, // Auto-reflect origins in development
    credentials: true,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route redirects or returns greeting
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the BarbHQ API!',
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// Not Found Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
