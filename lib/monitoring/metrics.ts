// lib/monitoring/metrics.ts
// Система мониторинга производительности и метрик
// Интегрируется с Prometheus для мониторинга на Yandex Cloud

import { logger } from './logger';

// Интерфейс для метрик
export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

// Интерфейс для счетчиков
export interface Counter {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

// Интерфейс для гистограмм
export interface Histogram {
  name: string;
  buckets: number[];
  count: number;
  sum: number;
  labels?: Record<string, string>;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Metric> = new Map();

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Увеличивает счетчик
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const existing = this.counters.get(key);
    
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, {
        name,
        value,
        labels,
      });
    }
  }

  /**
   * Устанавливает значение gauge
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, {
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Записывает значение в гистограмму
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels);
    const existing = this.histograms.get(key);
    
    if (existing) {
      existing.count++;
      existing.sum += value;
      
      // Обновляем buckets
      for (let i = 0; i < existing.buckets.length; i++) {
        if (value <= existing.buckets[i]) {
          // Здесь можно добавить логику для подсчета bucket'ов
          break;
        }
      }
    } else {
      this.histograms.set(key, {
        name,
        buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 600, 1800, 3600], // секунды
        count: 1,
        sum: value,
        labels,
      });
    }
  }

  /**
   * Измеряет время выполнения функции
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordHistogram(`${name}_duration_ms`, duration, labels);
      this.incrementCounter(`${name}_total`, 1, labels);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordHistogram(`${name}_duration_ms`, duration, labels);
      this.incrementCounter(`${name}_errors`, 1, labels);
      
      throw error;
    }
  }

  /**
   * Получает все метрики в формате Prometheus
   */
  getPrometheusMetrics(): string {
    let output = '';

    // Counters
    for (const counter of this.counters.values()) {
      const labels = this.formatLabels(counter.labels);
      output += `# TYPE ${counter.name} counter\n`;
      output += `${counter.name}${labels} ${counter.value}\n`;
    }

    // Gauges
    for (const gauge of this.gauges.values()) {
      const labels = this.formatLabels(gauge.labels);
      output += `# TYPE ${gauge.name} gauge\n`;
      output += `${gauge.name}${labels} ${gauge.value}\n`;
    }

    // Histograms
    for (const histogram of this.histograms.values()) {
      const labels = this.formatLabels(histogram.labels);
      output += `# TYPE ${histogram.name} histogram\n`;
      output += `${histogram.name}_count${labels} ${histogram.count}\n`;
      output += `${histogram.name}_sum${labels} ${histogram.sum}\n`;
      
      // Buckets
      for (const bucket of histogram.buckets) {
        output += `${histogram.name}_bucket{le="${bucket}"}${labels} 0\n`;
      }
      output += `${histogram.name}_bucket{le="+Inf"}${labels} ${histogram.count}\n`;
    }

    return output;
  }

  /**
   * Получает метрики в JSON формате
   */
  getMetrics(): {
    counters: Counter[];
    gauges: Metric[];
    histograms: Histogram[];
  } {
    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: Array.from(this.histograms.values()),
    };
  }

  /**
   * Очищает все метрики
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${labelStr}}`;
  }
}

// Экспортируем экземпляр коллектора метрик
export const metrics = MetricsCollector.getInstance();

// Предопределенные метрики
export class BusinessMetrics {
  /**
   * Метрики для товаров
   */
  static productViewed(productId: string, categoryId: string): void {
    metrics.incrementCounter('product_views_total', 1, {
      product_id: productId,
      category_id: categoryId,
    });
  }

  static productSearched(query: string, resultCount: number): void {
    metrics.incrementCounter('product_searches_total', 1, {
      query: query.substring(0, 50), // Ограничиваем длину
    });
    metrics.setGauge('search_results_count', resultCount, {
      query: query.substring(0, 50),
    });
  }

  /**
   * Метрики для заказов
   */
  static orderCreated(orderId: string, clientId: string, totalAmount: number): void {
    metrics.incrementCounter('orders_created_total', 1, {
      order_id: orderId,
      client_id: clientId,
    });
    metrics.setGauge('order_amount', totalAmount, {
      order_id: orderId,
    });
  }

  static orderStatusChanged(orderId: string, fromStatus: string, toStatus: string): void {
    metrics.incrementCounter('order_status_changes_total', 1, {
      order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
    });
  }

  /**
   * Метрики для пользователей
   */
  static userLoggedIn(userId: string, role: string): void {
    metrics.incrementCounter('user_logins_total', 1, {
      user_id: userId,
      role: role,
    });
  }

  static userAction(userId: string, action: string): void {
    metrics.incrementCounter('user_actions_total', 1, {
      user_id: userId,
      action: action,
    });
  }

  /**
   * Метрики для файлов
   */
  static fileUploaded(fileType: string, fileSize: number): void {
    metrics.incrementCounter('file_uploads_total', 1, {
      file_type: fileType,
    });
    metrics.setGauge('file_size_bytes', fileSize, {
      file_type: fileType,
    });
  }

  static fileDeleted(fileType: string): void {
    metrics.incrementCounter('file_deletions_total', 1, {
      file_type: fileType,
    });
  }

  /**
   * Метрики для кэша
   */
  static cacheHit(cacheKey: string): void {
    metrics.incrementCounter('cache_hits_total', 1, {
      cache_key: cacheKey,
    });
  }

  static cacheMiss(cacheKey: string): void {
    metrics.incrementCounter('cache_misses_total', 1, {
      cache_key: cacheKey,
    });
  }

  /**
   * Метрики для базы данных
   */
  static databaseQuery(queryType: string, duration: number, success: boolean): void {
    metrics.recordHistogram('database_query_duration_ms', duration, {
      query_type: queryType,
    });
    
    metrics.incrementCounter('database_queries_total', 1, {
      query_type: queryType,
      success: success.toString(),
    });
  }

  /**
   * Метрики для API
   */
  static apiRequest(method: string, endpoint: string, statusCode: number, duration: number): void {
    metrics.recordHistogram('api_request_duration_ms', duration, {
      method: method,
      endpoint: endpoint,
      status_code: statusCode.toString(),
    });
    
    metrics.incrementCounter('api_requests_total', 1, {
      method: method,
      endpoint: endpoint,
      status_code: statusCode.toString(),
    });
  }
}

// Middleware для автоматического сбора метрик API
export function createMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endpoint = req.route?.path || req.path;
      
      BusinessMetrics.apiRequest(
        req.method,
        endpoint,
        res.statusCode,
        duration
      );
    });
    
    next();
  };
}
