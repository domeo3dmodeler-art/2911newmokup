// lib/utils/user-display.ts
// Утилиты для отображения информации о пользователе

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
}

/**
 * Форматирует имя пользователя в формате "Фамилия И.О."
 */
export function formatUserName(user: User | null): string {
  if (!user) return 'Пользователь';
  
  const firstName = user.firstName.charAt(0).toUpperCase();
  // Показываем отчество только если оно заполнено (не пустое)
  const middleName = (user.middleName && user.middleName.trim()) 
    ? user.middleName.charAt(0).toUpperCase() + '.' 
    : '';
  
  return `${user.lastName} ${firstName}.${middleName}`;
}

/**
 * Получает полное имя пользователя
 */
export function getFullName(user: User | null): string {
  if (!user) return 'Пользователь';
  
  return `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
}

/**
 * Получает роль пользователя на русском языке
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: { [key: string]: string } = {
    'admin': 'Администратор',
    'complectator': 'Комплектатор',
    'executor': 'Исполнитель'
  };
  return roleMap[role] || 'Пользователь';
}

/**
 * Получает цвет для роли пользователя
 */
export function getRoleColor(role: string): string {
  const colorMap: { [key: string]: string } = {
    'admin': 'text-red-600',
    'complectator': 'text-blue-600',
    'executor': 'text-green-600'
  };
  return colorMap[role] || 'text-gray-600';
}

/**
 * Получает иконку для роли пользователя
 */
export function getRoleIcon(role: string): string {
  const iconMap: { [key: string]: string } = {
    'admin': '👑',
    'complectator': '📋',
    'executor': '⚡'
  };
  return iconMap[role] || '👤';
}
