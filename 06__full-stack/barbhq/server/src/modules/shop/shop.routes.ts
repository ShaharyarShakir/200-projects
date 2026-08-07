import { Router } from 'express';
import { getShopProfile } from './shop.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const shopRouter = Router();

shopRouter.use(authenticate);

shopRouter.get('/shops/profile', getShopProfile);
