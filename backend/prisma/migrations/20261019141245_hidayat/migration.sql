-- CreateTable
CREATE TABLE "ApiProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyMask" TEXT NOT NULL,
    "totalQuota" REAL NOT NULL DEFAULT 100.0,
    "usedQuota" REAL NOT NULL DEFAULT 0.0,
    "remainingPercentage" REAL NOT NULL DEFAULT 100.0,
    "alertThreshold" REAL NOT NULL DEFAULT 20.0,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "lastSyncedAt" DATETIME,
    "lastAlertSentAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UsageHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedQuota" REAL NOT NULL,
    "totalQuota" REAL NOT NULL,
    "remainingPercentage" REAL NOT NULL,
    CONSTRAINT "UsageHistory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ApiProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default-config',
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "whatsappWebhookUrl" TEXT,
    "whatsappPhone" TEXT,
    "defaultThreshold" REAL NOT NULL DEFAULT 20.0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ApiProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ApiProvider_provider_idx" ON "ApiProvider"("provider");

-- CreateIndex
CREATE INDEX "ApiProvider_status_idx" ON "ApiProvider"("status");

-- CreateIndex
CREATE INDEX "UsageHistory_providerId_recordedAt_idx" ON "UsageHistory"("providerId", "recordedAt");

-- CreateIndex
CREATE INDEX "AlertLog_providerId_idx" ON "AlertLog"("providerId");

-- CreateIndex
CREATE INDEX "AlertLog_createdAt_idx" ON "AlertLog"("createdAt");
