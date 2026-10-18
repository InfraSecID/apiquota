import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CryptoService } from '../services/crypto.service';
import { maskApiKey, sanitizeProviderResponse } from '../utils/mask';
import { PollerService } from '../services/poller.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Validation Schemas
export const createProviderSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must have at least 2 characters').max(64),
    provider: z.enum(['OPENAI', 'GEMINI', 'ANTHROPIC', 'CUSTOM']),
    apiKey: z.string().min(8, 'API Key must be at least 8 characters long'),
    totalQuota: z.number().positive('Total quota must be greater than 0').default(100),
    alertThreshold: z.number().min(1).max(99).default(20),
  }),
});

export const updateProviderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid provider ID format'),
  }),
  body: z.object({
    name: z.string().min(2).max(64).optional(),
    apiKey: z.string().min(8).optional(),
    totalQuota: z.number().positive().optional(),
    alertThreshold: z.number().min(1).max(99).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const providerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid provider ID format'),
  }),
});

export class ProviderController {
  /**
   * Retrieves list of all configured API Providers.
   * Encrypted keys are strictly omitted; only keyMask is returned.
   */
  public static async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      // Prisma ORM prepared statement - zero risk of SQL Injection
      const providers = await prisma.apiProvider.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          provider: true,
          keyMask: true,
          totalQuota: true,
          usedQuota: true,
          remainingPercentage: true,
          alertThreshold: true,
          status: true,
          lastSyncedAt: true,
          lastAlertSentAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({
        success: true,
        data: providers,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves single provider details including recent usage history
   */
  public static async getProviderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const provider = await prisma.apiProvider.findUnique({
        where: { id },
        include: {
          usageHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!provider) {
        return res.status(404).json({ success: false, error: 'Provider not found' });
      }

      return res.json({
        success: true,
        data: sanitizeProviderResponse(provider),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Securely saves new API Key encrypted with AES-256-GCM
   */
  public static async createProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, provider, apiKey, totalQuota, alertThreshold } = req.body;

      // 1. Encrypt API Key using AES-256-GCM before DB insertion
      const encryptedKey = CryptoService.encrypt(apiKey);

      // 2. Generate safe display mask (e.g. sk-proj-...8a9F)
      const keyMask = maskApiKey(apiKey);

      // 3. Insert using Prisma ORM (Prepared statements)
      const newProvider = await prisma.apiProvider.create({
        data: {
          name,
          provider,
          encryptedKey,
          keyMask,
          totalQuota,
          alertThreshold,
          usedQuota: 0,
          remainingPercentage: 100,
          status: 'HEALTHY',
        },
      });

      logger.info(`Registered provider "${name}" with provider type: ${provider}`);

      // 4. Trigger initial background sync asynchronously
      PollerService.syncProvider(newProvider.id).catch((err) => {
        logger.error(`Initial sync failed for ${newProvider.id}: ${err.message}`);
      });

      // 5. Respond with sanitized DTO - never expose plaintext or ciphertext key
      return res.status(201).json({
        success: true,
        message: 'Provider registered and key securely encrypted.',
        data: sanitizeProviderResponse(newProvider),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates provider metadata or rotates API key
   */
  public static async updateProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, apiKey, totalQuota, alertThreshold, isActive } = req.body;

      const existing = await prisma.apiProvider.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Provider not found' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (totalQuota !== undefined) updateData.totalQuota = totalQuota;
      if (alertThreshold !== undefined) updateData.alertThreshold = alertThreshold;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Rotate API key if provided
      if (apiKey) {
        updateData.encryptedKey = CryptoService.encrypt(apiKey);
        updateData.keyMask = maskApiKey(apiKey);
      }

      const updated = await prisma.apiProvider.update({
        where: { id },
        data: updateData,
      });

      return res.json({
        success: true,
        message: 'Provider updated successfully',
        data: sanitizeProviderResponse(updated),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes a provider
   */
  public static async deleteProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await prisma.apiProvider.delete({
        where: { id },
      });

      return res.json({
        success: true,
        message: 'Provider deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually triggers immediate usage polling
   */
  public static async syncProviderNow(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await PollerService.syncProvider(id);

      return res.json({
        success: true,
        message: 'Provider synchronization complete',
        data: sanitizeProviderResponse(result),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Sync failed: ${err.message}`,
      });
    }
  }
}
