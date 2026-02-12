'use client';

import Link from 'next/link';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { designTokens } from '@/lib/design/tokens';
import HandleSelectionModal from '@/components/HandleSelectionModal';
import { Info } from 'lucide-react';
import { useConfiguratorData, useModelDetails, usePriceCalculation } from '@/lib/configurator/useConfiguratorData';
import { useModelOptions } from '@/lib/configurator/useModelOptions';
import type { DoorModel, DoorCoating, DoorEdge, DoorOption, DoorHandle, DoorLimiter } from '@/lib/configurator/api';
import { CartManager } from '@/components/doors';
import type { CartItem, HardwareKit } from '@/components/doors';
import { formatModelNameForCard } from '@/components/doors/utils';
import {
  getImageSrc,
  getImageSrcWithPlaceholder,
  createPlaceholderSvgDataUrl,
  getHandleImageSrc,
} from '@/lib/configurator/image-src';
import GlobalHeader from '@/components/layout/GlobalHeader';
import NotificationBell from '@/components/ui/NotificationBell';
import { useAuth } from '@/lib/auth/AuthContext';
import { CreateClientModal } from '@/components/clients/CreateClientModal';
import { clientLogger } from '@/lib/logging/client-logger';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';
import { parseApiResponse } from '@/lib/utils/parse-api-response';

/**
 * ТОЧНАЯ копия макета из Figma
 * На основе визуального описания и данных из Figma API
 * 
 * Структура:
 * - Header: "Межкомнатные двери"
 * - Заголовки: "Стили", "Модели"
 * - Табы: "полотно" (активный), "ПОКРЫТИЕ И ЦВЕТ"
 * - Сетка моделей: 2 ряда миниатюр
 * - Большое превью справа: вертикальное изображение двери
 * - Параметры справа: список параметров
 * - Цена: "66 200 Р"
 * - Кнопки: "В корзину", "Заказать в 1 клик"
 * - "ЗАВЕРШИТЬ ОБРАЗ": опции фурнитуры
 */

export default function FigmaExactReplicaPage() {
  // Аутентификация
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role || 'guest';

  // Загружаем данные через хуки
  const { models: allModels, rawModels, handles: allHandles, limiters: allLimiters, architraves: allArchitraves, kits: configKits, loading: dataLoading, error: dataError } = useConfiguratorData();
  
  // Состояние для выбранной модели (ID из API)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Загружаем детали выбранной модели (у каждой модели — тип покрытия и набор цветов по типам)
  const { model: selectedModelData, coatings, finishes, colorsByFinish, edges, options, loading: modelLoading } = useModelDetails(selectedModelId, rawModels);

  // Хук для расчета цены
  const { calculate: calculatePrice, calculating: priceCalculating, priceData, clearPrice } = usePriceCalculation();
  
  // Состояние для стиля и наполнения (наполнение — только фильтр)
  const [selectedStyle, setSelectedStyle] = useState<string>('Современные');
  const [selectedFilling, setSelectedFilling] = useState<string | null>(null);
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'полотно' | 'покрытие' | 'фурнитура' | 'наличники' | 'доп-опции'>('полотно');
  
  // Состояние для покрытия и цвета: тип покрытия из данных модели, затем цвет этого типа
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null);
  const [selectedCoatingId, setSelectedCoatingId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedWood, setSelectedWood] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  /** Цвет стекла (лист Стекло_доступность); на цену не влияет, только в спецификацию */
  const [selectedGlassColor, setSelectedGlassColor] = useState<string | null>(null);
  
  // Состояние для размеров, реверса и наполнения (вкладка Полотно)
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(2000);
  const [reversible, setReversible] = useState<boolean>(false);
  const [filling, setFilling] = useState<'standard' | 'good' | 'excellent'>('good');

  // Каскадные опции: доступность и списки по текущим фильтрам (реверс, наполнение, размер, покрытие, цвет)
  const selectedCoatingForOptions = selectedCoatingId ? coatings.find((c) => c.id === selectedCoatingId) : null;
  const modelOptionsParams = useMemo(
    () => ({
      reversible,
      filling: selectedFilling,
      width,
      height,
      finish: selectedFinish,
      color: selectedCoatingForOptions?.color_name ?? null,
    }),
    [reversible, selectedFilling, width, height, selectedFinish, selectedCoatingForOptions?.color_name]
  );
  const { data: modelOptionsData } = useModelOptions(selectedModelId, selectedStyle, modelOptionsParams);

  // При смене модели выставляем первый тип покрытия из каскада/модели
  useEffect(() => {
    const list = selectedModelId && modelOptionsData.finishes.length > 0 ? modelOptionsData.finishes : finishes;
    if (list.length > 0) {
      setSelectedFinish((prev) => (prev && list.includes(prev) ? prev : list[0]));
    } else {
      setSelectedFinish(null);
    }
  }, [selectedModelId, modelOptionsData.finishes, finishes]);
  // При смене типа покрытия сбрасываем выбранный цвет, если он не из этого типа
  useEffect(() => {
    if (!selectedFinish || !selectedCoatingId) return;
    const coating = coatings.find((c) => c.id === selectedCoatingId);
    if (coating && coating.coating_type !== selectedFinish) {
      setSelectedCoatingId(null);
      setSelectedColor(null);
      setSelectedWood(null);
    }
  }, [selectedFinish, selectedCoatingId, coatings]);
  
  // Состояние для фурнитуры
  const [selectedHardwareKit, setSelectedHardwareKit] = useState<string | null>(null);
  const [selectedHandleId, setSelectedHandleId] = useState<string | null>(null);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [hasLock, setHasLock] = useState<boolean | null>(null);
  
  // Состояние для наличников (ID опции)
  const [selectedArchitraveId, setSelectedArchitraveId] = useState<string | null>(null);
  
  // Состояние для дополнительных опций
  const [selectedStopperId, setSelectedStopperId] = useState<string | null>(null);
  const [selectedStopperColor, setSelectedStopperIdColor] = useState<string | null>(null);
  const [selectedMirrorId, setSelectedMirrorId] = useState<string | null>(null);
  const [selectedThresholdId, setSelectedThresholdId] = useState<string | null>(null);
  const [zoomPreviewSrc, setZoomPreviewSrc] = useState<string | null>(null);
  const [zoomPreviewAlt, setZoomPreviewAlt] = useState<string>('');

  // Корзина
  const [cart, setCart] = useState<CartItem[]>([]);
  const [originalPrices, setOriginalPrices] = useState<Record<string, number>>({});
  const [cartHistory, setCartHistory] = useState<Array<{timestamp: Date, changes: Record<string, any>, totalDelta: number}>>([]);
  const [showCartManager, setShowCartManager] = useState(false);
  const [cartManagerBasePrices, setCartManagerBasePrices] = useState<Record<string, number>>({});
  
  // Клиенты
  const [showClientManager, setShowClientManager] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Комплекты фурнитуры для CartManager
  const [hardwareKits, setHardwareKits] = useState<HardwareKit[]>([]);
  
  // Таб для админ-панели (если нужен)
  const [tab, setTab] = useState<'config' | 'admin'>('config');

  useEffect(() => {
    if (!zoomPreviewSrc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomPreviewSrc(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomPreviewSrc]);

  // Загружаем комплекты фурнитуры
  useEffect(() => {
    const loadHardwareKits = async () => {
      try {
        const kitsResponse = await fetchWithAuth('/api/catalog/hardware?type=kits');
        if (kitsResponse.ok) {
          let kitsData: unknown;
          try {
            kitsData = await kitsResponse.json();
            const parsedKits = parseApiResponse<HardwareKit[] | { kits?: HardwareKit[] } | { data?: HardwareKit[] }>(kitsData);
            let kits: HardwareKit[] = [];
            if (Array.isArray(parsedKits)) {
              kits = parsedKits;
            } else if (parsedKits && typeof parsedKits === 'object' && 'kits' in parsedKits && Array.isArray(parsedKits.kits)) {
              kits = parsedKits.kits;
            } else if (parsedKits && typeof parsedKits === 'object' && 'data' in parsedKits && Array.isArray((parsedKits as { data: HardwareKit[] }).data)) {
              kits = (parsedKits as { data: HardwareKit[] }).data;
            }
            setHardwareKits(kits);
          } catch (jsonError) {
            clientLogger.error('Ошибка парсинга JSON ответа kits:', jsonError);
            setHardwareKits([]);
          }
        } else if (kitsResponse.status === 401) {
          clientLogger.warn('🔒 Необходима авторизация для загрузки комплектов фурнитуры');
          setHardwareKits([]);
        }
      } catch (error) {
        clientLogger.error('Ошибка загрузки комплектов фурнитуры:', error);
        setHardwareKits([]);
      }
    };

    if (isAuthenticated) {
      loadHardwareKits();
    }
  }, [isAuthenticated]);

  // Дублируем комплекты из конфигуратора в state для CartManager (публичный API, без авторизации)
  useEffect(() => {
    if (configKits && configKits.length > 0) {
      setHardwareKits(configKits.map((k) => ({
        id: k.id,
        name: k.name,
        description: '',
        price: k.price,
        priceGroup: k.priceGroup || '',
        isBasic: k.isBasic || false,
      })));
    }
  }, [configKits]);

  // Фильтруем модели по стилю и наполнению (название наполнения из листа «Опции»)
  const filteredModels = useMemo(() => {
    let list = allModels;
    if (selectedStyle) list = list.filter(m => m.style === selectedStyle);
    if (selectedFilling) {
      list = list.filter(m => {
        const fillings = (m as { filling_names?: string[]; doorOptions?: { filling_name?: string } }).filling_names
          ?? (m.doorOptions?.filling_name ? [m.doorOptions.filling_name] : []);
        return fillings.includes(selectedFilling);
      });
    }
    return list;
  }, [allModels, selectedStyle, selectedFilling]);

  // Уникальные стили из моделей
  const availableStyles = useMemo(() => {
    const styles = Array.from(new Set(allModels.map(m => m.style))).sort();
    return styles;
  }, [allModels]);

  // Уникальные названия наполнения: по всем моделям или по каскаду (если модель выбрана и API вернул список)
  const availableFillingsFromAll = useMemo(() => {
    const names = new Set<string>();
    allModels.forEach((m: { filling_names?: string[]; doorOptions?: { filling_name?: string } }) => {
      const list = m.filling_names ?? (m.doorOptions?.filling_name ? [m.doorOptions.filling_name] : []);
      list.forEach(name => { if (name) names.add(name); });
    });
    return Array.from(names).sort();
  }, [allModels]);
  const availableFillings =
    selectedModelId && modelOptionsData.fillings.length > 0 ? modelOptionsData.fillings : availableFillingsFromAll;

  // Диагностика фото моделей (в консоль)
  useEffect(() => {
    if (allModels.length === 0) return;
    const withPhoto = allModels.filter((m) => m.photo);
    console.log('[Doors] Фото моделей: всего', allModels.length, ', с полем photo:', withPhoto.length);
    allModels.slice(0, 3).forEach((m, i) => {
      const p = m.photo ? (m.photo.length > 50 ? m.photo.slice(0, 50) + '…' : m.photo) : null;
      console.log(`[Doors] Модель ${i + 1}:`, m.model_name || m.id, '| photo:', p);
    });
    if (withPhoto.length === 0) {
      console.log('[Doors] Подсказка: API complete-data вернул photo: null для всех моделей. Проверьте БД (PropertyPhoto, ProductImage) и файлы в public/uploads/ — см. docs/PHOTOS_FLOW_ANALYSIS.md');
    }
  }, [allModels]);

  // Устанавливаем первую модель при загрузке данных
  useEffect(() => {
    if (filteredModels.length > 0 && !selectedModelId) {
      const firstModel = filteredModels[0];
      setSelectedModelId(firstModel.id);
      setSelectedModel(firstModel.model_name);
    }
  }, [filteredModels, selectedModelId]);

  // Обновляем выбранную модель при изменении selectedModelId
  useEffect(() => {
    if (selectedModelId && selectedModelData) {
      setSelectedModel(selectedModelData.model_name);
    }
  }, [selectedModelId, selectedModelData]);

  // При смене модели сбрасываем цвет стекла (варианты зависят от модели)
  useEffect(() => {
    setSelectedGlassColor(null);
  }, [selectedModelId]);

  // При смене модели: если кромка в базе — выбираем базовую (первую); иначе сбрасываем, если выбранная не в списке
  useEffect(() => {
    if (selectedModelData?.edge_in_base && edges.length > 0) {
      const edgeIds = new Set(edges.map((e) => e.id));
      if (!selectedEdgeId || !edgeIds.has(selectedEdgeId)) setSelectedEdgeId(edges[0].id);
    } else {
      if (!selectedEdgeId || selectedEdgeId === 'none') return;
      const edgeIds = new Set(edges.map((e) => e.id));
      if (!edgeIds.has(selectedEdgeId)) setSelectedEdgeId(null);
    }
  }, [selectedModelId, edges, selectedEdgeId, selectedModelData?.edge_in_base]);

  // При смене на модель без реверса (по каскаду) сбрасываем выбор «Да»
  useEffect(() => {
    if (reversible && !modelOptionsData.revers_available) setReversible(false);
  }, [selectedModelId, modelOptionsData.revers_available, reversible]);

  // Цвета ограничителей
  const stopperColors = [
    { id: 'black', name: 'Черный', color: '#000000' },
    { id: 'white', name: 'Белый', color: '#FFFFFF' },
    { id: 'chrome', name: 'Хром', color: '#C0C0C0' },
    { id: 'gold', name: 'Золото', color: '#FFD700' },
  ];



  // Функция для создания SVG иконок стилей (соотношение 1:2, на всю плашку)
  const createDoorStyleIcon = (styleName: string) => {
    const strokeColor = '#6B7280';
    const strokeWidth = 1.5;
    
    switch(styleName) {
      case 'Скрытая':
        // Простая прямоугольная дверь с ручкой справа посередине
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="96" height="196" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <line x1="82" y1="100" x2="96" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"/>
          </svg>
        );
      case 'Современные':
        // Дверь с одним большим внутренним прямоугольником (панель/стекло), ручка справа посередине
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="96" height="196" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <rect x="8" y="8" width="84" height="184" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <line x1="82" y1="100" x2="96" y2="100" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"/>
          </svg>
        );
      case 'Неоклассика':
        // Дверь с двумя панелями (верхняя больше), круглая ручка справа на верхней панели
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="96" height="196" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <rect x="8" y="8" width="84" height="120" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <rect x="8" y="132" width="84" height="60" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <circle cx="82" cy="70" r="3" fill={strokeColor}/>
          </svg>
        );
      case 'Классические':
        // Дверь с двумя панелями, каждая с внутренними рамками, ручка справа на верхней панели
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="96" height="196" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            {/* Верхняя панель с внутренней рамкой */}
            <rect x="8" y="8" width="84" height="120" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <rect x="14" y="16" width="72" height="104" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            {/* Нижняя панель с внутренней рамкой */}
            <rect x="8" y="132" width="84" height="60" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            <rect x="14" y="140" width="72" height="44" stroke={strokeColor} strokeWidth={strokeWidth} rx="0"/>
            {/* Ручка справа на верхней панели */}
            <line x1="82" y1="70" x2="96" y2="70" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Стили с SVG иконками (соотношение 1:2) - из доступных стилей
  const styles = useMemo(() => {
    return availableStyles.map(styleName => ({
      id: styleName,
      name: styleName,
      icon: createDoorStyleIcon(styleName)
    }));
  }, [availableStyles]);

  // Варианты размеров: всегда из всех размеров выбранной модели (complete-data),
  // чтобы список не схлопывался текущим выбором width/height из model-options.
  const widthOptions = useMemo(() => {
    if (!selectedModelData || !selectedModelData.sizes) return [600, 700, 800, 900];
    const widths = Array.from(new Set(selectedModelData.sizes.map((s) => s.width))).sort((a, b) => a - b);
    return widths.length > 0 ? widths : [600, 700, 800, 900];
  }, [selectedModelData]);

  // Высоты из товаров модели + для всех моделей диапазоны 2301–2500 и 2501–3000 (надбавка % к 2000 мм)
  const HEIGHT_BAND_2301_2500 = 2350;
  const HEIGHT_BAND_2501_3000 = 2750;
  const heightOptions = useMemo(() => {
    const fromSizes = selectedModelData?.sizes
      ? Array.from(new Set(selectedModelData.sizes.map((s) => s.height))).sort((a, b) => a - b)
      : [];
    const baseOptions = fromSizes.length > 0
      ? fromSizes.map((h) => ({ value: h, label: String(h) }))
      : [
          { value: 2000, label: '2000' },
          { value: 2100, label: '2100' },
          { value: 2200, label: '2200' },
          { value: 2300, label: '2300' },
        ];
    const bands = [
      { value: HEIGHT_BAND_2301_2500, label: '2301–2500' },
      { value: HEIGHT_BAND_2501_3000, label: '2501–3000' },
    ];
    return [...baseOptions, ...bands];
  }, [selectedModelData]);

  // Варианты наполнения
  const fillingOptions = [
    { type: 'standard' as const, name: 'Стандартное', soundInsulation: '~27 дБ', description: 'Для коридоров, кладовых' },
    { type: 'good' as const, name: 'Хорошее', soundInsulation: '~30 дБ', description: 'Для спален, кабинетов, гостиных' },
    { type: 'excellent' as const, name: 'Отличное', soundInsulation: '35-42 дБ', description: 'Максимальная звукоизоляция' },
  ];

  // Ручки из API (отображение фото через getHandleImageSrc / image-src)
  const handles = useMemo(() => {
    return allHandles.map(h => ({
      id: h.id,
      name: h.name,
      photo: h.photo_path,
      price: h.price_rrc || h.price_opt || 0
    }));
  }, [allHandles]);

  // Получаем выбранную ручку из API данных
  const selectedHandleIdObj = selectedHandleId 
    ? allHandles.find(h => h.id === selectedHandleId)
    : null;

  // Типы покрытия: из каскада или из модели; при смене модели выставляем первый доступный
  const cascadeFinishes = useMemo(() => {
    if (selectedModelId && modelOptionsData.finishes.length > 0) return modelOptionsData.finishes;
    return finishes;
  }, [selectedModelId, modelOptionsData.finishes, finishes]);

  // Цвета только для выбранного типа покрытия, с учётом каскада (только доступные по опциям)
  const filteredCoatings = useMemo(() => {
    if (!selectedFinish || !coatings.length) return [];
    let list = coatings.filter((c) => c.coating_type === selectedFinish);
    const allowedColors = modelOptionsData.colorsByFinish[selectedFinish];
    // Fallback to full model palette when cascade endpoint returns an empty list.
    if (selectedModelId && Array.isArray(allowedColors) && allowedColors.length > 0) {
      const allowed = new Set(allowedColors);
      list = list.filter((c) => allowed.has(c.color_name));
    }
    return list;
  }, [coatings, selectedFinish, selectedModelId, modelOptionsData.colorsByFinish]);

  // Монохромная палитра: цвета выбранного типа ПЭТ/ПВХ/Эмаль
  const monochromeColors = useMemo(() => {
    if (!selectedFinish || !['ПЭТ', 'ПВХ', 'Эмаль'].includes(selectedFinish)) return [];
    return filteredCoatings.map((c) => ({
      id: c.id,
      name: c.color_name,
      color: '#FFFFFF',
      photo_path: c.photo_path ?? null,
    }));
  }, [filteredCoatings, selectedFinish]);

  // Древесная палитра: цвета выбранного типа Шпон
  const woodOptions = useMemo(() => {
    if (selectedFinish !== 'Шпон') return [];
    return filteredCoatings.map((c) => ({
      id: c.id,
      name: c.color_name,
      photo_path: c.photo_path ?? null,
    }));
  }, [filteredCoatings, selectedFinish]);

  // Опции кромки: из API (с наценкой). Если кромка в базе — без варианта «Без кромки», только цвета с +ценой
  const edgeOptions = useMemo(() => {
    const edgeList: Array<{ id: string; name: string; icon: string; color?: string; photo_path: string | null; surcharge?: number }> = [];
    if (!selectedModelData?.edge_in_base) edgeList.push({ id: 'none', name: 'Без кромки', icon: 'none', photo_path: null, surcharge: 0 });
    const allowed = selectedModelId && modelOptionsData.edges.length > 0 ? new Set(modelOptionsData.edges) : null;
    edges.forEach((edge) => {
      if (allowed && !allowed.has(edge.edge_color_name)) return;
      edgeList.push({
        id: edge.id,
        name: edge.edge_color_name,
        icon: 'none',
        photo_path: edge.photo_path ?? null,
        surcharge: edge.surcharge ?? 0,
      });
    });
    return edgeList;
  }, [edges, selectedModelId, modelOptionsData.edges, selectedModelData?.edge_in_base]);

  // Наличники: из API hardware?type=architraves
  const architraveOptions = useMemo(() => {
    return (allArchitraves || []).map(o => ({
      id: o.id,
      name: o.option_name || o.option_type || '',
      photo_path: o.photo_path ?? null,
    }));
  }, [allArchitraves]);

  // Ограничители из API
  const stopperOptions = useMemo(() => {
    const stopperList: Array<{ id: string; name: string; price?: number; photo_path: string | null }> = [{ id: 'none', name: 'Без ограничителя', photo_path: null }];
    allLimiters.forEach(limiter => {
      stopperList.push({
        id: limiter.id,
        name: limiter.name,
        price: limiter.price_rrc || limiter.price_opt,
        photo_path: limiter.photo_path ?? null,
      });
    });
    return stopperList;
  }, [allLimiters]);

  // Зеркало из API (опции типа "зеркало")
  const mirrorOptions = useMemo(() => {
    const mirrorList: Array<{id: string, name: string, price?: number}> = [{ id: 'none', name: 'Без зеркала' }];
    const mirrorOpts = options.filter(o => o.option_type === 'зеркало');
    mirrorOpts.forEach(opt => {
      mirrorList.push({
        id: opt.id,
        name: opt.option_name,
        price: opt.price_surcharge || undefined
      });
    });
    return mirrorList;
  }, [options]);

  // Порог из API (опции типа "порог")
  const thresholdOptions = useMemo(() => {
    return options.filter(o => o.option_type === 'порог');
  }, [options]);

  // Спецификация (динамические, обновляются при выборе)
  const getCoatingText = () => {
    if (!selectedCoatingId) return 'Не выбрано';
    const coating = coatings.find(c => c.id === selectedCoatingId);
    if (!coating) return 'Не выбрано';
    return `${coating.coating_type}; ${coating.color_name}`;
  };

  // Описания типов покрытия
  const coatingDescriptions: Record<string, string> = {
    'пэт': 'Покрытие, имитирующее эмаль, пластик',
    'пвх': 'Высококачественная современная пленка с различными текстурами',
    'эмаль': 'Многослойное лакокрасочное покрытие',
    'шпон': 'Натуральные срезы различных пород дерева с покрытием лаком',
    'алюминий': 'Металлическое покрытие',
  };
  const getCoatingDescription = () =>
    selectedFinish ? (coatingDescriptions[selectedFinish.toLowerCase()] ?? `Тип покрытия: ${selectedFinish}`) : '';

  const getFillingText = () => {
    const fillingOption = fillingOptions.find(f => f.type === filling);
    return fillingOption ? `${fillingOption.name} (${fillingOption.soundInsulation})` : 'Не выбрано';
  };

  const getEdgeText = () => {
    if (!selectedEdgeId) return 'Без кромки';
    const edge = edges.find(e => e.id === selectedEdgeId);
    return edge ? edge.edge_color_name : 'Без кромки';
  };

  const getHandleText = () => {
    if (!selectedHandleId || !selectedHandleIdObj) return 'Не выбрано';
    return selectedHandleIdObj.name || 'Не выбрано';
  };

  const getHardwareKitText = () => {
    if (!selectedHardwareKit) return 'Не выбрано';
    const kit = configKits?.find((k) => k.id === selectedHardwareKit) || hardwareKits.find((k) => k.id === selectedHardwareKit);
    return kit?.name || selectedHardwareKit;
  };

  const getStopperText = () => {
    if (!selectedStopperId || selectedStopperId === 'none') return 'Без ограничителя';
    const stopper = allLimiters.find(l => l.id === selectedStopperId);
    if (!stopper) return 'Не выбрано';
    if (selectedStopperColor) {
      const color = stopperColors.find(c => c.id === selectedStopperColor);
      return color ? `${stopper.name} (${color.name})` : stopper.name;
    }
    return stopper.name;
  };

  const getMirrorText = () => {
    if (!selectedMirrorId || selectedMirrorId === 'none') return 'Без зеркала';
    const mirror = options.find(o => o.id === selectedMirrorId && o.option_type === 'зеркало');
    return mirror ? mirror.option_name : 'Не выбрано';
  };


  const getThresholdText = () => {
    if (!selectedThresholdId) return 'Нет';
    const threshold = options.find(o => o.id === selectedThresholdId && o.option_type === 'порог');
    return threshold ? threshold.option_name : 'Нет';
  };

  // Добавление в корзину
  const addToCart = useCallback(() => {
    if (!priceData) return;

    // В option_ids только наличники (отдельный товар в корзине); зеркало и порог — опции, не отдельные строки
    const optionIds: string[] = [];
    if (selectedArchitraveId) optionIds.push(selectedArchitraveId);

    const cartItem: CartItem = {
      id: `${selectedModelId}-${Date.now()}`,
      model: selectedModelData?.model_name || '',
      style: selectedModelData?.style || '',
      width: width,
      height: height,
      color: getCoatingText(),
      edge: selectedEdgeId ? 'да' : 'нет',
      unitPrice: priceData.total,
      qty: 1,
      handleId: selectedHandleId || undefined,
      limiterId: selectedStopperId && selectedStopperId !== 'none' ? selectedStopperId : undefined,
      coatingId: selectedCoatingId || undefined,
      edgeId: selectedEdgeId || undefined,
      optionIds: optionIds.length > 0 ? optionIds : undefined,
      sku_1c: priceData.sku || undefined,
      reversible,
      mirror: selectedMirrorId && selectedMirrorId !== 'none' ? selectedMirrorId : undefined,
      threshold: selectedThresholdId != null,
      hardwareKitId: selectedHardwareKit || undefined,
    };

    setCart(prev => [...prev, cartItem]);
    setOriginalPrices(prev => ({ ...prev, [cartItem.id]: priceData.total }));
  }, [
    selectedModelId,
    selectedModelData,
    priceData,
    width,
    height,
    selectedCoatingId,
    selectedEdgeId,
    selectedHandleId,
    selectedStopperId,
    selectedArchitraveId,
    selectedMirrorId,
    selectedThresholdId,
    getCoatingText
  ]);

  // Генерация документов
  const generateDocument = async (type: 'quote' | 'invoice' | 'order') => {
    if (cart.length === 0) {
      alert('Корзина пуста');
      return;
    }

    if (!selectedClient) {
      setShowClientManager(true);
      return;
    }

    try {
      const response = await fetchWithAuth('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          type,
          clientId: selectedClient,
          items: cart.map(item => ({
            id: item.id,
            model: item.model,
            style: item.style,
            color: item.color,
            width: item.width,
            height: item.height,
            qty: item.qty,
            unitPrice: item.unitPrice,
            sku_1c: item.sku_1c,
            handleId: item.handleId,
            limiterId: item.limiterId,
            coatingId: item.coatingId,
            edgeId: item.edgeId,
            optionIds: item.optionIds,
            hardwareKitId: item.hardwareKitId,
            reversible: item.reversible,
            mirror: item.mirror,
            threshold: item.threshold,
          })),
          totalAmount: cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        if (type === 'order') {
          a.download = `Заказ_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else {
          a.download = `${type === 'quote' ? 'КП' : 'Счет'}_${new Date().toISOString().split('T')[0]}.pdf`;
        }
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Ошибка при генерации документа');
      }
    } catch (error) {
      clientLogger.error('Error generating document:', error);
      alert('Ошибка при генерации документа');
    }
  };

  // Расчёт цены только после выбора: Стиль, Модель, Размеры, Реверс, Наполнение, Покрытие и Цвет
  const canCalculatePrice = Boolean(
    selectedStyle &&
    selectedModelId &&
    width &&
    height &&
    selectedFinish &&
    selectedCoatingId
  );
  useEffect(() => {
    if (!canCalculatePrice) {
      clearPrice();
      return;
    }
    const coating = coatings.find(c => c.id === selectedCoatingId);
    const finish = coating?.coating_type;
    const colorName = coating?.color_name;
    const optionIds: string[] = [];
    if (selectedArchitraveId) optionIds.push(selectedArchitraveId);

    calculatePrice({
      door_model_id: selectedModelId!,
      style: selectedModelData?.style || undefined,
      finish: finish || undefined,
      color: colorName || undefined,
      coating_id: selectedCoatingId || undefined,
      edge_id: selectedEdgeId || undefined,
      option_ids: optionIds.length > 0 ? optionIds : undefined,
      handle_id: selectedHandleId || undefined,
      limiter_id: selectedStopperId && selectedStopperId !== 'none' ? selectedStopperId : undefined,
      hardware_kit_id: selectedHardwareKit || undefined,
      width,
      height,
      reversible,
      mirror: selectedMirrorId && selectedMirrorId !== 'none' ? (selectedMirrorId as 'one' | 'both' | 'mirror_one' | 'mirror_both') : 'none',
      threshold: selectedThresholdId != null,
    }).catch(err => {
      console.error('Ошибка расчета цены:', err);
    });
  }, [canCalculatePrice, selectedModelId, selectedModelData?.style, selectedCoatingId, selectedEdgeId, selectedHandleId, selectedStopperId, selectedArchitraveId, selectedHardwareKit, reversible, selectedMirrorId, selectedThresholdId, width, height, calculatePrice, clearPrice, selectedModelData, coatings]);

  // Форматируем цену (показываем подсказку, если не выбраны все обязательные параметры)
  const price = useMemo(() => {
    if (priceCalculating) return 'Рассчитывается...';
    if (priceData) return `${priceData.total.toLocaleString('ru-RU')} Р`;
    if (!canCalculatePrice) return 'Выберите стиль, модель, размеры, реверс, наполнение, покрытие и цвет';
    return '—';
  }, [priceData, priceCalculating, canCalculatePrice]);

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: designTokens.colors.gray[50],
          maxWidth: '1920px', 
          margin: '0 auto',
          width: '100%'
        }}
      >
      {/* Header - как в старой странице */}
      <header className="bg-white border-b-2 border-gray-300">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center">
            <div className="flex items-baseline space-x-3 flex-1 min-w-0">
              <Link href="/" className="text-2xl font-bold text-black">
                Domeo
              </Link>
              <span className="text-black text-lg font-bold">•</span>
              <span className="text-lg font-semibold text-black">Doors</span>
            </div>
            <nav className="flex items-center space-x-4 justify-end flex-shrink-0 ml-auto">
              {isAuthenticated && <NotificationBell userRole={user?.role || "executor"} />}
              <Link 
                href="/" 
                className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
              >
                ← Категории
              </Link>
              {isAuthenticated && (
                <button
                  onClick={() => setShowClientManager(true)}
                  className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
                >
                  👤 {selectedClientName || 'Заказчик'}
                </button>
              )}
              {tab === "admin" && (
                <button
                  onClick={() => setTab("admin")}
                  className={`px-3 py-1 border transition-all duration-200 text-sm ${
                    tab === "admin" 
                      ? "bg-black text-white border-black" 
                      : "border-black text-black hover:bg-black hover:text-white"
                  }`}
                >
                  Админ
                </button>
              )}
              <button
                onClick={() => {
                  // Сохраняем текущие цены как базовые для расчета дельты
                  const basePrices: Record<string, number> = {};
                  cart.forEach(item => {
                    basePrices[item.id] = item.unitPrice;
                  });
                  setCartManagerBasePrices(basePrices);
                  setShowCartManager(true);
                }}
                className="flex items-center space-x-2 px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
              >
                <span>🛒</span>
                <span>Корзина</span>
                {cart.length > 0 && (
                  <span className="border border-black text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: `${designTokens.spacing[6]} ${designTokens.spacing[6]}` }}>
        <div style={{ maxWidth: '1614px', margin: '0 auto' }}>
          <div className="flex gap-8">
            {/* Левая колонка - выбор моделей */}
            <div style={{ flex: '0 0 795px', maxWidth: '795px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[8] }}>
                {/* Заголовок "Стили" и кнопки выбора в одну строку */}
                <div className="flex items-center gap-4">
                  <h2 
                    style={{
                      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                      fontSize: designTokens.typography.fontSize['3xl'],
                      fontWeight: designTokens.typography.fontWeight.medium,
                      lineHeight: designTokens.typography.lineHeight.tight,
                      color: designTokens.colors.gray[800],
                      letterSpacing: '-0.02em',
                      margin: 0,
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Стили
                  </h2>
                  {/* Кнопки выбора стилей */}
                  <div className="flex gap-2">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.name)}
                        className="group relative transition-all duration-200"
                        style={{
                          borderRadius: 0,
                          border: 'none',
                          backgroundColor: selectedStyle === style.name 
                            ? designTokens.colors.black[950] 
                            : designTokens.colors.gray[100],
                          color: selectedStyle === style.name 
                            ? '#FFFFFF' 
                            : designTokens.colors.gray[900],
                          padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
                          fontSize: designTokens.typography.fontSize.sm,
                          fontWeight: designTokens.typography.fontWeight.medium,
                          cursor: 'pointer',
                          boxShadow: selectedStyle === style.name 
                            ? designTokens.boxShadow.md 
                            : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStyle !== style.name) {
                            e.currentTarget.style.backgroundColor = designTokens.colors.gray[200];
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStyle !== style.name) {
                            e.currentTarget.style.backgroundColor = designTokens.colors.gray[100];
                          }
                            }}
                          >
                            {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Заголовок "Модели" */}
                <div>
                  <h2 
                    style={{
                      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                      fontSize: designTokens.typography.fontSize['3xl'],
                      fontWeight: designTokens.typography.fontWeight.medium,
                      lineHeight: designTokens.typography.lineHeight.tight,
                      color: designTokens.colors.gray[800],
                      letterSpacing: '-0.02em',
                      margin: `0 0 ${designTokens.spacing[5]} 0`,
                      textAlign: 'left'
                    }}
                  >
                    Модели
                  </h2>

                  {/* Табы */}
                  <div 
                    className="flex gap-6 mb-5 overflow-x-auto pb-1"
                    style={{
                      borderBottom: `2px solid ${designTokens.colors.gray[200]}`
                    }}
                  >
                    <button
                      onClick={() => setActiveTab('полотно')}
                      className="pb-3 px-2 font-semibold transition-all duration-200 whitespace-nowrap relative"
                      style={{ 
                        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                        fontSize: designTokens.typography.fontSize.xs,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        letterSpacing: '0.02em',
                        color: activeTab === 'полотно' 
                          ? designTokens.colors.gray[900] 
                          : designTokens.colors.gray[500]
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'полотно') {
                          e.currentTarget.style.color = designTokens.colors.gray[700];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'полотно') {
                          e.currentTarget.style.color = designTokens.colors.gray[500];
                        }
                      }}
                    >
                      ПОЛОТНО
                      {activeTab === 'полотно' && (
                        <div 
                          className="absolute bottom-0 left-0 right-0 rounded-full"
                          style={{
                            height: '2px',
                            backgroundColor: designTokens.colors.black[950],
                            animation: 'slideInFromLeft 0.2s ease-out'
                          }}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('покрытие')}
                      className={`pb-3 px-2 font-semibold transition-all duration-300 whitespace-nowrap relative ${
                        activeTab === 'покрытие'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.3px'
                      }}
                    >
                      ПОКРЫТИЕ И ЦВЕТ
                      {activeTab === 'покрытие' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full animate-in slide-in-from-left duration-300" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('фурнитура')}
                      className={`pb-3 px-2 font-semibold transition-all duration-300 whitespace-nowrap relative ${
                        activeTab === 'фурнитура'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.3px'
                      }}
                    >
                      ФУРНИТУРА
                      {activeTab === 'фурнитура' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full animate-in slide-in-from-left duration-300" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('наличники')}
                      className={`pb-3 px-2 font-semibold transition-all duration-300 whitespace-nowrap relative ${
                        activeTab === 'наличники'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.3px'
                      }}
                    >
                      НАЛИЧНИКИ
                      {activeTab === 'наличники' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full animate-in slide-in-from-left duration-300" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('доп-опции')}
                      className={`pb-3 px-2 font-semibold transition-all duration-300 whitespace-nowrap relative ${
                        activeTab === 'доп-опции'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '13px',
                        fontWeight: 600,
                        letterSpacing: '0.3px'
                      }}
                    >
                      ДОП ОПЦИИ
                      {activeTab === 'доп-опции' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full animate-in slide-in-from-left duration-300" />
                      )}
                    </button>
                  </div>

                  {/* Сетка моделей */}
                  {activeTab === 'полотно' && (
                    <div className="space-y-5">
                      {/* Модели */}
                      <div className="grid grid-cols-4 gap-2">
                        {dataLoading ? (
                          <div className="col-span-5 text-center py-8 text-gray-500">Загрузка моделей...</div>
                        ) : filteredModels.length === 0 ? (
                          <div className="col-span-5 text-center py-8 text-gray-500">Модели не найдены</div>
                        ) : (
                          filteredModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModelId(model.id);
                                setSelectedModel(model.model_name);
                              }}
                              className={`group relative overflow-hidden transition-all duration-300 ${
                                selectedModelId === model.id
                                  ? 'shadow-lg scale-105'
                                  : 'border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-102'
                              }`}
                            >
                              {/* Миниатюра модели — бокс по контуру фото */}
                              <div className="bg-gray-100 relative overflow-hidden min-h-[60px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  loading="lazy"
                                  src={getImageSrcWithPlaceholder(model.photo, createPlaceholderSvgDataUrl(400, 800, '#E2E8F0', '#4A5568', formatModelNameForCard(model.model_name || model.id)))}
                                  alt={formatModelNameForCard(model.model_name || model.id)}
                                  className="w-full h-auto block bg-white"
                                  onError={(e) => {
                                    const placeholder = createPlaceholderSvgDataUrl(400, 800, '#E2E8F0', '#4A5568', formatModelNameForCard(model.model_name || model.id));
                                    if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder;
                                  }}
                                />
                              </div>
                              {/* Код модели Domeo (Web) */}
                              <div style={{ padding: '8px', background: 'white', textAlign: 'center' }}>
                                <div 
                                  className="font-medium text-gray-900"
                                  style={{ fontSize: '12px' }}
                                  title={model.model_name}
                                >
                                  {formatModelNameForCard(model.model_name || model.id)}
                                </div>
                              </div>
                              {/* Галочка при выборе */}
                              {selectedModelId === model.id && (
                                <div className="absolute top-2 right-2 z-10 animate-in zoom-in duration-300">
                                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Размеры */}
                      <div>
                        <h3 
                          className="mb-3 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          РАЗМЕРЫ
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Ширина */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ширина (мм)</label>
                            <div className="flex gap-2 flex-wrap">
                              {widthOptions.map((w) => (
                                <button
                                  key={w}
                                  onClick={() => setWidth(w)}
                                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                                    width === w
                                      ? 'bg-gray-900 text-white shadow-md scale-105'
                                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500 hover:shadow-sm'
                                  }`}
                                  style={{ fontSize: '13px' }}
                                >
                                  {w}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Высота */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Высота (мм)</label>
                            <div className="flex gap-2 flex-wrap">
                              {heightOptions.map((h) => (
                                <button
                                  key={h.value}
                                  onClick={() => setHeight(h.value)}
                                  className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                                    height === h.value
                                      ? 'bg-gray-900 text-white shadow-md scale-105'
                                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500 hover:shadow-sm'
                                  }`}
                                  style={{ fontSize: '13px' }}
                                >
                                  {h.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Реверсные двери */}
                      <div>
                        <h3 
                          className="mb-3 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          РЕВЕРСНЫЕ ДВЕРИ
                        </h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setReversible(false)}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                              !reversible
                                ? 'bg-gray-900 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500 hover:shadow-sm'
                            }`}
                            style={{ fontSize: '13px' }}
                          >
                            Нет
                          </button>
                          <button
                            type="button"
                            disabled={!modelOptionsData.revers_available}
                            onClick={() => modelOptionsData.revers_available && setReversible(true)}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                              !modelOptionsData.revers_available
                                ? 'bg-gray-200 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                                : reversible
                                  ? 'bg-gray-900 text-white shadow-md scale-105'
                                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500 hover:shadow-sm'
                            }`}
                            style={{ fontSize: '13px' }}
                            title={!modelOptionsData.revers_available ? 'Реверс недоступен для выбранной модели' : undefined}
                          >
                            Да
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 font-medium">Дверь со скрытым коробом, открывается внутрь</p>
                      </div>

                      {/* Наполнение (из листа «Опции», название наполнения) */}
                      {availableFillings.length > 0 && (
                      <div>
                        <h3 className="mb-3 font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 600, color: '#3D3A3A' }}>
                          НАПОЛНЕНИЕ
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedFilling(null)}
                            className={`rounded border px-3 py-2 text-sm font-medium transition ${!selectedFilling ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                          >
                            Все
                          </button>
                          {availableFillings.map((name) => (
                            <button
                              key={name}
                              onClick={() => setSelectedFilling(name)}
                              className={`rounded border px-3 py-2 text-sm font-medium transition ${selectedFilling === name ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  )}

                  {/* Вкладка "ПОКРЫТИЕ И ЦВЕТ" */}
                  {activeTab === 'покрытие' && (
                    <div className="space-y-5">
                      {/* Выбор типа покрытия */}
                      <div>
                        <h3 
                          className="mb-3 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#3D3A3A',
                            letterSpacing: '0.3px'
                          }}
                        >
                          ПОКРЫТИЕ
                        </h3>
                        <div className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            {(cascadeFinishes.length ? cascadeFinishes : ['ПЭТ', 'ПВХ', 'Шпон', 'Эмаль']).map((finishType) => (
                              <button
                                key={finishType}
                                onClick={() => {
                                  setSelectedFinish(finishType);
                                  if (finishType === 'Шпон') {
                                    setSelectedColor(null);
                                    setSelectedWood(null);
                                    setSelectedCoatingId(null);
                                  } else {
                                    setSelectedWood(null);
                                    setSelectedCoatingId(null);
                                    if (!selectedColor) setSelectedColor('Белый');
                                  }
                                }}
                                className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded font-semibold transition-all duration-300 ${
                                  selectedFinish === finishType
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                                style={{ 
                                  fontFamily: 'Roboto, sans-serif',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  letterSpacing: '0.2px',
                                  minWidth: '80px'
                                }}
                              >
                                {selectedFinish === finishType && (
                                  <div className="flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                <span>{finishType}</span>
                              </button>
                            ))}
                          </div>
                          {/* Описание выбранного типа покрытия */}
                          <div className="text-sm text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
                            {getCoatingDescription()}
                          </div>
                        </div>
                      </div>

                      {/* Монохромная палитра (для ПЭТ, ПВХ и Эмаль) */}
                      {selectedFinish && ['ПЭТ', 'ПВХ', 'Эмаль'].includes(selectedFinish) && (
                        <div>
                          <h3 
                            className="mb-4 font-semibold"
                            style={{
                              fontFamily: 'Roboto, sans-serif',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#3D3A3A'
                            }}
                          >
                            МОНОХРОМНАЯ ПАЛИТРА
                          </h3>
                          <div className="grid grid-cols-4 gap-2">
                            {monochromeColors.map((color) => (
                              <button
                                key={color.id}
                                onClick={() => {
                                  setSelectedCoatingId(color.id);
                                  setSelectedColor(color.name);
                                  setSelectedWood(null);
                                }}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 ${
                                  selectedCoatingId === color.id
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md scale-105'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102'
                                }`}
                              >
                                {/* Миниатюра — бокс по контуру фото */}
                                <div className="relative w-full min-h-[60px]">
                                  {getImageSrc(color.photo_path) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      loading="lazy"
                                      src={getImageSrc(color.photo_path)}
                                      alt={color.name}
                                      className="w-full h-auto block bg-white"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement | null;
                                        if (fallback) fallback.style.display = 'block';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-full min-h-[60px]"
                                    style={{
                                      display: getImageSrc(color.photo_path) ? 'none' : 'block',
                                      backgroundColor: color.color,
                                      border: color.color === '#FFFFFF' ? '1px solid #E5E5E5' : 'none',
                                    }}
                                  />
                                  {/* Галочка при выборе */}
                                  {selectedCoatingId === color.id && (
                                    <div className="absolute top-2 right-2 z-10 animate-in zoom-in duration-300">
                                      <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Название цвета */}
                                <div style={{ padding: '8px', background: 'white', textAlign: 'center' }}>
                                  <div 
                                    className="font-medium text-gray-900"
                                    style={{ fontSize: '12px' }}
                                    title={color.name}
                                  >
                                    {color.name}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Древесная палитра (для Шпон) */}
                      {selectedFinish === 'Шпон' && (
                        <div>
                          <h3 
                            className="mb-4 font-semibold"
                            style={{
                              fontFamily: 'Roboto, sans-serif',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#3D3A3A'
                            }}
                          >
                            ДРЕВЕСНАЯ ПАЛИТРА
                          </h3>
                          <div className="grid grid-cols-4 gap-2">
                            {woodOptions.map((wood) => (
                              <button
                                key={wood.id}
                                onClick={() => {
                                  setSelectedCoatingId(wood.id);
                                  setSelectedWood(wood.name);
                                  setSelectedColor(null);
                                }}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 ${
                                  selectedWood === wood.name
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md scale-105'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102'
                                }`}
                              >
                                {/* Миниатюра дерева — бокс по контуру фото */}
                                <div className="relative w-full min-h-[60px]">
                                  <img
                                    loading="lazy"
                                    src={getImageSrcWithPlaceholder(wood.photo_path, createPlaceholderSvgDataUrl(400, 400, '#8B7355', '#FFFFFF', wood.name))}
                                    alt={wood.name}
                                    className="w-full h-auto block bg-white"
                                  />
                                  {/* Галочка при выборе */}
                                  {selectedWood === wood.name && (
                                    <div className="absolute top-2 right-2 z-10 animate-in zoom-in duration-300">
                                      <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                  </div>
                                    </div>
                                  )}
                                </div>
                                {/* Название */}
                                <div style={{ padding: '8px', background: 'white', textAlign: 'center' }}>
                                  <div 
                                    className="font-medium text-gray-900"
                                    style={{ fontSize: '12px' }}
                                    title={wood.name}
                                  >
                                    {wood.name}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Алюминиевая кромка */}
                      <div>
                        <h3 
                          className="mb-4 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          АЛЮМИНИЕВАЯ КРОМКА
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {edgeOptions.map((edge) => (
                            <button
                              key={edge.id}
                              onClick={() => setSelectedEdgeId(edge.id === 'none' ? null : edge.id)}
                              className={`group relative overflow-hidden rounded border transition-all duration-300 ${
                                selectedEdgeId === edge.id || (edge.id === 'none' && !selectedEdgeId)
                                  ? 'border-gray-900 ring-1 ring-gray-100 shadow-md scale-105'
                                  : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102'
                              }`}
                            >
                              {/* Изображение кромки — бокс по контуру фото */}
                              <div className="bg-gray-100 relative overflow-hidden min-h-[48px]">
                                {getImageSrc(edge.photo_path) ? (
                                  <img
                                    loading="lazy"
                                    src={getImageSrc(edge.photo_path)}
                                    alt={edge.name}
                                    className="w-full h-auto block bg-white"
                                    onError={(e) => {
                                      // Fallback на цвет, если изображение не загрузилось
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.style.backgroundColor = (edge as any).color || '#E5E5E5';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full min-h-[48px] flex items-center justify-center bg-gray-100">
                                    {edge.id === 'none' && (
                                      <div className="text-gray-400 text-xs">—</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Название кромки и наценка */}
                              <div style={{ padding: '4px', background: 'white', textAlign: 'center' }}>
                                <div 
                                  className="font-medium text-gray-900"
                                  style={{ fontSize: '12px', lineHeight: '1.3' }}
                                >
                                  {edge.name}
                                </div>
                                {(edge.surcharge != null && edge.surcharge > 0) && (
                                  <div className="text-green-600 font-medium" style={{ fontSize: '11px' }}>
                                    +{(edge.surcharge as number).toLocaleString('ru-RU')} Р
                                  </div>
                                )}
                              </div>
                              {/* Галочка при выборе */}
                              {(selectedEdgeId === edge.id || (edge.id === 'none' && !selectedEdgeId)) && (
                                <div className="absolute top-0.5 right-0.5 z-10 animate-in zoom-in duration-300">
                                  <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <svg className="w-2 h-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Цвет стекла (данные из Стекло_доступность; на цену не влияет) */}
                      {(selectedModelData?.glassColors?.length ?? 0) > 0 && (
                        <div>
                          <h3 className="mb-4 font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 600, color: '#3D3A3A' }}>
                            ЦВЕТ СТЕКЛА
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(selectedModelData.glassColors || []).map((colorName) => (
                              <button
                                key={colorName}
                                onClick={() => setSelectedGlassColor(selectedGlassColor === colorName ? null : colorName)}
                                className={`rounded border px-3 py-2 text-sm font-medium transition ${
                                  selectedGlassColor === colorName ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:border-gray-400'
                                }`}
                              >
                                {colorName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Вкладка "ФУРНИТУРА" */}
                  {activeTab === 'фурнитура' && (
                    <div className="space-y-5">
                      {/* Комплект фурнитуры */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                        <h3 
                            className="font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#3D3A3A',
                            letterSpacing: '0.3px'
                          }}
                        >
                          КОМПЛЕКТ ФУРНИТУРЫ
                        </h3>
                          <div className="relative group">
                            <Info 
                              className="w-4 h-4 text-gray-500 cursor-help" 
                              style={{ strokeWidth: 2 }}
                            />
                            {/* Tooltip с информацией */}
                            <div className="absolute left-0 top-6 w-64 p-3 bg-white border border-gray-200 shadow-lg rounded z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="space-y-2" style={{ fontSize: '18px', lineHeight: '1.7', color: '#666666' }}>
                                <div>Цвет: в тон кромки полотна или выбранной ручки.</div>
                                <div>
                                  *При высоте двери 2300мм и выше могут быть добавлены дополнительные петли*
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(configKits || []).map((kit) => (
                            <button
                              key={kit.id}
                              onClick={() => setSelectedHardwareKit(selectedHardwareKit === kit.id ? null : kit.id)}
                              className={`group relative overflow-hidden border transition-all duration-300 p-3 text-left`}
                              style={{
                                borderRadius: 0,
                                border: selectedHardwareKit === kit.id 
                                  ? '2px solid #000000' 
                                  : '1px solid #E5E7EB',
                                boxShadow: selectedHardwareKit === kit.id 
                                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                                  : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                backgroundColor: '#FFFFFF',
                                transform: selectedHardwareKit === kit.id ? 'scale(1.02)' : 'scale(1)'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedHardwareKit !== kit.id) {
                                  e.currentTarget.style.borderColor = '#9CA3AF';
                                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1.01)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedHardwareKit !== kit.id) {
                                  e.currentTarget.style.borderColor = '#E5E7EB';
                                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              <div 
                                className="font-bold mb-2"
                                style={{
                                  fontSize: '18px',
                                  color: '#000000',
                                  padding: '8px 0',
                                  display: 'inline-block',
                                  marginBottom: '12px'
                                }}
                              >
                                {kit.name}
                              </div>
                              <div 
                                className="mt-4 font-semibold"
                                style={{ fontSize: '18px', color: '#000000' }}
                              >
                                {kit.price ? `${Number(kit.price).toLocaleString('ru-RU')} Р` : '—'}
                              </div>
                                {selectedHardwareKit === kit.id && (
                                <div className="absolute top-2 right-2 animate-in zoom-in duration-300">
                                  <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Ручка */}
                      <div style={{ 
                        padding: designTokens.spacing[5],
                        backgroundColor: designTokens.colors.gray[50],
                        borderRadius: designTokens.borderRadius.lg,
                        border: `1px solid ${designTokens.colors.gray[200]}`
                      }}>
                        <div className="flex gap-6 items-start">
                          {/* Ручка */}
                          <div className="flex-1">
                            <h3 
                              className="mb-4 font-semibold"
                              style={{
                                fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                                fontSize: designTokens.typography.fontSize.base,
                                fontWeight: designTokens.typography.fontWeight.semibold,
                                color: designTokens.colors.gray[900],
                                letterSpacing: '0.01em'
                              }}
                            >
                              РУЧКА
                            </h3>
                            <div className="flex flex-col gap-3">
                                <button
                                onClick={() => setShowHandleModal(true)}
                                className="border border-gray-300 text-gray-900 rounded overflow-hidden flex items-center justify-center hover:border-gray-400 bg-white"
                                    style={{ 
                                  width: '230px',
                                  height: '230px',
                                  fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                                  fontSize: designTokens.typography.fontSize.sm,
                                }}
                              >
                                {selectedHandleIdObj && selectedHandleIdObj.name ? (
                                  <img
                                    src={getHandleImageSrc((selectedHandleIdObj as any).photos?.[0] || selectedHandleIdObj.photo_path, selectedHandleIdObj.name)}
                                    alt={selectedHandleIdObj.name}
                                    className="w-full h-full object-contain"
                                    style={{ transform: 'scaleX(-1)' }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      
                                      // Пробуем альтернативные варианты имени файла
                                      if (!target.dataset.alternativeTried && selectedHandleIdObj) {
                                        target.dataset.alternativeTried = 'true';
                                        // Пробуем разные варианты нормализации
                                        const currentSrc = target.src.replace(window.location.origin, '');
                                        const handleObj = selectedHandleIdObj as any;
                                        const alternatives = [
                                          selectedHandleIdObj.name?.trim().replace(/\s+/g, '_'),  // С подчеркиваниями (PANTS_BL)
                                          selectedHandleIdObj.name?.trim().replace(/\s+BL$/, ' _BL'),  // С пробелом перед подчеркиванием для BL (PANTS _BL)
                                          selectedHandleIdObj.name?.trim().replace(/\s+/g, ''),    // Без пробелов
                                          handleObj.factoryName?.trim().replace(/\s+/g, '_'),
                                          handleObj.factoryName?.trim().replace(/\s+BL$/, ' _BL'),
                                          handleObj.factoryName?.trim(),
                                          handleObj.article?.trim()
                                        ].filter(Boolean);
                                        
                                        for (const alt of alternatives) {
                                          if (alt) {
                                            const mockupUrl = `/data/mockups/ruchki/${alt}.png`;
                                            if (currentSrc !== mockupUrl) {
                                              console.log('🔄 Пробуем альтернативный путь:', mockupUrl);
                                              target.src = mockupUrl;
                                              return;
                                            }
                                          }
                                        }
                                      }
                                      
                                      // Если и fallback не сработал, показываем placeholder
                                      const handleObj = selectedHandleIdObj as any;
                                      console.error('❌ Не удалось загрузить изображение ручки:', {
                                        name: selectedHandleIdObj?.name,
                                        factoryName: handleObj?.factoryName,
                                        article: handleObj?.article,
                                        attemptedSrc: target.src
                                      });
                                      target.style.display = 'none';
                                      const placeholder = target.nextElementSibling as HTMLElement;
                                      if (placeholder) {
                                        placeholder.style.display = 'flex';
                                      }
                                    }}
                                    onLoad={(e) => {
                                      // Успешная загрузка - скрываем placeholder
                                      const img = e.target as HTMLImageElement;
                                      const placeholder = img.nextElementSibling as HTMLElement;
                                      if (placeholder) {
                                        placeholder.style.display = 'none';
                                      }
                                    }}
                                  />
                                ) : null}
                                {!selectedHandleIdObj && (
                                  <span className="text-gray-400 text-xs text-center px-2">Выберите</span>
                                )}
                                <div 
                                  className="hidden w-full h-full items-center justify-center text-gray-400 text-xs"
                                  style={{ display: 'none' }}
                                >
                                  <span>?</span>
                                </div>
                              </button>
                              {selectedHandleIdObj && (
                                <div className="flex flex-row items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {selectedHandleIdObj.name}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {(selectedHandleIdObj.price_rrc || selectedHandleIdObj.price_opt || 0).toLocaleString('ru-RU')} ₽
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Завертка */}
                          <div className="flex-1">
                            <h3 
                              className="mb-4 font-semibold"
                              style={{
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#3D3A3A'
                              }}
                            >
                              ЗАВЕРТКА
                            </h3>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setHasLock(false)}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 px-6 py-3 ${
                                  hasLock === false
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-gray-900 text-white'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 bg-white text-gray-900'
                                }`}
                              >
                                <div className="font-medium" style={{ fontSize: '14px' }}>
                                  Нет
                                </div>
                                {hasLock === false && (
                                  <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                    <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                      <svg className="w-2 h-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => setHasLock(true)}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 px-6 py-3 ${
                                  hasLock === true
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-gray-900 text-white'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 bg-white text-gray-900'
                                }`}
                              >
                                <div className="font-medium" style={{ fontSize: '14px' }}>
                                  Да
                                </div>
                                {hasLock === true && (
                                  <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                    <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                      <svg className="w-2 h-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Вкладка "НАЛИЧНИКИ" */}
                  {activeTab === 'наличники' && (
                    <div>
                      <h3 
                        className="mb-4 font-semibold"
                        style={{
                          fontFamily: 'Roboto, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#3D3A3A'
                        }}
                      >
                        НАЛИЧНИК
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {architraveOptions.map((architrave) => (
                          <button
                            key={architrave.id}
                            onClick={() => setSelectedArchitraveId(architrave.id)}
                            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                              selectedArchitraveId === architrave.id
                                ? 'border-gray-900 ring-2 ring-gray-100 shadow-lg scale-105'
                                : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-102'
                            }`}
                          >
                            {/* Миниатюра наличника — бокс по контуру фото */}
                            <div className="bg-gray-100 relative overflow-hidden min-h-[48px]">
                              <img
                                loading="lazy"
                                src={getImageSrcWithPlaceholder((architrave as { photo_path?: string | null }).photo_path, createPlaceholderSvgDataUrl(300, 300, '#E2E8F0', '#1A202C', (architrave as { name: string }).name))}
                                alt={architrave.name}
                                className="w-full h-auto block bg-white"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              {!getImageSrc((architrave as { photo_path?: string | null }).photo_path) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 pointer-events-none">
                                  <span className="text-gray-400 text-2xl">🚪</span>
                                </div>
                              )}
                            </div>
                            {/* Название наличника */}
                            <div style={{ padding: '8px', background: 'white', textAlign: 'center' }}>
                              <div 
                                className="font-medium text-gray-900"
                                style={{ fontSize: '12px' }}
                              >
                                {architrave.name}
                              </div>
                            </div>
                            {/* Галочка при выборе */}
                            {selectedArchitraveId === architrave.id && (
                              <div className="absolute top-2 right-2 z-10 animate-in zoom-in duration-300">
                                <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Вкладка "ДОП ОПЦИИ" */}
                  {activeTab === 'доп-опции' && (
                    <div className="space-y-5">
                      {/* Ограничители */}
                      <div>
                        <h3 
                          className="mb-4 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          ОГРАНИЧИТЕЛИ
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {stopperOptions.map((stopper) => (
                            <button
                              key={stopper.id}
                              onClick={() => {
                                setSelectedStopperId(stopper.id);
                                if (stopper.id === 'none') {
                                  setSelectedStopperIdColor(null);
                                }
                              }}
                              className={`group relative overflow-hidden rounded border transition-all duration-300 p-2 ${
                                selectedStopperId === stopper.id
                                  ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-white scale-105'
                                  : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102 bg-white'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1.5">
                                {stopper.id !== 'none' && (
                                  <div className="bg-gray-100 relative overflow-hidden rounded min-h-[48px] w-full flex-shrink-0">
                                    <img
                                      loading="lazy"
                                      src={getImageSrcWithPlaceholder(stopper.photo_path, createPlaceholderSvgDataUrl(200, 200, '#1A202C', '#FFFFFF', stopper.name))}
                                      alt={stopper.name}
                                      className="w-full h-auto block bg-white"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="text-center">
                                  <div 
                                    className="font-medium text-gray-900 mb-0.5"
                                    style={{ fontSize: '11px', lineHeight: '1.2' }}
                                  >
                                    {stopper.name}
                                  </div>
                                  {stopper.price && (
                                    <div 
                                      className="text-gray-600"
                                      style={{ fontSize: '9px' }}
                                    >
                                      {stopper.price} Р
                                    </div>
                                  )}
                                </div>
                                {/* Цвета ограничителя - кружочки под фото */}
                                {stopper.id !== 'none' && (
                                  <div className="flex gap-1 justify-center items-center mt-1">
                              {stopperColors.map((color) => (
                                <div
                                  key={color.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedStopperIdColor(color.id);
                                        }}
                                        className={`rounded-full transition-all duration-200 ${
                                          selectedStopperId === stopper.id && selectedStopperColor === color.id
                                            ? 'ring-2 ring-gray-900 scale-110'
                                            : 'ring-1 ring-gray-300 hover:ring-gray-400'
                                        }`}
                                    style={{ 
                                          width: '16px',
                                          height: '16px',
                                      backgroundColor: color.color,
                                          border: color.color === '#FFFFFF' ? '1px solid #E5E5E5' : 'none',
                                          cursor: 'pointer'
                                        }}
                                        title={color.name}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedStopperIdColor(color.id);
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                                {selectedStopperId === stopper.id && (
                                  <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm animate-in zoom-in duration-300">
                                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>

                      </div>

                      {/* Зеркало */}
                      <div>
                        <h3 
                          className="mb-4 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          ЗЕРКАЛО
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {mirrorOptions.map((mirror) => (
                            <button
                              key={mirror.id}
                              onClick={() => setSelectedMirrorId(mirror.id as 'none' | 'one' | 'both')}
                              className={`group relative overflow-hidden rounded border transition-all duration-300 p-2 ${
                                selectedMirrorId === mirror.id
                                  ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-white scale-105'
                                  : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102 bg-white'
                              }`}
                            >
                              <div className="text-center">
                                <div 
                                  className="font-medium text-gray-900 mb-1"
                                  style={{ fontSize: '12px', lineHeight: '1.3' }}
                                >
                                  {mirror.name}
                                </div>
                                {mirror.price && (
                                  <div 
                                    className="text-gray-600"
                                    style={{ fontSize: '10px' }}
                                  >
                                    {mirror.price} Р
                                  </div>
                                )}
                                {selectedMirrorId === mirror.id && (
                                  <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                    <div className="w-3.5 h-3.5 bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Порог */}
                      <div>
                        <h3 
                          className="mb-4 font-semibold"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#3D3A3A'
                          }}
                        >
                          ПОРОГ
                        </h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setSelectedThresholdId(null)}
                            className={`group relative overflow-hidden rounded border transition-all duration-300 px-6 py-3 ${
                              !selectedThresholdId
                                ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-gray-900 text-white'
                                : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 bg-white text-gray-900'
                            }`}
                          >
                            <div className="font-medium" style={{ fontSize: '14px' }}>
                              Нет
                            </div>
                            {!selectedThresholdId && (
                              <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <svg className="w-2 h-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              // Находим первую опцию порога
                              const thresholdOpt = thresholdOptions.find(o => o.option_type === 'порог');
                              setSelectedThresholdId(thresholdOpt?.id || null);
                            }}
                            className={`group relative overflow-hidden rounded border transition-all duration-300 px-6 py-3 ${
                              selectedThresholdId
                                ? 'border-gray-900 ring-1 ring-gray-100 shadow-md bg-gray-900 text-white'
                                : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 bg-white text-gray-900'
                            }`}
                          >
                            <div className="font-medium" style={{ fontSize: '14px' }}>
                              Да
                            </div>
                            {selectedThresholdId && (
                              <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                                <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <svg className="w-2 h-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Правая колонка - превью и параметры */}
            <div style={{ flex: '1', display: 'flex', gap: '24px' }}>
              {/* Большое превью — бокс по контуру фото */}
              <div style={{ flex: '0 0 338px' }}>
                <div className="sticky" style={{ top: '32px' }}>
                  <div 
                    className="overflow-hidden border-2 border-gray-200 shadow-2xl bg-white transition-all duration-300 hover:shadow-3xl relative min-h-[200px]"
                    style={{ width: '338px' }}
                  >
                    {(() => {
                      const coatingPhoto = selectedCoatingId ? coatings.find(c => c.id === selectedCoatingId)?.photo_path : null;
                      const previewSrc = getImageSrc(coatingPhoto) || getImageSrc(selectedModelData?.photo);
                      const previewPlaceholder = createPlaceholderSvgDataUrl(338, 676, '#E2E8F0', '#4A5568', selectedModel || 'Выберите модель');
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewSrc || previewPlaceholder}
                          alt={selectedModel || 'Модель двери'}
                          className="w-full h-auto block bg-white cursor-zoom-in"
                          onClick={() => {
                            if (previewSrc) {
                              setZoomPreviewSrc(previewSrc);
                              setZoomPreviewAlt(selectedModel || 'Модель двери');
                            }
                          }}
                          onError={(e) => {
                            if (e.currentTarget.src !== previewPlaceholder) e.currentTarget.src = previewPlaceholder;
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Параметры и цена - справа от превью */}
              <div style={{ flex: '1', maxWidth: '400px' }}>
                <div className="sticky" style={{ top: '32px' }}>
                  {/* Заголовок "Спецификация" */}
                  <h3 
                    className="mb-4 font-semibold"
                    style={{
                      fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                      fontSize: designTokens.typography.fontSize.xl,
                      fontWeight: designTokens.typography.fontWeight.semibold,
                      color: designTokens.colors.gray[800],
                      letterSpacing: '-0.01em'
                    }}
                  >
                    Спецификация
                  </h3>

                  {/* Список спецификации */}
                  <div 
                    className="space-y-1 mb-5 rounded-lg p-4"
                    style={{
                      backgroundColor: designTokens.colors.gray[50],
                      border: `1px solid ${designTokens.colors.gray[200]}`,
                      borderRadius: designTokens.borderRadius.lg,
                      boxShadow: designTokens.boxShadow.sm
                    }}
                  >
                    <div 
                      className="pb-2"
                      style={{
                        borderBottom: `1px solid ${designTokens.colors.gray[200]}`,
                        paddingBottom: designTokens.spacing[2]
                      }}
                    >
                      <span 
                        className="font-medium"
                        style={{ 
                          fontSize: designTokens.typography.fontSize.xs,
                          color: designTokens.colors.gray[600],
                          letterSpacing: '0.01em'
                        }}
                      >
                        Стиль:{' '}
                      </span>
                      <span 
                        className="font-semibold"
                        style={{ 
                          fontSize: designTokens.typography.fontSize.sm,
                          color: designTokens.colors.gray[900]
                        }}
                      >
                        {selectedStyle}
                      </span>
                    </div>
                    {[
                      { label: 'Полотно', value: selectedModel },
                      { label: 'Размеры', value: `${width} × ${height} мм` },
                      { label: 'Реверсные двери', value: reversible ? 'Да' : 'Нет' },
                      { label: 'Наполнение', value: selectedFilling || getFillingText() },
                      { label: 'Покрытие и цвет', value: getCoatingText() },
                      { label: 'Алюминиевая кромка', value: getEdgeText() },
                      { label: 'Цвет стекла', value: selectedGlassColor ?? ((selectedModelData?.glassColors?.length ?? 0) > 0 ? 'Не выбран' : '—') },
                      { label: 'Комплект фурнитуры', value: getHardwareKitText() },
                      { label: 'Ручка', value: getHandleText() },
                      { label: 'Наличник', value: (selectedArchitraveId ? architraveOptions.find(a => a.id === selectedArchitraveId)?.name : null) || 'Не выбран' },
                      { label: 'Ограничитель', value: getStopperText() },
                      { label: 'Зеркало', value: getMirrorText() },
                      { label: 'Порог', value: getThresholdText() },
                    ].map((item, index, array) => (
                      <div 
                        key={item.label}
                        className={index < array.length - 1 ? 'pb-2' : ''}
                        style={{
                          borderBottom: index < array.length - 1 ? `1px solid ${designTokens.colors.gray[200]}` : 'none',
                          paddingBottom: index < array.length - 1 ? designTokens.spacing[2] : 0
                        }}
                      >
                        <span 
                          className="font-medium"
                          style={{ 
                            fontSize: designTokens.typography.fontSize.xs,
                            color: designTokens.colors.gray[600],
                            letterSpacing: '0.01em'
                          }}
                        >
                          {item.label}:{' '}
                        </span>
                        <span 
                          className="font-semibold"
                          style={{ 
                            fontSize: designTokens.typography.fontSize.sm,
                            color: designTokens.colors.gray[900]
                          }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Цена */}
                  <div 
                    className="mb-3 rounded-lg p-5"
                    style={{
                      background: `linear-gradient(135deg, ${designTokens.colors.gray[50]} 0%, #FFFFFF 100%)`,
                      border: `2px solid ${designTokens.colors.gray[200]}`,
                      borderRadius: designTokens.borderRadius.lg,
                      boxShadow: designTokens.boxShadow.md
                    }}
                  >
                    <h4 
                      className="mb-3 font-semibold"
                      style={{
                        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                        fontSize: designTokens.typography.fontSize.xs,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        color: designTokens.colors.gray[600],
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Цена комплекта
                    </h4>
                    <div 
                      className="font-bold"
                      style={{
                        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                        fontSize: '32px',
                        fontWeight: designTokens.typography.fontWeight.bold,
                        color: designTokens.colors.gray[900],
                        letterSpacing: '-0.03em',
                        lineHeight: designTokens.typography.lineHeight.tight
                      }}
                    >
                      {price}
                    </div>
                  </div>

                  {/* Кнопка "Что входит в комплект" */}
                  <div className="mb-4">
                    <a 
                      href="#"
                      className="block text-blue-600 hover:text-blue-700 underline text-center"
                      style={{ 
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '12px'
                      }}
                    >
                      Что входит в комплект?
                    </a>
                  </div>

                  {/* Кнопка "В корзину" */}
                  <div className="mb-4">
                    <button 
                      onClick={addToCart}
                      disabled={!canCalculatePrice || !priceData}
                      className="w-full font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ 
                        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                        fontSize: designTokens.typography.fontSize.sm,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        letterSpacing: '0.01em',
                        padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
                        backgroundColor: (!canCalculatePrice || !priceData) ? designTokens.colors.gray[400] : designTokens.colors.black[950],
                        color: '#FFFFFF',
                        borderRadius: designTokens.borderRadius.lg,
                        boxShadow: designTokens.boxShadow.md,
                        border: 'none',
                        cursor: (!canCalculatePrice || !priceData) ? 'not-allowed' : 'pointer'
                      }}
onMouseEnter={(e) => {
                          if (canCalculatePrice && priceData) {
                          e.currentTarget.style.backgroundColor = designTokens.colors.gray[800];
                          e.currentTarget.style.boxShadow = designTokens.boxShadow.lg;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (canCalculatePrice && priceData) {
                          e.currentTarget.style.backgroundColor = designTokens.colors.black[950];
                          e.currentTarget.style.boxShadow = designTokens.boxShadow.md;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      В корзину {cart.length > 0 && `(${cart.length})`}
                    </button>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setShowCartManager(true)}
                        className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Открыть корзину
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно выбора ручки */}
      {showHandleModal && (
        <HandleSelectionModal
          handles={(() => {
            // Преобразуем DoorHandle[] в Record<string, Handle[]>
            // Группируем по сериям или используем "default"
            const grouped: Record<string, any[]> = {};
            allHandles.forEach(handle => {
              const group = handle.series || 'default';
              if (!grouped[group]) {
                grouped[group] = [];
              }
              grouped[group].push({
                id: handle.id,
                name: handle.name,
                group: group,
                price: handle.price_rrc || handle.price_opt || 0,
                isBasic: false,
                showroom: true,
                supplier: (handle as any).supplier,
                article: (handle as any).article,
                factoryName: (handle as any).factoryName,
                photos: handle.photo_path ? [handle.photo_path] : []
              });
            });
            return grouped;
          })()}
          selectedHandleId={selectedHandleId || undefined}
          onSelect={(handleId) => {
            console.log('Выбрана ручка:', handleId);
            setSelectedHandleId(handleId || null);
            setShowHandleModal(false);
          }}
          onClose={() => {
            console.log('Закрытие модального окна');
            setShowHandleModal(false);
          }}
        />
      )}

      {/* Менеджер корзины */}
      {showCartManager && (
        <CartManager
          cart={cart}
          setCart={setCart}
          originalPrices={originalPrices}
          setOriginalPrices={setOriginalPrices}
          cartHistory={cartHistory}
          setCartHistory={setCartHistory}
          hardwareKits={hardwareKits}
          handles={(() => {
            const grouped: Record<string, any[]> = {};
            allHandles.forEach(handle => {
              const group = handle.series || 'default';
              if (!grouped[group]) {
                grouped[group] = [];
              }
              grouped[group].push({
                id: handle.id,
                name: handle.name,
                group: group,
                price: handle.price_rrc || handle.price_opt || 0,
                isBasic: false,
                showroom: true,
                photos: handle.photo_path ? [handle.photo_path] : [],
              });
            });
            return grouped;
          })()}
          cartManagerBasePrices={cartManagerBasePrices}
          setCartManagerBasePrices={setCartManagerBasePrices}
          showClientManager={showClientManager}
          setShowClientManager={setShowClientManager}
          generateDocument={generateDocument}
          selectedClient={selectedClient}
          selectedClientName={selectedClientName}
          setSelectedClient={setSelectedClient}
          setSelectedClientName={setSelectedClientName}
          userRole={userRole}
          onClose={() => setShowCartManager(false)}
        />
      )}

      {/* Модальное окно клиентов */}
      {showClientManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[96vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-black">Заказчики</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateClientForm(true)}
                  className="px-3 py-2 text-sm border border-black text-black hover:bg-black hover:text-white rounded transition-all duration-200"
                >
                  Новый заказчик
                </button>
                <button
                  onClick={() => setShowClientManager(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Поиск по ФИО, телефону, адресу..."
                  value={clientSearchInput}
                  onChange={(e) => setClientSearchInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {clientsLoading ? (
                    <div className="p-4 text-center text-gray-500">Загрузка клиентов...</div>
                  ) : clients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Клиенты не найдены</div>
                  ) : (
                    clients
                      .filter((c) => {
                        if (!clientSearch) return true;
                        const hay = `${c.lastName} ${c.firstName} ${c.middleName ?? ''} ${c.phone ?? ''} ${c.address ?? ''}`.toLowerCase();
                        return hay.includes(clientSearch.toLowerCase());
                      })
                      .map((client) => (
                        <div 
                          key={client.id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${selectedClient === client.id ? 'bg-blue-50 border-blue-200' : ''}`}
                          onClick={() => {
                            setSelectedClient(client.id);
                            setSelectedClientName(`${client.firstName} ${client.lastName}`);
                            setShowClientManager(false);
                          }}
                        >
                          <div className="grid items-center gap-3" style={{gridTemplateColumns: '5fr 3fr 7fr'}}>
                            <div className="font-medium truncate">
                              {client.lastName} {client.firstName}{client.middleName ? ` ${client.middleName}` : ''}
                            </div>
                            <div className="text-sm text-gray-600 truncate">{formatPhone(client.phone as any)}</div>
                            <div className="text-sm text-gray-600 overflow-hidden" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                              {client.address || '—'}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowClientManager(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания клиента */}
      {showCreateClientForm && (
        <CreateClientModal
          onClose={() => setShowCreateClientForm(false)}
          onSuccess={(client) => {
            setSelectedClient(client.id);
            setSelectedClientName(`${client.firstName} ${client.lastName}`);
            setShowCreateClientForm(false);
            setShowClientManager(false);
          }}
        />
      )}

      {zoomPreviewSrc && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 p-4 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoomPreviewSrc(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomPreviewSrc}
            alt={zoomPreviewAlt}
            className="max-w-full max-h-full object-contain"
          />
          <button
            type="button"
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 text-xl"
            onClick={() => setZoomPreviewSrc(null)}
            aria-label="Закрыть увеличенное фото"
          >
            ×
          </button>
        </div>
      )}

      </div>
    </>
  );
}

