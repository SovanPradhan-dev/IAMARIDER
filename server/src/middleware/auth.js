import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Extract a Bearer access token from the Authorization header.
 */
export const extractToken = (req) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
};

/**
 * Verify an access token and attach the user to req.user.
 * Used for REST protected routes.
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email };
    req.token = token;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid access token', code: 'INVALID_TOKEN' });
    }
    logger.error('authenticate error', { error: err.message });
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Optional authentication: attaches user if a valid token is present,
 * otherwise continues without erroring. Used for public-friendly endpoints.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      req.user = { userId: decoded.userId, email: decoded.email };
      req.token = token;
    }
    return next();
  } catch {
    return next();
  }
};

export const requireAuth = authenticate;
