import express, { Application, Request, Response } from 'express';
import {
  helmetSecurityMiddleware,
  corsSecurityMiddleware,
  hideServerHeaders,
} from './middleware/security.middleware';
import { generalApiLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/error.middleware';
import apiRoutes from './routes';

const app: Application = express();

// 1. Core Security Headers & Hardening
app.use(hideServerHeaders);
app.use(corsSecurityMiddleware);
app.use(helmetSecurityMiddleware);

// 2. Body Parsers with payload size restriction (DoS mitigation)
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// 3. Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. Rate-limited API Routes
app.use('/api', generalApiLimiter, apiRoutes);

// 5. 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// 6. Centralized Error Handler (Prevents stack trace leaks in production)
app.use(errorHandler);

export default app;
