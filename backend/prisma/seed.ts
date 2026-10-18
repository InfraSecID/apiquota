import { PrismaClient } from '@prisma/client';
import { CryptoService } from '../src/services/crypto.service';
import { maskApiKey } from '../src/utils/mask';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding APIQuota database with initial sample providers...');

  // Ensure default notification config exists
  await prisma.notificationConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      defaultThreshold: 20.0,
      isEnabled: true,
    },
  });

  // Sample Provider 1: OpenAI
  const openAiSampleKey = 'sk-proj-demo998877665544332211aabbccddeeffgg';
  const openAiEncrypted = CryptoService.encrypt(openAiSampleKey);
  const openAiMask = maskApiKey(openAiSampleKey);

  const openAiProvider = await prisma.apiProvider.create({
    data: {
      name: 'OpenAI Production GPT-4o',
      provider: 'OPENAI',
      encryptedKey: openAiEncrypted,
      keyMask: openAiMask,
      totalQuota: 250.0,
      usedQuota: 198.5,
      remainingPercentage: 20.6,
      alertThreshold: 20.0,
      status: 'WARNING',
      lastSyncedAt: new Date(),
    },
  });

  // Sample Provider 2: Gemini Pro
  const geminiSampleKey = 'AIzaSyDemoSampleKeyForGeminiProQuotaChecking9999';
  const geminiEncrypted = CryptoService.encrypt(geminiSampleKey);
  const geminiMask = maskApiKey(geminiSampleKey);

  const geminiProvider = await prisma.apiProvider.create({
    data: {
      name: 'Google Gemini 1.5 Pro (Workspace)',
      provider: 'GEMINI',
      encryptedKey: geminiEncrypted,
      keyMask: geminiMask,
      totalQuota: 150.0,
      usedQuota: 42.1,
      remainingPercentage: 71.9,
      alertThreshold: 20.0,
      status: 'HEALTHY',
      lastSyncedAt: new Date(),
    },
  });

  // Sample Provider 3: OpenAI Critical Low Quota (< 20%)
  const openAiLowKey = 'sk-proj-lowquota99998888777766665555444433332222';
  const openAiLowEncrypted = CryptoService.encrypt(openAiLowKey);
  const openAiLowMask = maskApiKey(openAiLowKey);

  const openAiLowProvider = await prisma.apiProvider.create({
    data: {
      name: 'OpenAI Fine-Tuning Cluster',
      provider: 'OPENAI',
      encryptedKey: openAiLowEncrypted,
      keyMask: openAiLowMask,
      totalQuota: 100.0,
      usedQuota: 88.5,
      remainingPercentage: 11.5,
      alertThreshold: 20.0,
      status: 'CRITICAL',
      lastSyncedAt: new Date(),
      lastAlertSentAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    },
  });

  // Add sample historical usage snapshots
  const timestamps = [
    new Date(Date.now() - 4 * 60 * 60 * 1000),
    new Date(Date.now() - 3 * 60 * 60 * 1000),
    new Date(Date.now() - 2 * 60 * 60 * 1000),
    new Date(Date.now() - 1 * 60 * 60 * 1000),
    new Date(),
  ];

  for (let i = 0; i < timestamps.length; i++) {
    const time = timestamps[i];
    await prisma.usageHistory.create({
      data: {
        providerId: openAiProvider.id,
        recordedAt: time,
        usedQuota: 150 + i * 12,
        totalQuota: 250,
        remainingPercentage: ((250 - (150 + i * 12)) / 250) * 100,
      },
    });

    await prisma.usageHistory.create({
      data: {
        providerId: geminiProvider.id,
        recordedAt: time,
        usedQuota: 20 + i * 5,
        totalQuota: 150,
        remainingPercentage: ((150 - (20 + i * 5)) / 150) * 100,
      },
    });
  }

  // Create an alert log record
  await prisma.alertLog.create({
    data: {
      providerId: openAiLowProvider.id,
      channel: 'TELEGRAM',
      message: '🚨 Low Quota Alert: OpenAI Fine-Tuning Cluster remaining quota is 11.5% (below 20% threshold)',
      status: 'SENT',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  console.log('✅ Database seeded successfully with 3 providers, history records, and alert log.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
