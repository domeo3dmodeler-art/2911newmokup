/**
 * Утилиты для работы с фото товаров
 * Поддерживает систему обложек и галереи
 */

export interface PhotoStructure {
  cover: string | null; // Обложка (d2.png)
  gallery: string[];    // Галерея (d2_1.png, d2_2.png, etc.)
}

export interface PhotoInfo {
  fileName: string;
  isCover: boolean;
  number: number | null; // Номер для галереи (1, 2, 3...)
  baseName: string;      // Базовое имя без номера (d2)
}

/**
 * Парсит имя файла и определяет тип фото
 */
export function parsePhotoFileName(fileName: string): PhotoInfo {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // Проверяем, есть ли номер в конце (_1, _2, etc.)
  const match = nameWithoutExt.match(/^(.+)_(\d+)$/);
  
  if (match) {
    return {
      fileName,
      isCover: false,
      number: parseInt(match[2]),
      baseName: match[1]
    };
  } else {
    return {
      fileName,
      isCover: true,
      number: null,
      baseName: nameWithoutExt
    };
  }
}

/**
 * Преобразует массив фото в структурированный формат
 */
export function structurePhotos(photos: string[]): PhotoStructure {
  const coverPhotos: string[] = [];
  const galleryPhotos: { photo: string; number: number }[] = [];
  
  photos.forEach(photo => {
    const photoInfo = parsePhotoFileName(photo);
    
    if (photoInfo.isCover) {
      coverPhotos.push(photo);
    } else if (photoInfo.number !== null) {
      galleryPhotos.push({ photo, number: photoInfo.number });
    }
  });
  
  // Сортируем галерею по номерам
  galleryPhotos.sort((a, b) => a.number - b.number);
  
  return {
    cover: coverPhotos.length > 0 ? coverPhotos[0] : null,
    gallery: galleryPhotos.map(item => item.photo)
  };
}

/**
 * Получает следующий доступный номер для фото галереи
 */
export function getNextPhotoNumber(existingPhotos: string[], baseName: string): number {
  const galleryNumbers = existingPhotos
    .map(photo => parsePhotoFileName(photo))
    .filter(info => !info.isCover && info.baseName === baseName)
    .map(info => info.number!)
    .sort((a, b) => a - b);
  
  // Находим первый пропущенный номер или следующий после максимального
  let nextNumber = 1;
  for (const num of galleryNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }
  
  return nextNumber;
}

/**
 * Проверяет, можно ли добавить еще одно фото (максимум 5 в галерее)
 */
export function canAddMorePhotos(existingPhotos: string[], baseName: string): boolean {
  const galleryCount = existingPhotos
    .map(photo => parsePhotoFileName(photo))
    .filter(info => !info.isCover && info.baseName === baseName)
    .length;
  
  return galleryCount < 5;
}

/**
 * Получает все фото для товара в правильном порядке
 */
export function getAllPhotos(photoStructure: PhotoStructure): string[] {
  const allPhotos: string[] = [];
  
  if (photoStructure.cover) {
    allPhotos.push(photoStructure.cover);
  }
  
  allPhotos.push(...photoStructure.gallery);
  
  return allPhotos;
}

/**
 * Получает обложку для отображения в каталоге
 */
export function getCoverPhoto(photoStructure: PhotoStructure): string | null {
  return photoStructure.cover;
}

/**
 * Проверяет, есть ли у товара фото
 */
export function hasPhotos(photoStructure: PhotoStructure): boolean {
  return photoStructure.cover !== null || photoStructure.gallery.length > 0;
}

/**
 * Получает количество фото
 */
export function getPhotoCount(photoStructure: PhotoStructure): number {
  let count = 0;
  if (photoStructure.cover) count++;
  count += photoStructure.gallery.length;
  return count;
}
