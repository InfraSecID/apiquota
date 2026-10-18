import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { CryptoService } from './crypto.service';
import { ProviderClientService, ProviderUsageResult } from './providerClient.service';
import { AlertService } from './alert.service';

const prisma = new PrismaClient();

export class PollerService {
  private static isRunning = false;

  /**
   * Initializes the recurring background cron job for API usage polling
   */
  public static initCron(): void {
    logger.info(`Starting API Quota background poller cron with schedule: "${env.POLL_CRON_SCHEDULE}"`);
    cron.schedule(env.POLL_CRON_SCHEDULE, async () => {
      logger.info('Running scheduled API provider quota poller check...');
      await this.pollAllProviders();
    });
  }

  /**
   * Polls all active API providers in the database
   */
  public static async pollAllProviders(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Previous polling job still in progress. Skipping cycle.');
      return;
    }

    this.isRunning = true;
    try {
      // Prepared query via Prisma ORM - completely safe against SQL Injection
      const providers = await prisma.apiProvider.findMany({
        where: { isActive: true },
      });

      logger.info(`Polling usage for ${providers.length} active provider(s)...`);

      for (const provider of providers) {
        try {
          await this.syncProvider(provider.id);
        } catch (err: any) {
          logger.error(`Error polling provider "${provider.name}" (${provider.id}): ${err.message}`);
        }
      }
    } catch (err: any) {
      logger.error(`Fatal error in pollAllProviders: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Synchronizes usage for a single provider by ID
   */
  public static async syncProvider(providerId: string): Promise<any> {
    // 1. Fetch provider record safely using Prisma
    const provider = await prisma.apiProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // 2. Decrypt API Key strictly in-memory (never logged or sent anywhere else)
    let decryptedKey: string;
    try {
      decryptedKey = CryptoService.decrypt(provider.encryptedKey);
    } catch (err: any) {
      logger.error(`Failed to decrypt key for provider ${provider.id}: ${err.message}`);
      await prisma.apiProvider.update({
        where: { id: provider.id },
        data: { status: 'ERROR' },
      });
      throw new Error('Key decryption failed: Invalid key format or master encryption key mismatch');
    }

    // 3. Query provider API
    let usageResult: ProviderUsageResult;
    if (provider.provider.toUpperCase() === 'OPENAI') {
      usageResult = await ProviderClientService.fetchOpenAIUsage(decryptedKey, provider.totalQuota);
    } else if (provider.provider.toUpperCase() === 'GEMINI') {
      usageResult = await ProviderClientService.fetchGeminiUsage(decryptedKey, provider.totalQuota);
    } else {
      // Generic fallback simulation
      usageResult = await ProviderClientService.fetchOpenAIUsage(decryptedKey, provider.totalQuota);
    }

    // 4. Update provider record (safeguard if provider was deleted while async request was in flight)
    const stillExists = await prisma.apiProvider.findUnique({ where: { id: provider.id } });
    if (!stillExists) {
      logger.info(`Provider ${provider.id} was removed before sync completion. Skipping update.`);
      return provider;
    }

    const updatedProvider = await prisma.apiProvider.update({
      where: { id: provider.id },
      data: {
        usedQuota: usageResult.usedQuota,
        totalQuota: usageResult.totalQuota,
        remainingPercentage: usageResult.remainingPercentage,
        status: usageResult.status,
        lastSyncedAt: new Date(),
      },
    });

    // 5. Record usage history data point for charts
    await prisma.usageHistory.create({
      data: {
        providerId: provider.id,
        usedQuota: usageResult.usedQuota,
        totalQuota: usageResult.totalQuota,
        remainingPercentage: usageResult.remainingPercentage,
        recordedAt: new Date(),
      },
    });

    // 6. Check if quota is below alert threshold (< 20%)
    const threshold = provider.alertThreshold || env.DEFAULT_ALERT_THRESHOLD;
    if (usageResult.remainingPercentage <= threshold) {
      // Check cooldown (60 minutes cooldown between alerts to prevent spamming)
      const now = Date.now();
      const lastAlert = provider.lastAlertSentAt ? new Date(provider.lastAlertSentAt).getTime() : 0;
      const cooldownMinutes = 60;
      const cooldownExpired = now - lastAlert > cooldownMinutes * 60 * 1000;

      if (cooldownExpired) {
        await AlertService.checkAndTriggerAlert({
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.provider,
          remainingPercentage: usageResult.remainingPercentage,
          usedQuota: usageResult.usedQuota,
          totalQuota: usageResult.totalQuota,
          threshold,
        });
      } else {
        logger.info(`Alert threshold breached for [${provider.name}] (${usageResult.remainingPercentage}%), but skipped due to 60m cooldown.`);
      }
    }

    return updatedProvider;
  }
}
