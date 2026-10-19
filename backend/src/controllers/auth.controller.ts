import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['ADMIN', 'VIEWER']).optional().default('VIEWER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export class AuthController {
  /**
   * Register a new user with bcrypt password hashing
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists',
        });
      }

      // Hash password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Default role to VIEWER, or ADMIN if explicitly specified
      const userRole = role === 'ADMIN' ? 'ADMIN' : 'VIEWER';

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole,
        },
      });

      // Generate JWT
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      logger.info(`User registered successfully: ${newUser.email} (${newUser.role})`);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Log in user, verify bcrypt password, issue JWT & set httpOnly cookie
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      logger.info(`User logged in: ${user.email} (${user.role})`);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Returns current authenticated user profile
   */
  public static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  }

  /**
   * Log out user and clear httpOnly cookie
   */
  public static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
