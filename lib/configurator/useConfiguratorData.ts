'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';
import { parseApiResponse } from '@/lib/utils/parse-api-response';
import type { DoorModel, DoorCoating, DoorEdge, DoorOption, DoorHandle, DoorLimiter } from './api';

/**
 * Хук для загрузки базовых данных конфигуратора (модели, ручки, ограничители)
 */
export function useConfiguratorData() {
  const [models, setModels] = useState<DoorModel[]>([]);
  const [handles, setHandles] = useState<DoorHandle[]>([]);
  const [limiters, setLimiters] = useState<DoorLimiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Загружаем модели (публичный endpoint)
        const modelsResponse = await fetch('/api/catalog/doors/complete-data');
        if (!modelsResponse.ok) {
          throw new Error(`HTTP error! status: ${modelsResponse.status}`);
        }
        const responseData = await modelsResponse.json();
        const modelsData = parseApiResponse<{ ok?: boolean; models: any[]; totalModels?: number; styles?: string[] }>(responseData);
        
        if (!cancelled && modelsData && (modelsData.ok !== false) && modelsData.models && Array.isArray(modelsData.models)) {
          // Преобразуем данные моделей в нужный формат
          const formattedModels: DoorModel[] = modelsData.models.map((m: any) => ({
            id: m.modelKey || m.model || String(Math.random()),
            model_name: m.model || '',
            style: m.style || '',
            photo: m.photo || m.photos?.cover || null,
            photos: m.photos || { cover: m.photo, gallery: [] },
            sizes: m.products?.map((p: any) => ({
              width: Number(p.properties?.['Ширина/мм']) || 800,
              height: Number(p.properties?.['Высота/мм']) || 2000,
            })).filter((s: any) => s.width && s.height) || []
          }));
          setModels(formattedModels);
        }

        // Загружаем опции (ручки и ограничители) - требует авторизацию
        try {
          const optionsResponse = await fetchWithAuth('/api/catalog/doors/options', undefined, true);
          if (!optionsResponse.ok) {
            throw new Error(`HTTP error! status: ${optionsResponse.status}`);
          }
          const optionsResponseData = await optionsResponse.json();
          const optionsData = parseApiResponse<{ domain?: any; ok?: boolean }>(optionsResponseData);
          
          if (!cancelled && optionsData && optionsData.domain) {
            // Ручки из domain.handles
            if (optionsData.domain.handles) {
              const formattedHandles: DoorHandle[] = optionsData.domain.handles.map((h: any) => ({
                id: h.id || String(Math.random()),
                name: h.name || '',
                photo_path: null,
                price_rrc: h.price_rrc || 0,
                price_opt: h.price_opt || 0,
              }));
              setHandles(formattedHandles);
            }

            // Ограничители нужно загрузить отдельно (если есть API)
            // Пока оставляем пустым или используем моковые данные
            setLimiters([]);
          }
        } catch (optionsError) {
          // Если не авторизован, просто не загружаем ручки и ограничители
          console.warn('Не удалось загрузить опции (требуется авторизация):', optionsError);
          setHandles([]);
          setLimiters([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Ошибка загрузки данных'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, handles, limiters, loading, error };
}

/**
 * Хук для загрузки деталей модели (покрытия, кромки, опции)
 */
export function useModelDetails(modelId: string | null) {
  const [model, setModel] = useState<DoorModel | null>(null);
  const [coatings, setCoatings] = useState<DoorCoating[]>([]);
  const [edges, setEdges] = useState<DoorEdge[]>([]);
  const [options, setOptions] = useState<DoorOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!modelId) {
      setModel(null);
      setCoatings([]);
      setEdges([]);
      setOptions([]);
      return;
    }

    let cancelled = false;

    async function loadModelDetails() {
      try {
        setLoading(true);

        // Загружаем полные данные моделей (публичный endpoint)
        const response = await fetch('/api/catalog/doors/complete-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        const data = parseApiResponse<{ ok?: boolean; models: any[]; totalModels?: number; styles?: string[] }>(responseData);

        if (!cancelled && data && (data.ok !== false) && data.models && Array.isArray(data.models)) {
          // Находим нужную модель
          const foundModel = data.models.find((m: any) => 
            (m.modelKey || m.model) === modelId || m.model === modelId
          );

          if (foundModel) {
            const formattedModel: DoorModel = {
              id: foundModel.modelKey || foundModel.model || modelId,
              model_name: foundModel.model || '',
              style: foundModel.style || '',
              photo: foundModel.photo || foundModel.photos?.cover || null,
              photos: foundModel.photos || { cover: foundModel.photo, gallery: [] },
              sizes: foundModel.products?.map((p: any) => ({
                width: Number(p.properties?.['Ширина/мм']) || 800,
                height: Number(p.properties?.['Высота/мм']) || 2000,
              })).filter((s: any) => s.width && s.height) || []
            };
            setModel(formattedModel);

            // Извлекаем покрытия, кромки и опции из продуктов модели
            const coatingsMap = new Map<string, DoorCoating>();
            const edgesMap = new Map<string, DoorEdge>();
            const optionsMap = new Map<string, DoorOption>();

            foundModel.products?.forEach((product: any) => {
              const props = product.properties || {};

              // Покрытия
              if (props['Тип покрытия'] && props['Domeo_Цвет']) {
                const coatingKey = `${props['Тип покрытия']}_${props['Domeo_Цвет']}`;
                if (!coatingsMap.has(coatingKey)) {
                  coatingsMap.set(coatingKey, {
                    id: coatingKey,
                    coating_type: props['Тип покрытия'] || '',
                    color_name: props['Domeo_Цвет'] || '',
                    photo_path: null,
                  });
                }
              }

              // Кромки
              if (props['Кромка'] && props['Кромка'] !== '-' && props['Кромка'] !== '') {
                const edgeKey = props['Кромка'];
                if (!edgesMap.has(edgeKey)) {
                  edgesMap.set(edgeKey, {
                    id: edgeKey,
                    edge_color_name: props['Кромка'] || '',
                    photo_path: null,
                  });
                }
              }
            });

            setCoatings(Array.from(coatingsMap.values()));
            setEdges(Array.from(edgesMap.values()));
            setOptions([]); // Опции нужно загружать отдельно
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки деталей модели:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadModelDetails();

    return () => {
      cancelled = true;
    };
  }, [modelId]);

  return { model, coatings, edges, options, loading };
}

/**
 * Интерфейс для параметров расчета цены
 */
export interface PriceCalculationParams {
  door_model_id?: string;
  coating_id?: string;
  edge_id?: string;
  option_ids?: string[];
  handle_id?: string;
  limiter_id?: string;
  width?: number;
  height?: number;
}

/**
 * Интерфейс результата расчета цены
 */
export interface PriceData {
  currency: string;
  base: number;
  breakdown: Array<{ label: string; amount: number }>;
  total: number;
  sku?: string;
}

/**
 * Хук для расчета цены
 */
export function usePriceCalculation() {
  const [calculating, setCalculating] = useState(false);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const calculate = useCallback(async (params: PriceCalculationParams) => {
    if (!params.door_model_id) {
      setPriceData(null);
      return;
    }

    try {
      setCalculating(true);

      // Преобразуем параметры в формат API
      const selection: any = {
        model: params.door_model_id,
      };

      if (params.width) selection.width = params.width;
      if (params.height) selection.height = params.height;
      if (params.handle_id) {
        selection.handle = { id: params.handle_id };
      }

      // Расчет цены - публичный endpoint
      const response = await fetch('/api/price/doors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selection }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      const data = parseApiResponse(responseData);

      if (data && data.total !== undefined) {
        setPriceData({
          currency: data.currency || 'RUB',
          base: data.base || 0,
          breakdown: data.breakdown || [],
          total: data.total || 0,
          sku: data.sku,
        });
      } else {
        setPriceData(null);
      }
    } catch (err) {
      console.error('Ошибка расчета цены:', err);
      setPriceData(null);
    } finally {
      setCalculating(false);
    }
  }, []);

  return { calculate, calculating, priceData };
}

