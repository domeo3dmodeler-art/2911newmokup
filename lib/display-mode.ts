/**
 * Утилиты для управления режимом отображения блоков
 */

export type DisplayMode = 'edit' | 'preview' | 'live';

/**
 * Настройки отображения для разных типов блоков
 */
export interface BlockDisplaySettings {
  showTechnicalInfo: boolean;
  showFilters: boolean;
  showDimensions: boolean;
  showDebugInfo: boolean;
  showPlaceholderContent: boolean;
}

export const DEFAULT_DISPLAY_SETTINGS: BlockDisplaySettings = {
  showTechnicalInfo: true,
  showFilters: true,
  showDimensions: true,
  showDebugInfo: true,
  showPlaceholderContent: true
};

/**
 * Настройки отображения для разных режимов
 */
export const DISPLAY_MODE_SETTINGS: Record<DisplayMode, Partial<BlockDisplaySettings>> = {
  edit: {
    showTechnicalInfo: true,
    showFilters: true,
    showDimensions: true,
    showDebugInfo: true,
    showPlaceholderContent: true
  },
  preview: {
    showTechnicalInfo: false,
    showFilters: false,
    showDimensions: false,
    showDebugInfo: false,
    showPlaceholderContent: true
  },
  live: {
    showTechnicalInfo: false,
    showFilters: false,
    showDimensions: false,
    showDebugInfo: false,
    showPlaceholderContent: false
  }
};

/**
 * Специальные настройки для конкретных типов блоков
 */
export const BLOCK_SPECIFIC_SETTINGS: Record<string, Partial<BlockDisplaySettings>> = {
  productGrid: {
    showFilters: false, // Скрываем раздел "Фильтры" в режиме редактирования
    showTechnicalInfo: false
  },
  productConfigurator: {
    showFilters: false,
    showTechnicalInfo: false
  },
  productConfiguratorAdvanced: {
    showFilters: false,
    showTechnicalInfo: false
  },
  productFilters: {
    showFilters: false, // Скрываем фильтры в режиме редактирования
    showTechnicalInfo: false
  }
};

/**
 * Получить настройки отображения для блока
 */
export function getBlockDisplaySettings(
  blockType: string, 
  displayMode: DisplayMode = 'edit'
): BlockDisplaySettings {
  const modeSettings = DISPLAY_MODE_SETTINGS[displayMode] || {};
  const blockSettings = BLOCK_SPECIFIC_SETTINGS[blockType] || {};
  
  return {
    ...DEFAULT_DISPLAY_SETTINGS,
    ...modeSettings,
    ...blockSettings
  };
}

/**
 * Проверить, нужно ли показывать техническую информацию
 */
export function shouldShowTechnicalInfo(blockType: string, displayMode: DisplayMode = 'edit'): boolean {
  return getBlockDisplaySettings(blockType, displayMode).showTechnicalInfo;
}

/**
 * Проверить, нужно ли показывать фильтры
 */
export function shouldShowFilters(blockType: string, displayMode: DisplayMode = 'edit'): boolean {
  return getBlockDisplaySettings(blockType, displayMode).showFilters;
}

/**
 * Проверить, нужно ли показывать размеры
 */
export function shouldShowDimensions(blockType: string, displayMode: DisplayMode = 'edit'): boolean {
  return getBlockDisplaySettings(blockType, displayMode).showDimensions;
}

/**
 * Проверить, нужно ли показывать отладочную информацию
 */
export function shouldShowDebugInfo(blockType: string, displayMode: DisplayMode = 'edit'): boolean {
  return getBlockDisplaySettings(blockType, displayMode).showDebugInfo;
}

/**
 * Проверить, нужно ли показывать placeholder контент
 */
export function shouldShowPlaceholderContent(blockType: string, displayMode: DisplayMode = 'edit'): boolean {
  return getBlockDisplaySettings(blockType, displayMode).showPlaceholderContent;
}
