import { telegram } from 'callmebot-notifier';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface TelegramNotificationOptions {
  botToken?: string;
  chatId?: string;
}

/**
 * Service to dispatch notifications to Telegram using callmebot-notifier.
 * Pulls TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from .env or explicit overrides.
 */
export class NotificationService {
  /**
   * Sends a message to Telegram using callmebot-notifier
   */
  public static async sendTelegram(
    message: string,
    options?: TelegramNotificationOptions
  ): Promise<boolean> {
    const botToken = options?.botToken || env.TELEGRAM_BOT_TOKEN;
    const chatId = options?.chatId || env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      logger.warn('Telegram dispatch skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in .env');
      return false;
    }

    try {
      const channel = telegram({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
      });

      await channel.send(message);
      logger.info(`✅ [callmebot-notifier] Telegram alert dispatched successfully to chat ${chatId}`);
      return true;
    } catch (err: any) {
      logger.error(`❌ [callmebot-notifier] Failed to dispatch Telegram message: ${err?.message || err}`);
      return false;
    }
  }
}

export const sendTelegramAlert = NotificationService.sendTelegram;
