import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  /**
   * Aggregates global SaaS metrics and formatted chart series for Recharts
   */
  public static async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Fetch active providers using parameterized query
      const providers = await prisma.apiProvider.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          provider: true,
          totalQuota: true,
          usedQuota: true,
          remainingPercentage: true,
          alertThreshold: true,
          status: true,
        },
      });

      // 2. Compute aggregate totals
      const totalAllocatedQuota = providers.reduce((acc, p) => acc + p.totalQuota, 0);
      const totalUsedQuota = providers.reduce((acc, p) => acc + p.usedQuota, 0);
      const overallRemainingPercentage =
        totalAllocatedQuota > 0
          ? Number((((totalAllocatedQuota - totalUsedQuota) / totalAllocatedQuota) * 100).toFixed(1))
          : 100;

      const criticalCount = providers.filter((p) => p.status === 'CRITICAL' || p.remainingPercentage <= 10).length;
      const warningCount = providers.filter(
        (p) => (p.status === 'WARNING' || p.remainingPercentage <= p.alertThreshold) && p.remainingPercentage > 10
      ).length;
      const healthyCount = providers.filter((p) => p.status === 'HEALTHY' && p.remainingPercentage > p.alertThreshold).length;

      // 3. Fetch recent historical usage records for Recharts
      const historyRecords = await prisma.usageHistory.findMany({
        orderBy: { recordedAt: 'asc' },
        take: 50,
        include: {
          provider: {
            select: { name: true, provider: true },
          },
        },
      });

      // Format for Recharts time-series
      const chartDataMap = new Map<string, any>();
      historyRecords.forEach((h) => {
        const timeKey = new Date(h.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const existing = chartDataMap.get(timeKey) || {
          time: timeKey,
          totalUsed: 0,
        };
        existing[h.provider.name] = h.usedQuota;
        existing.totalUsed = Number((existing.totalUsed + h.usedQuota).toFixed(2));
        chartDataMap.set(timeKey, existing);
      });

      // Fallback demo chart series if freshly installed without history
      let chartData = Array.from(chartDataMap.values());
      if (chartData.length === 0) {
        const now = new Date();
        chartData = [
          { time: '09:00', totalUsed: 12.5, OpenAI: 8.0, Gemini: 4.5 },
          { time: '11:00', totalUsed: 25.2, OpenAI: 16.2, Gemini: 9.0 },
          { time: '13:00', totalUsed: 38.6, OpenAI: 24.1, Gemini: 14.5 },
          { time: '15:00', totalUsed: 52.1, OpenAI: 32.8, Gemini: 19.3 },
          { time: '17:00', totalUsed: 69.4, OpenAI: 44.0, Gemini: 25.4 },
        ];
      }

      // 4. Fetch latest 5 alert logs
      const recentAlerts = await prisma.alertLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          provider: {
            select: { name: true, provider: true },
          },
        },
      });

      return res.json({
        success: true,
        data: {
          metrics: {
            totalAllocatedQuota: Number(totalAllocatedQuota.toFixed(2)),
            totalUsedQuota: Number(totalUsedQuota.toFixed(2)),
            overallRemainingPercentage,
            activeProvidersCount: providers.length,
            healthyCount,
            warningCount,
            criticalCount,
          },
          chartData,
          recentAlerts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
