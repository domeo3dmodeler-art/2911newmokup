// app/api/metrics/route.ts
// API endpoint для получения метрик в формате Prometheus
// Используется для мониторинга на Yandex Cloud

import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '../../../lib/monitoring/metrics';
import { logger } from '../../../lib/monitoring/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'prometheus';

    if (format === 'prometheus') {
      const prometheusMetrics = metrics.getPrometheusMetrics();
      
      return new NextResponse(prometheusMetrics, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    } else if (format === 'json') {
      const jsonMetrics = metrics.getMetrics();
      
      return NextResponse.json({
        success: true,
        metrics: jsonMetrics,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use "prometheus" or "json"' },
        { status: 400 }
      );
    }

  } catch (error) {
    logger.error('Error getting metrics', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
