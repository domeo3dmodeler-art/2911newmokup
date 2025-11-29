// lib/analytics/quote-analytics.ts
// Сервис аналитики и статистики КП

import { prisma } from '@/lib/prisma';

export type QuoteAnalytics = {
  overview: {
    totalQuotes: number;
    draftQuotes: number;
    sentQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    totalValue: number;
    averageValue: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      quotes: number;
      value: number;
    }>;
    weekly: Array<{
      week: string;
      quotes: number;
      value: number;
    }>;
    monthly: Array<{
      month: string;
      quotes: number;
      value: number;
    }>;
  };
  topClients: Array<{
    client: string;
    quotesCount: number;
    totalValue: number;
    lastQuoteDate: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  valueDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
};

export type AnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  client?: string;
};

class QuoteAnalyticsService {
  // Получить общую аналитику
  async getOverview(filters?: AnalyticsFilters): Promise<QuoteAnalytics['overview']> {
    const where = this.buildWhereClause(filters);
    
    const [
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      totalValueResult
    ] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.count({ where: { ...where, status: 'draft' } }),
      prisma.quote.count({ where: { ...where, status: 'sent' } }),
      prisma.quote.count({ where: { ...where, status: 'accepted' } }),
      prisma.quote.count({ where: { ...where, status: 'rejected' } }),
      prisma.quote.aggregate({
        where,
        _sum: { total: true },
        _avg: { total: true }
      })
    ]);

    const totalValue = Number(totalValueResult._sum.total || 0);
    const averageValue = Number(totalValueResult._avg.total || 0);
    const conversionRate = sentQuotes > 0 ? (acceptedQuotes / sentQuotes) * 100 : 0;

    return {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      totalValue,
      averageValue,
      conversionRate
    };
  }

  // Получить тренды по периодам
  async getTrends(filters?: AnalyticsFilters): Promise<QuoteAnalytics['trends']> {
    const where = this.buildWhereClause(filters);
    
    // Дневные тренды (последние 30 дней)
    const dailyTrends = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as quotes,
        SUM("total") as value
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Недельные тренды (последние 12 недель)
    const weeklyTrends = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-"W"WW') as week,
        COUNT(*) as quotes,
        SUM("total") as value
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
        AND "createdAt" >= NOW() - INTERVAL '12 weeks'
      GROUP BY TO_CHAR("createdAt", 'YYYY-"W"WW')
      ORDER BY week ASC
    `;

    // Месячные тренды (последние 12 месяцев)
    const monthlyTrends = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*) as quotes,
        SUM("total") as value
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    return {
      daily: dailyTrends.map(t => ({
        date: t.date,
        quotes: Number(t.quotes),
        value: Number(t.value || 0)
      })),
      weekly: weeklyTrends.map(t => ({
        week: t.week,
        quotes: Number(t.quotes),
        value: Number(t.value || 0)
      })),
      monthly: monthlyTrends.map(t => ({
        month: t.month,
        quotes: Number(t.quotes),
        value: Number(t.value || 0)
      }))
    };
  }

  // Получить топ клиентов
  async getTopClients(filters?: AnalyticsFilters, limit: number = 10): Promise<QuoteAnalytics['topClients']> {
    const where = this.buildWhereClause(filters);
    
    const topClients = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE("clientInfo"->>'company', "clientInfo"->>'contact', 'Без названия') as client,
        COUNT(*) as quotes_count,
        SUM("total") as total_value,
        MAX("createdAt") as last_quote_date
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
        AND "clientInfo" IS NOT NULL
      GROUP BY COALESCE("clientInfo"->>'company', "clientInfo"->>'contact', 'Без названия')
      ORDER BY total_value DESC
      LIMIT ${limit}
    `;

    return topClients.map(client => ({
      client: client.client,
      quotesCount: Number(client.quotes_count),
      totalValue: Number(client.total_value || 0),
      lastQuoteDate: client.last_quote_date
    }));
  }

  // Получить распределение по статусам
  async getStatusDistribution(filters?: AnalyticsFilters): Promise<QuoteAnalytics['statusDistribution']> {
    const where = this.buildWhereClause(filters);
    
    const statusStats = await prisma.$queryRaw<any[]>`
      SELECT 
        status,
        COUNT(*) as count
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
      GROUP BY status
      ORDER BY count DESC
    `;

    const total = statusStats.reduce((sum, stat) => sum + Number(stat.count), 0);

    return statusStats.map(stat => ({
      status: stat.status,
      count: Number(stat.count),
      percentage: total > 0 ? (Number(stat.count) / total) * 100 : 0
    }));
  }

  // Получить распределение по суммам
  async getValueDistribution(filters?: AnalyticsFilters): Promise<QuoteAnalytics['valueDistribution']> {
    const where = this.buildWhereClause(filters);
    
    const valueStats = await prisma.$queryRaw<any[]>`
      SELECT 
        CASE 
          WHEN "total" < 50000 THEN 'До 50,000'
          WHEN "total" < 100000 THEN '50,000 - 100,000'
          WHEN "total" < 200000 THEN '100,000 - 200,000'
          WHEN "total" < 500000 THEN '200,000 - 500,000'
          ELSE 'Свыше 500,000'
        END as range,
        COUNT(*) as count
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
      GROUP BY 
        CASE 
          WHEN "total" < 50000 THEN 'До 50,000'
          WHEN "total" < 100000 THEN '50,000 - 100,000'
          WHEN "total" < 200000 THEN '100,000 - 200,000'
          WHEN "total" < 500000 THEN '200,000 - 500,000'
          ELSE 'Свыше 500,000'
        END
      ORDER BY MIN("total")
    `;

    const total = valueStats.reduce((sum, stat) => sum + Number(stat.count), 0);

    return valueStats.map(stat => ({
      range: stat.range,
      count: Number(stat.count),
      percentage: total > 0 ? (Number(stat.count) / total) * 100 : 0
    }));
  }

  // Получить полную аналитику
  async getFullAnalytics(filters?: AnalyticsFilters): Promise<QuoteAnalytics> {
    const [
      overview,
      trends,
      topClients,
      statusDistribution,
      valueDistribution
    ] = await Promise.all([
      this.getOverview(filters),
      this.getTrends(filters),
      this.getTopClients(filters),
      this.getStatusDistribution(filters),
      this.getValueDistribution(filters)
    ]);

    return {
      overview,
      trends,
      topClients,
      statusDistribution,
      valueDistribution
    };
  }

  // Построить условие WHERE для фильтров
  private buildWhereClause(filters?: AnalyticsFilters): any {
    const where: any = {};

    if (filters?.dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
    }

    if (filters?.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.client) {
      where.OR = [
        { clientInfo: { path: ['company'], string_contains: filters.client } },
        { clientInfo: { path: ['contact'], string_contains: filters.client } }
      ];
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }

  // Построить RAW WHERE для SQL запросов
  private buildRawWhere(where: any): string {
    const conditions: string[] = [];

    if (where.createdAt?.gte) {
      conditions.push(`"createdAt" >= '${where.createdAt.gte.toISOString()}'`);
    }

    if (where.createdAt?.lte) {
      conditions.push(`"createdAt" <= '${where.createdAt.lte.toISOString()}'`);
    }

    if (where.status) {
      conditions.push(`status = '${where.status}'`);
    }

    if (where.OR) {
      const orConditions = where.OR.map((condition: any) => {
        if (condition.clientInfo?.path?.[0] === 'company') {
          return `"clientInfo"->>'company' ILIKE '%${condition.clientInfo.string_contains}%'`;
        }
        if (condition.clientInfo?.path?.[0] === 'contact') {
          return `"clientInfo"->>'contact' ILIKE '%${condition.clientInfo.string_contains}%'`;
        }
        return '1=1';
      });
      conditions.push(`(${orConditions.join(' OR ')})`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  // Получить метрики производительности
  async getPerformanceMetrics(filters?: AnalyticsFilters): Promise<{
    averageResponseTime: number;
    quotesPerDay: number;
    quotesPerWeek: number;
    quotesPerMonth: number;
  }> {
    const where = this.buildWhereClause(filters);
    
    const metrics = await prisma.$queryRaw<any[]>`
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as avg_response_time,
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 day') as quotes_per_day,
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 week') as quotes_per_week,
        COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 month') as quotes_per_month
      FROM "Quote"
      WHERE ${where ? this.buildRawWhere(where) : '1=1'}
    `;

    const result = metrics[0];
    return {
      averageResponseTime: Number(result.avg_response_time || 0),
      quotesPerDay: Number(result.quotes_per_day || 0),
      quotesPerWeek: Number(result.quotes_per_week || 0),
      quotesPerMonth: Number(result.quotes_per_month || 0)
    };
  }
}

// Экспортируем singleton instance
export const quoteAnalyticsService = new QuoteAnalyticsService();
