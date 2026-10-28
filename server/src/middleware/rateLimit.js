import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages, please slow down' },
});

export const locationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // ~2 updates/sec sustained allowance at REST level
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many location updates, please slow down' },
});

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});
