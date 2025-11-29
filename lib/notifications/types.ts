// lib/notifications/types.ts
// Типы и интерфейсы для системы уведомлений

export enum NotificationType {
  // Системные уведомления
  SYSTEM_INFO = 'system_info',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_ERROR = 'system_error',
  
  // Бизнес-процессы
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  
  // Документы
  QUOTE_GENERATED = 'quote_generated',
  INVOICE_GENERATED = 'invoice_generated',
  SUPPLIER_ORDER_GENERATED = 'supplier_order_generated',
  DOCUMENT_APPROVED = 'document_approved',
  DOCUMENT_REJECTED = 'document_rejected',
  
  // Пользователи и роли
  USER_REGISTERED = 'user_registered',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  
  // Каталог и товары
  PRODUCT_ADDED = 'product_added',
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_DELETED = 'product_deleted',
  CATEGORY_UPDATED = 'category_updated',
  
  // Клиенты
  CLIENT_ADDED = 'client_added',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_CONTACT = 'client_contact',
  
  // Аналитика и отчеты
  REPORT_GENERATED = 'report_generated',
  ANALYTICS_UPDATE = 'analytics_update',
  
  // Интеграции
  INTEGRATION_SUCCESS = 'integration_success',
  INTEGRATION_ERROR = 'integration_error',
  SYNC_COMPLETED = 'sync_completed',
  
  // Безопасность
  SECURITY_ALERT = 'security_alert',
  LOGIN_ATTEMPT = 'login_attempt',
  PASSWORD_CHANGED = 'password_changed'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum NotificationChannel {
  IN_APP = 'in_app',        // Уведомления в приложении
  EMAIL = 'email',          // Email уведомления
  PUSH = 'push',            // Push уведомления
  SMS = 'sms',              // SMS уведомления
  WEBHOOK = 'webhook'       // Webhook уведомления
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'dismiss';
  action: string; // URL или действие
  style: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
}

export interface NotificationMetadata {
  // Связанные сущности
  entityType?: 'order' | 'product' | 'client' | 'user' | 'document';
  entityId?: string;
  
  // Дополнительные данные
  data?: Record<string, any>;
  
  // Теги для фильтрации
  tags?: string[];
  
  // Группировка
  groupId?: string;
  
  // Время жизни
  expiresAt?: Date;
  
  // Приоритет отображения
  displayPriority?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  
  // Визуальные элементы
  icon?: string;
  image?: string;
  color?: string;
  
  // Метаданные
  priority: NotificationPriority;
  status: NotificationStatus;
  channels: NotificationChannel[];
  
  // Связанные данные
  metadata?: NotificationMetadata;
  actions?: NotificationAction[];
  
  // Аудитория
  userId?: string;           // Конкретный пользователь
  role?: string;             // Роль пользователя
  department?: string;       // Отдел
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  
  // Настройки отображения
  showInHeader: boolean;     // Показывать в шапке
  showInSidebar: boolean;    // Показывать в боковой панели
  autoDismiss: boolean;      // Автоматически скрывать
  dismissAfter?: number;     // Скрыть через N секунд
  
  // Связанные уведомления
  parentId?: string;         // Родительское уведомление
  children?: string[];       // Дочерние уведомления
}

export interface NotificationPreferences {
  userId: string;
  
  // Настройки по типам уведомлений
  typePreferences: Record<NotificationType, {
    enabled: boolean;
    channels: NotificationChannel[];
    priority: NotificationPriority;
  }>;
  
  // Настройки по каналам
  channelPreferences: Record<NotificationChannel, {
    enabled: boolean;
    quietHours?: {
      start: string; // "22:00"
      end: string;   // "08:00"
    };
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  }>;
  
  // Общие настройки
  globalSettings: {
    enableSound: boolean;
    enableVibration: boolean;
    enableDesktop: boolean;
    enableMobile: boolean;
    maxNotificationsPerDay: number;
    autoArchiveAfter: number; // дней
  };
  
  // Фильтры
  filters: {
    keywords: string[];
    excludeKeywords: string[];
    minimumPriority: NotificationPriority;
    onlyAssigned: boolean;
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  description: string;
  
  // Шаблон контента
  titleTemplate: string;
  messageTemplate: string;
  descriptionTemplate?: string;
  
  // Визуальные элементы
  icon?: string;
  color?: string;
  
  // Настройки по умолчанию
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions: NotificationAction[];
  
  // Переменные для шаблона
  variables: string[]; // ['userName', 'orderNumber', 'amount']
  
  // Условия показа
  conditions?: {
    roles?: string[];
    permissions?: string[];
    userGroups?: string[];
  };
}

// События для создания уведомлений
export interface NotificationEvent {
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  
  // Целевая аудитория
  targetUsers?: string[];
  targetRoles?: string[];
  targetDepartments?: string[];
  
  // Метаданные
  metadata?: NotificationMetadata;
  actions?: NotificationAction[];
  
  // Настройки
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  expiresAt?: Date;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

// Статистика уведомлений
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byStatus: Record<NotificationStatus, number>;
  
  // Временные метрики
  today: number;
  thisWeek: number;
  thisMonth: number;
  
  // Эффективность
  readRate: number;        // Процент прочитанных
  actionRate: number;      // Процент с действиями
  responseTime: number;    // Среднее время реакции (минуты)
}



