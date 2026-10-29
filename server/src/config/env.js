import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'REFRESH_TOKEN_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const parseDurationMs = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error('REFRESH_TOKEN_TTL must be a number followed by s, m, h, or d');
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * multipliers[match[2]];
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLIENT_URLS: (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d',
  REFRESH_TOKEN_TTL_MS: parseDurationMs(process.env.REFRESH_TOKEN_TTL || '7d'),
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
};
