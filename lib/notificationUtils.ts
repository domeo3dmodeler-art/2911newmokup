'use client';

import { toast } from 'sonner';

// Утилиты для замены стандартных alert и confirm
export const notificationUtils = {
  // Замена alert
  alert: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      default:
        toast.info(message);
    }
  },

  // Замена confirm (возвращает Promise<boolean>)
  confirm: (message: string, title: string = 'Подтверждение'): Promise<boolean> => {
    return new Promise((resolve) => {
      // Создаем временный диалог подтверждения
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex items-center justify-between p-6 border-b">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            </div>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="this.closest('.fixed').remove(); window.confirmResolve(false);">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="p-6">
            <p class="text-gray-700 mb-4">${message}</p>
          </div>
          <div class="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
            <button class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" onclick="this.closest('.fixed').remove(); window.confirmResolve(false);">
              Отмена
            </button>
            <button class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors" onclick="this.closest('.fixed').remove(); window.confirmResolve(true);">
              Подтвердить
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      // Создаем глобальную функцию для разрешения Promise
      (window as any).confirmResolve = resolve;
    });
  },

  // Удобные методы
  success: (message: string) => notificationUtils.alert(message, 'success'),
  error: (message: string) => notificationUtils.alert(message, 'error'),
  warning: (message: string) => notificationUtils.alert(message, 'warning'),
  info: (message: string) => notificationUtils.alert(message, 'info')
};

// Глобальная замена для совместимости
if (typeof window !== 'undefined') {
  // Заменяем стандартные alert и confirm
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  
  window.alert = (message: string) => {
    notificationUtils.alert(message, 'info');
  };
  
  window.confirm = (message: string): boolean => {
    // Для синхронного confirm используем простую замену
    // В реальном приложении лучше использовать асинхронные диалоги
    return originalConfirm(message);
  };
}

export default notificationUtils;
