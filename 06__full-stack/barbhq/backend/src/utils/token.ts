import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  shopId: string;
  role: string;
  email: string;
  [key: string]: unknown;
}

export const generateAccessToken = (payload: TokenPayload, expiresIn = '15m'): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const generateRefreshToken = (payload: TokenPayload, expiresIn = '30d'): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
