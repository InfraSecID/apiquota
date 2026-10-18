import helmet from 'helmet';
import cors from 'cors';
import { RequestHandler } from 'express';
import { env } from '../config/env';

/**
 * Strict Content Security Policy and HTTP Security Headers using Helmet.
 * Addresses: XSS, Clickjacking, MIME-sniffing, Protocol Downgrade (HSTS).
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allowed for modern dynamic UI styles
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", env.CORS_ORIGIN],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Strict CORS policy restricted to designated frontend origins
 */
export const corsSecurityMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl or internal tests) or match exact origin
    if (!origin || origin === env.CORS_ORIGIN || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for unauthorized origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
});

/**
 * Strips identifying server headers
 */
export const hideServerHeaders: RequestHandler = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};
