import { env } from './env.js';

const developmentLanOrigin = /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::5173)$/;

export const isAllowedClientOrigin = (origin) => {
  if (!origin || env.CLIENT_URLS.includes(origin)) return true;
  return env.NODE_ENV !== 'production' && developmentLanOrigin.test(origin);
};
