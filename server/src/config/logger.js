import { env } from './env.js';

/**
 * Structured logger.
 * Logs are JSON-friendly key=value lines and never include credentials,
 * passwords, refresh tokens, or precise raw location payloads.
 */
const sensitive = ['password', 'passwordHash', 'refreshToken', 'token', 'secret'];

const redact = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.includes(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else if (k === 'location' && v && typeof v === 'object') {
      out[k] = { type: v.type, coords: '[REDACTED]' };
    } else {
      out[k] = v;
    }
  }
  return out;
};

export const logger = {
  debug(msg, meta) {
    if (env.NODE_ENV !== 'development') return;
    console.log(JSON.stringify({ level: 'debug', message: msg, ...(meta ? { meta: redact(meta) } : {}) }));
  },
  info(msg, meta) {
    console.log(JSON.stringify({ level: 'info', message: msg, ...(meta ? { meta: redact(meta) } : {}) }));
  },
  warn(msg, meta) {
    console.warn(JSON.stringify({ level: 'warn', message: msg, ...(meta ? { meta: redact(meta) } : {}) }));
  },
  error(msg, meta) {
    console.error(JSON.stringify({ level: 'error', message: msg, ...(meta ? { meta: redact(meta) } : {}) }));
  },
};
