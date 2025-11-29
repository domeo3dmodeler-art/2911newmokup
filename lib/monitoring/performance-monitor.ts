// lib/monitoring/performance-monitor.ts
// Система мониторинга производительности

import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  averageResponseTime: number;
  slowestOperations: PerformanceMetric[];
  totalRequests: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Максимальное количество метрик в памяти

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Начало измерения
  startMeasurement(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Очищаем старые метрики если превышен лимит
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return id;
  }

  // Завершение измерения
  endMeasurement(id: string): void {
    const metric = this.metrics.find(m => m.name === id.split('_')[0]);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
    }
  }

  // Измерение времени выполнения функции
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startMeasurement(name, metadata);
    
    try {
      const result = await fn();
      this.endMeasurement(id);
      return result;
    } catch (error) {
      this.endMeasurement(id);
      throw error;
    }
  }

  // Измерение времени выполнения синхронной функции
  measure<T>(
    name: string, 
    fn: () => T, 
    metadata?: Record<string, any>
  ): T {
    const id = this.startMeasurement(name, metadata);
    
    try {
      const result = fn();
      this.endMeasurement(id);
      return result;
    } catch (error) {
      this.endMeasurement(id);
      throw error;
    }
  }

  // Получение отчета о производительности
  getReport(): PerformanceReport {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        metrics: [],
        averageResponseTime: 0,
        slowestOperations: [],
        totalRequests: 0,
        errorRate: 0
      };
    }

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageResponseTime = totalDuration / completedMetrics.length;

    // Топ 10 самых медленных операций
    const slowestOperations = completedMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      metrics: completedMetrics,
      averageResponseTime,
      slowestOperations,
      totalRequests: completedMetrics.length,
      errorRate: 0 // Подсчет ошибок будет добавлен позже
    };
  }

  // Получение метрик по имени операции
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name && m.duration !== undefined);
  }

  // Получение средней производительности операции
  getAverageTime(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / metrics.length;
  }

  // Очистка метрик
  clear(): void {
    this.metrics = [];
  }

  // Экспорт метрик для анализа
  exportMetrics(): string {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

// Декоратор для автоматического измерения производительности методов
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const methodName = name || `${target.constructor.name}.${propertyKey}`;
      
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return monitor.measureAsync(methodName, () => originalMethod.apply(this, args));
      } else {
        return monitor.measure(methodName, () => originalMethod.apply(this, args));
      }
    };

    return descriptor;
  };
}

// Хук для измерения производительности React компонентов
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  React.useEffect(() => {
    const id = monitor.startMeasurement(`component_render_${componentName}`);
    
    return () => {
      monitor.endMeasurement(id);
    };
  }, [componentName]);
}
