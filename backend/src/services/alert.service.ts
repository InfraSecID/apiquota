import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { NotificationService } from './notifications';

const prisma = new PrismaClient();

export interface AlertPayload {
  providerId: string;
  providerName: string;
  providerType: string;
  remainingPercentage: number;
  usedQuota: number;
  totalQuota: number;
  threshold: number;
}

export class AlertService {
  /**
   * Evaluates provider quota and dispatches alerts across configured channels
   */
  public static async checkAndTriggerAlert(payload: AlertPayload, forceSend: boolean = false): Promise<boolean> {
    if (!forceSend && payload.remainingPercentage > payload.threshold) {
      return false; // Quota is healthy, no alert needed
    }

    // Check notification config from database or fallback to env
    const config = await prisma.notificationConfig.findUnique({
      where: { id: 'default-config' },
    });

    const isEnabled = config ? config.isEnabled : true;
    if (!isEnabled && !forceSend) {
      logger.info(`Alerts are globally disabled. Skipping alert for ${payload.providerName}`);
      return false;
    }

    const telegramToken = config?.telegramBotToken || env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = config?.telegramChatId || env.TELEGRAM_CHAT_ID;
    const whatsappWebhook = config?.whatsappWebhookUrl || env.WHATSAPP_WEBHOOK_URL;

    let alertDispatched = false;

    // 1. Telegram Dispatch using callmebot-notifier
    if (telegramToken && telegramChatId) {
      const message = this.formatTelegramMessage(payload);
      const success = await NotificationService.sendTelegram(message, {
        botToken: telegramToken,
        chatId: telegramChatId,
      });
      
      await prisma.alertLog.create({
        data: {
          providerId: payload.providerId,
          channel: 'TELEGRAM',
          message,
          status: success ? 'SENT' : 'FAILED',
        },
      });

      if (success) alertDispatched = true;
    }

    // 2. WhatsApp Webhook Dispatch
    if (whatsappWebhook) {
      const success = await this.sendWhatsAppWebhook(whatsappWebhook, payload);
      
      await prisma.alertLog.create({
        data: {
          providerId: payload.providerId,
          channel: 'WHATSAPP',
          message: `WhatsApp Webhook to ${whatsappWebhook}: Quota at ${payload.remainingPercentage}%`,
          status: success ? 'SENT' : 'FAILED',
        },
      });

      if (success) alertDispatched = true;
    }

    // Update lastAlertSentAt on provider if an alert was triggered
    if (alertDispatched) {
      await prisma.apiProvider.update({
        where: { id: payload.providerId },
        data: { lastAlertSentAt: new Date() },
      });
      logger.warn(`🚨 Alert dispatched for provider [${payload.providerName}] - Remaining: ${payload.remainingPercentage}%`);
    }

    return alertDispatched;
  }

  /**
   * Dispatches message to Telegram via callmebot-notifier
   */
  public static async sendTelegramAlert(botToken: string, chatId: string, text: string): Promise<boolean> {
    return NotificationService.sendTelegram(text, { botToken, chatId });
  }

  /**
   * Dispatches payload to external WhatsApp Webhook/Gateway
   */
  public static async sendWhatsAppWebhook(webhookUrl: string, payload: AlertPayload): Promise<boolean> {
    try {
      await axios.post(
        webhookUrl,
        {
          event: 'quota.alert',
          timestamp: new Date().toISOString(),
          data: payload,
          text: `⚠️ *APIQuota Alert*: ${payload.providerName} (${payload.providerType}) quota is at ${payload.remainingPercentage}%, which is below your threshold of ${payload.threshold}%.`,
        },
        { timeout: 8000 }
      );
      logger.info(`WhatsApp webhook alert successfully delivered to ${webhookUrl}`);
      return true;
    } catch (err: any) {
      logger.error(`Failed to dispatch WhatsApp webhook: ${err.message}`);
      return false;
    }
  }

  /**
   * Formats a professional Markdown alert for Telegram
   */
  private static formatTelegramMessage(p: AlertPayload): string {
    const isCritical = p.remainingPercentage <= 10;
    const severityIcon = isCritical ? '🔴 *CRITICAL*' : '🟡 *WARNING*';

    return (
      `⚠️ *APIQuota Alert Notification*\n\n` +
      `*Status:* ${severityIcon}\n` +
      `*Provider:* \`${p.providerName}\` (${p.providerType})\n` +
      `*Remaining Quota:* *${p.remainingPercentage}%*\n` +
      `*Quota Consumed:* $${p.usedQuota.toFixed(2)} / $${p.totalQuota.toFixed(2)}\n` +
      `*Threshold Alert:* <= ${p.threshold}%\n` +
      `*Timestamp:* ${new Date().toUTCString()}\n\n` +
      `_Action required: Check your API provider dashboard to avoid API service disruption._`
    );
  }
}
