import rateLimit from 'express-rate-limit';

/**
 * Standard API Rate Limiter
 * 120 requests per 15 minutes window
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict Rate Limiter for Sensitive Operations (Adding/Updating API keys)
 * 10 requests per minute
 */
export const sensitiveWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many credential modification attempts. Please try again in 1 minute.',
  },
});

/**
 * Sync / Poller Trigger Limiter
 * 15 requests per 5 minutes
 */
export const syncTriggerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Manual sync rate limit exceeded. Please wait 5 minutes before re-syncing.',
  },
});
