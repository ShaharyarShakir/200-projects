import { Router } from 'express';
import { getHealth, getVersion } from '../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/health', getHealth);
healthRouter.get('/version', getVersion);
