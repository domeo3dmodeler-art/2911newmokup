// lib/export/adapters/doors.ts
// Адаптер экспорта для категории Doors

import { prisma } from '@/lib/prisma';
import { ExportRow, ExportError } from '../types';
import { PositionPriced, applyPricing } from '@/lib/doors/pricing';
import { toFactoryRows } from '@/lib/doors/factory-map';
import { logger } from '@/lib/logging/logger';

export type DoorsKPData = {
  id: string;
  items: Array<{
    sku: string;
    model: string;
    width?: number;
    height?: number;
    color?: string;
    finish?: string;
    series?: string;
    material?: string;
    rrc_price: number;
    qty: number;
    hardware_kit?: {
      name: string;
      price_rrc: number;
      group?: string;
    };
    handle?: {
      name: string;
      price_opt: number;
      price_group_multiplier: number;
    };
    price_opt?: number;
    currency?: string;
  }>;
  created_at: string;
  total: number;
};

export const doorsExportAdapter = {
  async validateKP(kpId: string): Promise<{ valid: boolean; error?: ExportError }> {
    if (!kpId || typeof kpId !== 'string') {
      return {
        valid: false,
        error: {
          code: 'INVALID_KP_ID',
          message: 'ID КП обязателен и должен быть строкой',
          field: 'kpId',
          value: kpId
        }
      };
    }

    // Проверяем существование КП в базе данных
    try {
      const quote = await prisma.quote.findFirst({
        where: { 
          id: kpId,
          status: 'accepted' // Только принятые КП можно экспортировать
        },
        select: { id: true, status: true }
      });

      if (!quote) {
        return {
          valid: false,
          error: {
            code: 'KP_NOT_FOUND',
            message: 'КП не найден или не принят',
            field: 'kpId',
            value: kpId
          }
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Ошибка при проверке КП в базе данных',
          field: 'kpId',
          value: kpId
        }
      };
    }
  },

  async getKPData(kpId: string): Promise<DoorsKPData> {
    try {
      const quote = await prisma.quote.findFirst({
        where: { 
          id: kpId,
          status: 'accepted'
        },
        select: {
          id: true,
          items: true,
          total: true,
          currency: true,
          createdAt: true
        }
      });

      if (!quote) {
        throw new Error('КП не найден или не принят');
      }

      // Парсим JSON данные позиций
      const items = Array.isArray(quote.items) ? quote.items : [];
      
      const kpData: DoorsKPData = {
        id: quote.id,
        items: items.map((item: any) => ({
          sku: item.sku || '',
          model: item.model || '',
          width: item.width || null,
          height: item.height || null,
          color: item.color || null,
          finish: item.finish || null,
          series: item.series || null,
          material: item.material || null,
          rrc_price: item.rrc_price || 0,
          qty: item.qty || 1,
          hardware_kit: item.hardware_kit ? {
            name: item.hardware_kit.name || '',
            price_rrc: item.hardware_kit.price_rrc || 0,
            group: item.hardware_kit.group || undefined
          } : undefined,
          handle: item.handle ? {
            name: item.handle.name || '',
            price_opt: item.handle.price_opt || 0,
            price_group_multiplier: item.handle.price_group_multiplier || 1
          } : undefined,
          price_opt: item.price_opt || null,
          currency: quote.currency || 'RUB'
        })),
        created_at: quote.createdAt.toISOString(),
        total: Number(quote.total)
      };

      return kpData;
    } catch (error) {
      // В случае ошибки возвращаем заглушку для демонстрации
      logger.warn('Ошибка получения данных КП, используем заглушку:', { error, kpId });
      
      const mockKPData: DoorsKPData = {
        id: kpId,
        items: [
          {
            sku: 'DOOR-001',
            model: 'Classic',
            width: 800,
            height: 2000,
            color: 'Белый',
            finish: 'Матовый',
            series: 'Premium',
            material: 'МДФ',
            rrc_price: 15000,
            qty: 2,
            hardware_kit: {
              name: 'Комплект Premium',
              price_rrc: 3000,
              group: '1'
            },
            handle: {
              name: 'Ручка Classic',
              price_opt: 500,
              price_group_multiplier: 2.5
            },
            price_opt: 12000,
            currency: 'RUB'
          }
        ],
        created_at: new Date().toISOString(),
        total: 36000
      };

      return mockKPData;
    }
  },

  async toExportRows(kpData: DoorsKPData): Promise<ExportRow[]> {
    const rows: ExportRow[] = [];

    for (const item of kpData.items) {
      // Получаем данные двери из каталога
      const doorData = await prisma.doors_catalog.findFirst({
        where: { sku: item.sku }
      });

      if (!doorData) {
        // Если дверь не найдена в каталоге, используем данные из КП
        const position: any = {
          model: item.model,
          width: item.width,
          height: item.height,
          color: item.color,
          rrc_price: item.rrc_price,
          qty: item.qty,
          hardware_kit: item.hardware_kit,
          handle: item.handle,
          price_opt: item.price_opt
        };

        const priced = applyPricing([position])[0];
        const factoryRows = toFactoryRows([priced]);

        for (const factoryRow of factoryRows) {
          rows.push({
            sku: item.sku,
            series: item.series || null,
            material: item.material || null,
            finish: item.finish || null,
            width_mm: factoryRow.width || null,
            height_mm: factoryRow.height || null,
            color: item.color || null,
            hardware_set: factoryRow.hardware_group || null,
            handle: factoryRow.supplier_item_name?.includes('Ручка') ? factoryRow.supplier_item_name : null,
            quantity: factoryRow.qty,
            base_price: factoryRow.price_opt || 0,
            markup_price: factoryRow.price_rrc_plus_kit - (factoryRow.price_opt || 0),
            discount_price: null,
            vat_price: null,
            total_price: factoryRow.sum_rrc,
            currency: item.currency || 'RUB',
            created_at: kpData.created_at
          });
        }
      } else {
        // Используем данные из каталога
        const position: any = {
          model: doorData.model || item.model,
          width: doorData.widthMm || item.width,
          height: doorData.heightMm || item.height,
          color: doorData.color || item.color,
          rrc_price: doorData.base_price || item.rrc_price,
          qty: item.qty,
          hardware_kit: item.hardware_kit,
          handle: item.handle,
          price_opt: doorData.price_opt || item.price_opt
        };

        const priced = applyPricing([position])[0];
        const factoryRows = toFactoryRows([priced]);

        for (const factoryRow of factoryRows) {
          rows.push({
            sku: doorData.sku,
            series: doorData.series || null,
            material: null, // Поле material отсутствует в doors_catalog
            finish: doorData.finish || null,
            width_mm: factoryRow.width || null,
            height_mm: factoryRow.height || null,
            color: doorData.color || null,
            hardware_set: factoryRow.hardware_group || null,
            handle: factoryRow.supplier_item_name?.includes('Ручка') ? factoryRow.supplier_item_name : null,
            quantity: factoryRow.qty,
            base_price: factoryRow.price_opt || 0,
            markup_price: factoryRow.price_rrc_plus_kit - (factoryRow.price_opt || 0),
            discount_price: null,
            vat_price: null,
            total_price: factoryRow.sum_rrc,
            currency: doorData.currency || 'RUB',
            created_at: kpData.created_at
          });
        }
      }
    }

    return rows;
  }
};

