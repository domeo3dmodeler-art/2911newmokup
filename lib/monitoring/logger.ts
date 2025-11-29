// lib/monitoring/logger.ts
// Профессиональная система логирования с Winston
// Оптимизирована для продакшена и мониторинга

import winston from 'winston';
import path from 'path';

// Конфигурация логгера
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Консольный формат для разработки
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Создаем winston логгер
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'domeo-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Консольный вывод
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// Добавляем файловые транспорты для продакшена
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || './logs';
  
  // Общие логи
  winstonLogger.add(new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }));

  // Логи ошибок
  winstonLogger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }));

  // Логи доступа
  winstonLogger.add(new winston.transports.File({
    filename: path.join(logDir, 'access.log'),
    level: 'http',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }));
}

// Типы для логирования
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  CACHE = 'cache',
  STORAGE = 'storage',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

// Интерфейс для структурированного логирования
export interface LogContext {
  userId?: string;
  requestId?: string;
  category?: LogCategory;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;

  private constructor() {
    this.winston = winstonLogger;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Логирует ошибку
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.winston.error(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...context,
    });
  }

  /**
   * Логирует предупреждение
   */
  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, context);
  }

  /**
   * Логирует информационное сообщение
   */
  info(message: string, context?: LogContext): void {
    this.winston.info(message, context);
  }

  /**
   * Логирует HTTP запрос
   */
  http(message: string, context?: LogContext): void {
    this.winston.http(message, context);
  }

  /**
   * Логирует отладочную информацию
   */
  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, context);
  }

  /**
   * Логирует бизнес-операцию
   */
  business(operation: string, message: string, context?: LogContext): void {
    this.info(message, {
      ...context,
      category: LogCategory.BUSINESS,
      operation,
    });
  }

  /**
   * Логирует операцию с базой данных
   */
  database(operation: string, message: string, context?: LogContext): void {
    this.info(message, {
      ...context,
      category: LogCategory.DATABASE,
      operation,
    });
  }

  /**
   * Логирует операцию с кэшем
   */
  cache(operation: string, message: string, context?: LogContext): void {
    this.info(message, {
      ...context,
      category: LogCategory.CACHE,
      operation,
    });
  }

  /**
   * Логирует операцию с хранилищем
   */
  storage(operation: string, message: string, context?: LogContext): void {
    this.info(message, {
      ...context,
      category: LogCategory.STORAGE,
      operation,
    });
  }

  /**
   * Логирует аутентификацию
   */
  auth(operation: string, message: string, context?: LogContext): void {
    this.info(message, {
      ...context,
      category: LogCategory.AUTH,
      operation,
    });
  }

  /**
   * Логирует API запрос
   */
  api(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.http(`${method} ${url}`, {
      ...context,
      category: LogCategory.API,
      operation: 'request',
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Создает дочерний логгер с дополнительным контекстом
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.winston = this.winston.child(defaultContext);
    return childLogger;
  }
}

// Экспортируем экземпляр логгера
export const logger = Logger.getInstance();

// Утилиты для логирования
export class LogUtils {
  /**
   * Создает контекст для HTTP запроса
   */
  static createHttpContext(req: any): LogContext {
    return {
      requestId: req.headers['x-request-id'] || req.id,
      userId: req.user?.id,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        url: req.url,
      },
    };
  }

  /**
   * Создает контекст для пользователя
   */
  static createUserContext(userId: string, operation?: string): LogContext {
    return {
      userId,
      operation,
      category: LogCategory.AUTH,
    };
  }

  /**
   * Создает контекст для бизнес-операции
   */
  static createBusinessContext(operation: string, metadata?: Record<string, any>): LogContext {
    return {
      operation,
      category: LogCategory.BUSINESS,
      metadata,
    };
  }

  /**
   * Логирует производительность операции
   */
  static logPerformance(operation: string, startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    logger.info(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      category: LogCategory.SYSTEM,
    });
  }

  /**
   * Логирует ошибку с полным контекстом
   */
  static logError(error: Error, context?: LogContext): void {
    logger.error(error.message, error, {
      ...context,
      category: LogCategory.SYSTEM,
    });
  }
}

// Middleware для логирования HTTP запросов
export function createHttpLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const context = LogUtils.createHttpContext(req);

    // Логируем начало запроса
    logger.http(`Request started: ${req.method} ${req.url}`, context);

    // Перехватываем завершение ответа
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.api(req.method, req.url, res.statusCode, duration, context);
    });

    next();
  };
}

// Экспортируем winston для прямого использования
export { winston };
