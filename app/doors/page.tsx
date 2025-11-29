'use client';

import Link from 'next/link';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { designTokens } from '@/lib/design/tokens';
import HandleSelectionModal from '@/components/HandleSelectionModal';
import { Info } from 'lucide-react';
import { useConfiguratorData, useModelDetails, usePriceCalculation } from '@/lib/configurator/useConfiguratorData';
import type { DoorModel, DoorCoating, DoorEdge, DoorOption, DoorHandle, DoorLimiter } from '@/lib/configurator/api';
import { CartManager } from '@/components/doors';
import type { CartItem, HardwareKit } from '@/components/doors';
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
  const { models: allModels, handles: allHandles, limiters: allLimiters, loading: dataLoading, error: dataError } = useConfiguratorData();
  
  // Состояние для выбранной модели (ID из API)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  // Загружаем детали выбранной модели
  const { model: selectedModelData, coatings, edges, options, loading: modelLoading } = useModelDetails(selectedModelId);
  
  // Хук для расчета цены
  const { calculate: calculatePrice, calculating: priceCalculating, priceData } = usePriceCalculation();
  
  // Состояние для стиля
  const [selectedStyle, setSelectedStyle] = useState<string>('Современные');
  
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'полотно' | 'покрытие' | 'фурнитура' | 'наличники' | 'доп-опции'>('полотно');
  
  // Состояние для покрытия и цвета (ID из API)
  const [coatingType, setCoatingType] = useState<'пэт' | 'пвх' | 'шпон' | 'эмаль'>('пвх');
  const [selectedCoatingId, setSelectedCoatingId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedWood, setSelectedWood] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Состояние для размеров, реверса и наполнения (вкладка Полотно)
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(2000);
  const [reversible, setReversible] = useState<boolean>(false);
  const [filling, setFilling] = useState<'standard' | 'good' | 'excellent'>('good');
  
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

  // Функция для создания SVG placeholder (работает в браузере)
  const createPlaceholderSVG = (width: number, height: number, bgColor: string, textColor: string, text: string) => {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.1}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    // Используем encodeURIComponent для URL-кодирования
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Фильтруем модели по выбранному стилю
  const filteredModels = useMemo(() => {
    if (!selectedStyle) return allModels;
    return allModels.filter(m => m.style === selectedStyle);
  }, [allModels, selectedStyle]);

  // Уникальные стили из моделей
  const availableStyles = useMemo(() => {
    const styles = Array.from(new Set(allModels.map(m => m.style))).sort();
    return styles;
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

  // Варианты размеров из выбранной модели
  const widthOptions = useMemo(() => {
    if (!selectedModelData || !selectedModelData.sizes) return [600, 700, 800, 900];
    const widths = Array.from(new Set(selectedModelData.sizes.map(s => s.width))).sort();
    return widths.length > 0 ? widths : [600, 700, 800, 900];
  }, [selectedModelData]);

  const heightOptions = useMemo(() => {
    if (!selectedModelData || !selectedModelData.sizes) {
      return [
        { value: 2000, label: '2000' },
        { value: 2100, label: '2100' },
        { value: 2200, label: '2200' },
        { value: 2300, label: '2300' },
        { value: 2500, label: '2301-2700' },
        { value: 2850, label: '2701-3000' },
      ];
    }
    const heights = Array.from(new Set(selectedModelData.sizes.map(s => s.height))).sort();
    return heights.map(h => ({ value: h, label: String(h) }));
  }, [selectedModelData]);

  // Варианты наполнения
  const fillingOptions = [
    { type: 'standard' as const, name: 'Стандартное', soundInsulation: '~27 дБ', description: 'Для коридоров, кладовых' },
    { type: 'good' as const, name: 'Хорошее', soundInsulation: '~30 дБ', description: 'Для спален, кабинетов, гостиных' },
    { type: 'excellent' as const, name: 'Отличное', soundInsulation: '35-42 дБ', description: 'Максимальная звукоизоляция' },
  ];

  // Ручки из API
  const handles = useMemo(() => {
    return allHandles.map(h => ({
      id: h.id,
      name: h.name,
      photo: h.photo_path || createPlaceholderSVG(300, 300, '#718096', '#FFFFFF', h.name),
      price: h.price_rrc || h.price_opt || 0
    }));
  }, [allHandles]);

  // Получаем выбранную ручку из API данных
  const selectedHandleIdObj = selectedHandleId 
    ? allHandles.find(h => h.id === selectedHandleId)
    : null;

  // Фильтруем покрытия по типу
  const filteredCoatings = useMemo(() => {
    if (!coatings.length) return [];
    const coatingTypeMap: Record<string, string> = {
      'пэт': 'ПЭТ',
      'пвх': 'ПВХ',
      'шпон': 'Шпон',
      'эмаль': 'Эмаль'
    };
    const type = coatingTypeMap[coatingType] || coatingType;
    return coatings.filter(c => c.coating_type === type);
  }, [coatings, coatingType]);

  // Монохромные цвета (из покрытий типа ПЭТ/ПВХ)
  const monochromeColors = useMemo(() => {
    const pvcCoatings = coatings.filter(c => c.coating_type === 'ПВХ' || c.coating_type === 'ПЭТ');
    return pvcCoatings.map((c, idx) => ({
      id: c.id,
      name: c.color_name,
      color: '#FFFFFF' // TODO: добавить цвет в БД или использовать фото
    }));
  }, [coatings]);

  // Древесные цвета (из покрытий типа Шпон)
  const woodOptions = useMemo(() => {
    const woodCoatings = coatings.filter(c => c.coating_type === 'Шпон');
    return woodCoatings.map((c, idx) => ({
      id: c.id,
      name: c.color_name,
      image: c.photo_path || createPlaceholderSVG(400, 400, '#8B7355', '#FFFFFF', c.color_name)
    }));
  }, [coatings]);

  // Опции кромки из API
  const edgeOptions = useMemo(() => {
    const edgeList: Array<{id: string, name: string, icon: string, color?: string, image: string | null}> = [
      { id: 'none', name: 'Без кромки', icon: 'none', image: null }
    ];
    edges.forEach(edge => {
      edgeList.push({
        id: edge.id,
        name: edge.edge_color_name,
        icon: 'none',
        image: edge.photo_path || null
      });
    });
    return edgeList;
  }, [edges]);

  // Опции наличников из API (опции типа "наличники")
  const architraveOptions = useMemo(() => {
    return options.filter(o => o.option_type === 'наличники').map(o => ({
      id: o.id,
      name: o.option_name,
      image: o.photo_path || createPlaceholderSVG(300, 300, '#E2E8F0', '#1A202C', o.option_name)
    }));
  }, [options]);

  // Ограничители из API
  const stopperOptions = useMemo(() => {
    const stopperList: Array<{id: string, name: string, price?: number, image?: string}> = [{ id: 'none', name: 'Без ограничителя' }];
    allLimiters.forEach(limiter => {
      stopperList.push({
        id: limiter.id,
        name: limiter.name,
        price: limiter.price_rrc || limiter.price_opt,
        image: limiter.photo_path || createPlaceholderSVG(200, 200, '#1A202C', '#FFFFFF', limiter.name)
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

  // Нормализуем путь к фото ручки
  // Всегда приоритет mockup фото из папки mockups/ruchki
  const getHandlePhotoUrl = (photoPath: string | undefined, handleName?: string) => {
    // Всегда пробуем mockup, если есть имя ручки
    if (handleName) {
      // Сначала пробуем оригинальное имя (на случай если файл с пробелами)
      const trimmed = handleName.trim();
      const url = `/data/mockups/ruchki/${trimmed}.png`;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 getHandlePhotoUrl:', { handleName, trimmed, url });
      }
      return url;
    }
    
    // Если нет имени, но есть путь, пробуем извлечь имя из пути
    if (photoPath) {
      // Пытаемся извлечь имя файла из пути
      const fileName = photoPath.split('/').pop()?.replace(/\.[^/.]+$/, '');
      if (fileName) {
        const normalizedName = fileName.trim().replace(/\s+/g, '_');
        const url = `/data/mockups/ruchki/${normalizedName}.png`;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 getHandlePhotoUrl (from path):', { photoPath, fileName, normalizedName, url });
        }
        return url;
      }
    }
    
    return '';
  };

  // Спецификация (динамические, обновляются при выборе)
  const getCoatingText = () => {
    if (!selectedCoatingId) return 'Не выбрано';
    const coating = coatings.find(c => c.id === selectedCoatingId);
    if (!coating) return 'Не выбрано';
    return `${coating.coating_type}; ${coating.color_name}`;
  };

  // Описания типов покрытия
  const coatingDescriptions = {
    'пэт': 'Покрытие, имитирующее эмаль, пластик',
    'пвх': 'Высококачественная современная пленка с различными текстурами',
    'эмаль': 'Многослойное лакокрасочное покрытие',
    'шпон': 'Натуральные срезы различных пород дерева с покрытием лаком',
  };

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
    // TODO: Добавить комплекты фурнитуры в API
    return 'Не выбрано';
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
    if (!selectedModelId || !priceData) return;

    const optionIds: string[] = [];
    if (selectedArchitraveId) optionIds.push(selectedArchitraveId);
    if (selectedMirrorId && selectedMirrorId !== 'none') optionIds.push(selectedMirrorId);
    if (selectedThresholdId) optionIds.push(selectedThresholdId);

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

  // Расчет цены при изменении параметров
  useEffect(() => {
    if (!selectedModelId) return;

    const optionIds: string[] = [];
    if (selectedMirrorId && selectedMirrorId !== 'none') optionIds.push(selectedMirrorId);
    if (selectedThresholdId) optionIds.push(selectedThresholdId);
    if (selectedArchitraveId) optionIds.push(selectedArchitraveId);

    calculatePrice({
      door_model_id: selectedModelId,
      coating_id: selectedCoatingId || undefined,
      edge_id: selectedEdgeId || undefined,
      option_ids: optionIds.length > 0 ? optionIds : undefined,
      handle_id: selectedHandleId || undefined,
      limiter_id: selectedStopperId && selectedStopperId !== 'none' ? selectedStopperId : undefined,
      width,
      height
    }).catch(err => {
      console.error('Ошибка расчета цены:', err);
    });
  }, [selectedModelId, selectedCoatingId, selectedEdgeId, selectedHandleId, selectedStopperId, selectedMirrorId, selectedThresholdId, selectedArchitraveId, width, height, calculatePrice]);

  // Форматируем цену
  const price = useMemo(() => {
    if (priceCalculating) return 'Рассчитывается...';
    if (priceData) {
      return `${priceData.total.toLocaleString('ru-RU')} Р`;
    }
    return '—';
  }, [priceData, priceCalculating]);

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
                      <div className="grid grid-cols-5 gap-3">
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
                              {/* Миниатюра модели - соотношение 2:1 (высота в 2 раза больше ширины) */}
                              <div 
                                className="bg-gray-100 relative flex items-center justify-center overflow-hidden"
                                style={{ 
                                  width: '100%',
                                  aspectRatio: '1/2'
                                }}
                              >
                                {/* TODO: Добавить фото модели в БД */}
                                <div className="placeholder absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                  <div className="text-gray-500 text-4xl mb-2">🚪</div>
                                  <div className="text-gray-600 text-xs font-medium">{model.model_name}</div>
                                </div>
                              </div>
                              {/* Название модели */}
                              <div style={{ padding: '8px', background: 'white', textAlign: 'center' }}>
                                <div 
                                  className="font-medium text-gray-900"
                                  style={{ fontSize: '12px' }}
                                >
                                  {model.model_name}
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
                            onClick={() => setReversible(true)}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                              reversible
                                ? 'bg-gray-900 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-500 hover:shadow-sm'
                            }`}
                            style={{ fontSize: '13px' }}
                          >
                            Да
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 font-medium">Дверь со скрытым коробом, открывается внутрь</p>
                      </div>

                      {/* Наполнение */}
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
                          НАПОЛНЕНИЕ
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {fillingOptions.map((option) => (
                            <button
                              key={option.type}
                              onClick={() => setFilling(option.type)}
                              className={`p-2.5 rounded-lg border-2 transition-all duration-300 text-left ${
                                filling === option.type
                                  ? 'border-gray-900 ring-2 ring-gray-100 shadow-lg bg-white scale-105'
                                  : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-102 bg-white'
                              }`}
                            >
                              <div className="font-bold text-base mb-0.5 text-gray-900">{option.name}</div>
                              <div className="text-sm font-semibold text-gray-700 mb-0.5">{option.soundInsulation}</div>
                              <div className="text-xs text-gray-600 leading-relaxed">{option.description}</div>
                              {filling === option.type && (
                                <div className="mt-1.5 flex justify-end animate-in zoom-in duration-300">
                                  <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center shadow-md">
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
                            {(['пэт', 'пвх', 'шпон', 'эмаль'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setCoatingType(type);
                                  if (type === 'шпон') {
                                    setSelectedColor(null);
                                    setSelectedWood(null);
                                  } else {
                                    setSelectedWood(null);
                                    if (!selectedColor) setSelectedColor('Белый');
                                  }
                                }}
                                className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded font-semibold transition-all duration-300 ${
                                  coatingType === type
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
                                {coatingType === type && (
                                  <div className="flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                <span>{type === 'пэт' ? 'ПЭТ' : type === 'пвх' ? 'ПВХ' : type === 'шпон' ? 'Шпон' : 'Эмаль'}</span>
                              </button>
                            ))}
                          </div>
                          {/* Описание выбранного типа покрытия */}
                          <div className="text-sm text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
                            {coatingDescriptions[coatingType]}
                          </div>
                        </div>
                      </div>

                      {/* Монохромная палитра (для ПЭТ, ПВХ и Эмаль) */}
                      {(coatingType === 'пэт' || coatingType === 'пвх' || coatingType === 'эмаль') && (
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
                          <div className="grid grid-cols-5 gap-1.5">
                            {monochromeColors.map((color) => (
                              <button
                                key={color.id}
                                onClick={() => {
                                  setSelectedColor(color.name);
                                  setSelectedWood(null);
                                }}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 ${
                                  selectedColor === color.name
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md scale-105'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102'
                                }`}
                              >
                                {/* Цветной квадрат */}
                                <div 
                                  className="relative"
                                  style={{ 
                                    width: '100%',
                                    aspectRatio: '1/1',
                                    backgroundColor: color.color,
                                    border: color.color === '#FFFFFF' ? '1px solid #E5E5E5' : 'none'
                                  }}
                                >
                                  {/* Галочка при выборе */}
                                  {selectedColor === color.name && (
                                    <div className="absolute top-1 right-1 z-10 animate-in zoom-in duration-300">
                                      <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Название цвета */}
                                <div style={{ padding: '4px', background: 'white', textAlign: 'center' }}>
                                  <div 
                                    className="font-medium text-gray-900"
                                    style={{ fontSize: '12px', lineHeight: '1.3' }}
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
                      {coatingType === 'шпон' && (
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
                          <div className="grid grid-cols-5 gap-1.5">
                            {woodOptions.map((wood) => (
                              <button
                                key={wood.id}
                                onClick={() => {
                                  setSelectedWood(wood.name);
                                  setSelectedColor(null);
                                }}
                                className={`group relative overflow-hidden rounded border transition-all duration-300 ${
                                  selectedWood === wood.name
                                    ? 'border-gray-900 ring-1 ring-gray-100 shadow-md scale-105'
                                    : 'border-gray-200 shadow-sm hover:shadow-sm hover:border-gray-400 hover:scale-102'
                                }`}
                              >
                                {/* Миниатюра дерева */}
                                <div 
                                  className="relative"
                                  style={{ 
                                    width: '100%',
                                    aspectRatio: '1/1'
                                  }}
                                >
                                  <img
                                    src={wood.image}
                                    alt={wood.name}
                                    className="w-full h-full object-cover"
                                    style={{ display: 'block' }}
                                  />
                                  {/* Галочка при выборе */}
                                  {selectedWood === wood.name && (
                                    <div className="absolute top-1 right-1 z-10 animate-in zoom-in duration-300">
                                      <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                  </div>
                                    </div>
                                  )}
                                </div>
                                {/* Название */}
                                <div style={{ padding: '4px', background: 'white', textAlign: 'center' }}>
                                  <div 
                                    className="font-medium text-gray-900"
                                    style={{ fontSize: '12px', lineHeight: '1.3' }}
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
                        <div className="grid grid-cols-5 gap-1.5">
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
                              {/* Изображение кромки */}
                              <div 
                                className="bg-gray-100 relative flex items-center justify-center overflow-hidden"
                                style={{ 
                                  width: '100%',
                                  aspectRatio: '1/1'
                                }}
                              >
                                {edge.image ? (
                                  <img
                                    src={edge.image}
                                    alt={edge.name}
                                    className="w-full h-full object-cover"
                                    style={{ display: 'block' }}
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
                                  <div 
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: '#F3F4F6',
                                    }}
                                  >
                                    {edge.id === 'none' && (
                                      <div className="text-gray-400 text-xs">—</div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Название кромки */}
                              <div style={{ padding: '4px', background: 'white', textAlign: 'center' }}>
                                <div 
                                  className="font-medium text-gray-900"
                                  style={{ fontSize: '12px', lineHeight: '1.3' }}
                                >
                                  {edge.name}
                                </div>
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
                          {/* TODO: Добавить комплекты фурнитуры в API */}
                          {[].map((kit: any) => (
                            <button
                              key={kit.id}
                              onClick={() => setSelectedHardwareKit(kit.id)}
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
                              {/* Заголовок комплекта */}
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
                              
                              {/* Описание комплекта */}
                              <div className="space-y-1.5" style={{ fontSize: '15px', lineHeight: '1.6', color: '#000000' }}>
                                <div>{kit.hingesType}</div>
                                <div>Тип монтажа: {kit.mountingType}</div>
                                {kit.production && <div>{kit.production}</div>}
                                <div>Количество: {kit.quantity}</div>
                                {kit.alloy && <div>Сплав: {kit.alloy}</div>}
                                <div>{kit.latchType}</div>
                              </div>
                              
                              {/* Цена */}
                              <div 
                                className="mt-4 font-semibold"
                                style={{
                                  fontSize: '18px',
                                  color: '#000000'
                                }}
                              >
                                {kit.price.toLocaleString('ru-RU')} Р
                              </div>
                              
                                {/* Галочка при выборе */}
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
                                    src={getHandlePhotoUrl((selectedHandleIdObj as any).photos?.[0] || selectedHandleIdObj.photo_path, selectedHandleIdObj.name)}
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
                            onClick={() => setSelectedArchitraveId(architrave.name)}
                            className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                              selectedArchitraveId === architrave.name
                                ? 'border-gray-900 ring-2 ring-gray-100 shadow-lg scale-105'
                                : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 hover:scale-102'
                            }`}
                          >
                            {/* Миниатюра наличника */}
                            <div 
                              className="bg-gray-100 relative flex items-center justify-center overflow-hidden"
                              style={{ 
                                width: '100%',
                                aspectRatio: '1/1'
                              }}
                            >
                              <img
                                src={architrave.image}
                                alt={architrave.name}
                                className="w-full h-full object-cover"
                                style={{ display: 'block' }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-gray-400 text-2xl">🚪</div>
                              </div>
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
                            {selectedArchitraveId === architrave.name && (
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
                                {stopper.image && (
                                  <div 
                                    className="bg-gray-100 relative flex items-center justify-center overflow-hidden rounded"
                                    style={{ 
                                      width: '100%',
                                      aspectRatio: '1/1',
                                      flexShrink: 0
                                    }}
                                  >
                                    <img
                                      src={stopper.image}
                                      alt={stopper.name}
                                      className="w-full h-full object-cover"
                                      style={{ display: 'block' }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                      <div className="text-gray-400 text-xs">🔒</div>
                                    </div>
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
              {/* Большое превью - вертикальное изображение двери */}
              <div style={{ flex: '0 0 338px' }}>
                <div className="sticky" style={{ top: '32px' }}>
                  <div 
                    className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-2xl bg-white transition-all duration-300 hover:shadow-3xl relative"
                    style={{ 
                      width: '338px', 
                      aspectRatio: '1/2' // Соотношение 2:1 (высота в 2 раза больше ширины)
                    }}
                  >
                    {(() => {
                      // TODO: Добавить фото модели в БД
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <div className="text-gray-500 text-8xl mb-4">🚪</div>
                          <div className="text-gray-700 text-lg font-semibold">{selectedModel || 'Выберите модель'}</div>
                        </div>
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
                      { label: 'Наполнение', value: getFillingText() },
                      { label: 'Покрытие и цвет', value: getCoatingText() },
                      { label: 'Алюминиевая кромка', value: getEdgeText() },
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
                      disabled={!selectedModelId || !priceData}
                      className="w-full font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ 
                        fontFamily: designTokens.typography.fontFamily.sans.join(', '),
                        fontSize: designTokens.typography.fontSize.sm,
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        letterSpacing: '0.01em',
                        padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
                        backgroundColor: (!selectedModelId || !priceData) ? designTokens.colors.gray[400] : designTokens.colors.black[950],
                        color: '#FFFFFF',
                        borderRadius: designTokens.borderRadius.lg,
                        boxShadow: designTokens.boxShadow.md,
                        border: 'none',
                        cursor: (!selectedModelId || !priceData) ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedModelId && priceData) {
                          e.currentTarget.style.backgroundColor = designTokens.colors.gray[800];
                          e.currentTarget.style.boxShadow = designTokens.boxShadow.lg;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedModelId && priceData) {
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

      </div>
    </>
  );
}

