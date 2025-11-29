// lib/price/price-service.ts
// Унифицированный сервис для расчета цен

import { logger } from '../logging/logger';

export interface PriceCalculationRequest {
  style: string;
  model: string;
  finish: string;
  color: string;
  width: number;
  height: number;
  hardware_kit?: { id: string };
  handle?: { id: string };
}

export interface PriceCalculationResponse {
  total: number;
  basePrice: number;
  sku_1c?: string;
  breakdown?: {
    doorPrice: number;
    hardwarePrice: number;
    handlePrice: number;
  };
}

export class PriceService {
  private static instance: PriceService;
  private cache: Map<string, PriceCalculationResponse> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  // Расчет цены через API
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Проверяем кэш
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('Используем кэшированную цену', 'price-service', { cacheKey, total: cached.total });
      return cached;
    }

    try {
      logger.debug('Расчет цены через API', 'price-service', { request });
      
      const response = await fetch('/api/price/doors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: PriceCalculationResponse = {
        total: data.total,
        basePrice: data.total,
        sku_1c: data.sku_1c,
        breakdown: data.breakdown
      };

      // Сохраняем в кэш
      this.cache.set(cacheKey, result);
      
      // Очищаем кэш через timeout
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);

      logger.debug('Цена рассчитана', 'price-service', { total: result.total, sku_1c: result.sku_1c });
      return result;

    } catch (error) {
      logger.error('Ошибка расчета цены', 'price-service', error instanceof Error ? { error: error.message, stack: error.stack, request } : { error: String(error), request });
      throw error;
    }
  }

  // Локальный расчет цены (fallback)
  calculatePriceLocal(request: PriceCalculationRequest): PriceCalculationResponse {
    logger.debug('Локальный расчет цены', 'price-service', { request });
    
    // Базовые цены по стилям
    const stylePrices: Record<string, number> = {
      'Современный': 15000,
      'Классический': 18000,
      'Неоклассика': 17000,
      'Скрытый': 25000,
      'Алюминий': 22000
    };

    const basePrice = stylePrices[request.style] || 15000;
    
    // Множители
    const area = (request.width * request.height) / 1000000; // м²
    const areaMultiplier = Math.max(0.8, Math.min(1.5, area));
    
    const finishMultipliers: Record<string, number> = {
      'Эмаль': 1.0,
      'Шпон': 1.3,
      'Нанотекс': 1.1,
      'Стекло': 1.4,
      'Под отделку': 0.9
    };
    
    const finishMultiplier = finishMultipliers[request.finish] || 1.0;
    
    const hardwareMultiplier = request.hardware_kit ? 1.3 : 1.0;
    
    const total = Math.round(basePrice * areaMultiplier * finishMultiplier * hardwareMultiplier);
    
    const result: PriceCalculationResponse = {
      total,
      basePrice,
      breakdown: {
        doorPrice: total * 0.8,
        hardwarePrice: total * 0.15,
        handlePrice: total * 0.05
      }
    };

    logger.debug('Локальная цена рассчитана', 'price-service', { total: result.total, request });
    return result;
  }

  // Универсальный расчет цены (API + fallback)
  async calculatePriceUniversal(request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    try {
      return await this.calculatePrice(request);
    } catch (error) {
      logger.warn('API недоступен, используем локальный расчет', 'price-service', error instanceof Error ? { error: error.message, stack: error.stack, request } : { error: String(error), request });
      return this.calculatePriceLocal(request);
    }
  }

  // Очистка кэша
  clearCache(): void {
    this.cache.clear();
    logger.info('Кэш цен очищен', 'price-service');
  }

  // Генерация ключа кэша
  private generateCacheKey(request: PriceCalculationRequest): string {
    return JSON.stringify({
      style: request.style,
      model: request.model,
      finish: request.finish,
      color: request.color,
      width: request.width,
      height: request.height,
      hardware_kit: request.hardware_kit?.id,
      handle: request.handle?.id
    });
  }

  // Получение статистики кэша
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Экспорт экземпляра
export const priceService = PriceService.getInstance();
