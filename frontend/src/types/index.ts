export interface ApiProvider {
  id: string;
  name: string;
  provider: 'OPENAI' | 'GEMINI' | 'ANTHROPIC' | 'CUSTOM';
  keyMask: string;
  totalQuota: number;
  usedQuota: number;
  remainingPercentage: number;
  alertThreshold: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'ERROR';
  lastSyncedAt: string | null;
  lastAlertSentAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalAllocatedQuota: number;
  totalUsedQuota: number;
  overallRemainingPercentage: number;
  activeProvidersCount: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface ChartDataPoint {
  time: string;
  totalUsed: number;
  [key: string]: string | number;
}

export interface AlertLogItem {
  id: string;
  providerId: string;
  channel: string;
  message: string;
  status: string;
  createdAt: string;
  provider?: {
    name: string;
    provider: string;
  };
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  recentAlerts: AlertLogItem[];
}

export interface NotificationConfig {
  id: string;
  telegramBotTokenMasked?: string | null;
  telegramChatId?: string | null;
  whatsappWebhookUrl?: string | null;
  defaultThreshold: number;
  isEnabled: boolean;
  hasTelegramBotToken?: boolean;
}
