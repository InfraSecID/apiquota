import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AlertService } from '../services/alert.service';
import { maskApiKey } from '../utils/mask';

const prisma = new PrismaClient();

export const updateAlertConfigSchema = z.object({
  body: z.object({
    telegramBotToken: z.string().optional(),
    telegramChatId: z.string().optional(),
    whatsappWebhookUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    defaultThreshold: z.number().min(1).max(99).optional(),
    isEnabled: z.boolean().optional(),
  }),
});

export const testAlertSchema = z.object({
  body: z.object({
    channel: z.enum(['TELEGRAM', 'WHATSAPP']),
    telegramBotToken: z.string().optional(),
    telegramChatId: z.string().optional(),
    whatsappWebhookUrl: z.string().url().optional(),
  }),
});

export class AlertController {
  /**
   * Retrieves current alert settings (with sensitive bot tokens masked)
   */
  public static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      let config = await prisma.notificationConfig.findUnique({
        where: { id: 'default-config' },
      });

      if (!config) {
        config = await prisma.notificationConfig.create({
          data: {
            id: 'default-config',
            defaultThreshold: 20.0,
            isEnabled: true,
          },
        });
      }

      return res.json({
        success: true,
        data: {
          ...config,
          telegramBotTokenMasked: config.telegramBotToken ? maskApiKey(config.telegramBotToken) : null,
          hasTelegramBotToken: Boolean(config.telegramBotToken),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates notification channels and alert thresholds
   */
  public static async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { telegramBotToken, telegramChatId, whatsappWebhookUrl, defaultThreshold, isEnabled } = req.body;

      const updateData: any = {};
      if (telegramBotToken !== undefined) updateData.telegramBotToken = telegramBotToken;
      if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
      if (whatsappWebhookUrl !== undefined) updateData.whatsappWebhookUrl = whatsappWebhookUrl;
      if (defaultThreshold !== undefined) updateData.defaultThreshold = defaultThreshold;
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

      const config = await prisma.notificationConfig.upsert({
        where: { id: 'default-config' },
        create: {
          id: 'default-config',
          ...updateData,
        },
        update: updateData,
      });

      return res.json({
        success: true,
        message: 'Alert configuration saved successfully',
        data: {
          ...config,
          telegramBotTokenMasked: config.telegramBotToken ? maskApiKey(config.telegramBotToken) : null,
          hasTelegramBotToken: Boolean(config.telegramBotToken),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sends an instant test alert to Telegram or WhatsApp
   */
  public static async testAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const { channel, telegramBotToken, telegramChatId, whatsappWebhookUrl } = req.body;

      // Find saved config if test inputs are omitted
      const savedConfig = await prisma.notificationConfig.findUnique({
        where: { id: 'default-config' },
      });

      if (channel === 'TELEGRAM') {
        const token = telegramBotToken || savedConfig?.telegramBotToken;
        const chatId = telegramChatId || savedConfig?.telegramChatId;

        if (!token || !chatId) {
          return res.status(400).json({
            success: false,
            error: 'Telegram Bot Token and Chat ID are required for test',
          });
        }

        const testMsg =
          `✅ *APIQuota Test Notification*\n\n` +
          `Your Telegram alerting integration is working perfectly!\n` +
          `Alerts will trigger whenever remaining quota falls below *20%*.\n` +
          `*Time:* ${new Date().toUTCString()}`;

        const success = await AlertService.sendTelegramAlert(token, chatId, testMsg);
        if (!success) {
          return res.status(502).json({
            success: false,
            error: 'Failed to deliver Telegram test message. Verify your bot token and chat ID.',
          });
        }

        return res.json({ success: true, message: 'Telegram test alert delivered successfully!' });
      }

      if (channel === 'WHATSAPP') {
        const url = whatsappWebhookUrl || savedConfig?.whatsappWebhookUrl;
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'WhatsApp Webhook URL is required for test',
          });
        }

        const success = await AlertService.sendWhatsAppWebhook(url, {
          providerId: 'test-id',
          providerName: 'Test Provider',
          providerType: 'OPENAI',
          remainingPercentage: 15.0,
          usedQuota: 85.0,
          totalQuota: 100.0,
          threshold: 20.0,
        });

        if (!success) {
          return res.status(502).json({
            success: false,
            error: 'Failed to deliver webhook payload. Ensure target server is accessible.',
          });
        }

        return res.json({ success: true, message: 'WhatsApp webhook test payload delivered successfully!' });
      }

      return res.status(400).json({ success: false, error: 'Invalid alert channel' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves alert logs
   */
  public static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.alertLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          provider: {
            select: { name: true, provider: true },
          },
        },
      });

      return res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
