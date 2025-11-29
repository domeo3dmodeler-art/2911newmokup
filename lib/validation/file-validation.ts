// lib/validation/file-validation.ts
// Валидация загружаемых файлов

export interface FileValidationOptions {
  maxSize?: number; // в байтах
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): ValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB по умолчанию
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;

  // Проверка размера файла
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Файл слишком большой. Максимальный размер: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Проверка типа файла
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`
    };
  }

  // Проверка расширения файла
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Неподдерживаемое расширение файла. Разрешены: ${allowedExtensions.join(', ')}`
    };
  }

  return { isValid: true };
}

export function validateImageFile(file: File): ValidationResult {
  return validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB для изображений
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  });
}

export function validateDocumentFile(file: File): ValidationResult {
  return validateFile(file, {
    maxSize: 20 * 1024 * 1024, // 20MB для документов
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf'
    ],
    allowedExtensions: ['.xlsx', '.xls', '.csv', '.pdf']
  });
}

export function sanitizeFileName(fileName: string): string {
  // Удаляем опасные символы и ограничиваем длину
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255)
    .toLowerCase();
}

export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedName = sanitizeFileName(originalName);
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'));
  const nameWithoutExtension = sanitizedName.substring(0, sanitizedName.lastIndexOf('.'));
  
  return `${timestamp}_${randomString}_${nameWithoutExtension}${extension}`;
}
