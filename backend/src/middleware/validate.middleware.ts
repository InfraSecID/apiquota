import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates incoming request against a Zod schema.
 * Rejects malicious, unexpected, or malformed data before hitting controllers.
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.').replace(/^(body|query|params)\./, ''),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({ success: false, error: 'Internal validation error' });
    }
  };
};
