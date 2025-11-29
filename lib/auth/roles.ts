// lib/auth/roles.ts
// Система ролей и разрешений для реальных пользователей

export enum UserRole {
  ADMIN = 'admin',
  COMPLECTATOR = 'complectator',
  EXECUTOR = 'executor',
  MANAGER = 'manager'
}

export enum Permission {
  USERS_CREATE = 'users.create',
  USERS_READ = 'users.read',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',
  PRODUCTS_CREATE = 'products.create',
  PRODUCTS_READ = 'products.read',
  PRODUCTS_UPDATE = 'products.update',
  PRODUCTS_DELETE = 'products.delete',
  PRODUCTS_IMPORT = 'products.import',
  CATEGORIES_CREATE = 'categories.create',
  CATEGORIES_READ = 'categories.read',
  CATEGORIES_UPDATE = 'categories.update',
  CATEGORIES_DELETE = 'categories.delete',
  CLIENTS_CREATE = 'clients.create',
  CLIENTS_READ = 'clients.read',
  CLIENTS_UPDATE = 'clients.update',
  CLIENTS_DELETE = 'clients.delete',
  QUOTES_CREATE = 'quotes.create',
  QUOTES_READ = 'quotes.read',
  QUOTES_UPDATE = 'quotes.update',
  QUOTES_DELETE = 'quotes.delete',
  QUOTES_EXPORT = 'quotes.export',
  ORDERS_CREATE = 'orders.create',
  ORDERS_READ = 'orders.read',
  ORDERS_UPDATE = 'orders.update',
  ORDERS_DELETE = 'orders.delete',
  INVOICES_CREATE = 'invoices.create',
  INVOICES_READ = 'invoices.read',
  INVOICES_UPDATE = 'invoices.update',
  INVOICES_DELETE = 'invoices.delete',
  INVOICES_EXPORT = 'invoices.export',
  SUPPLIER_ORDERS_CREATE = 'supplier_orders.create',
  SUPPLIER_ORDERS_READ = 'supplier_orders.read',
  SUPPLIER_ORDERS_UPDATE = 'supplier_orders.update',
  SUPPLIER_ORDERS_DELETE = 'supplier_orders.delete',
  ANALYTICS_READ = 'analytics.read',
  SETTINGS_READ = 'settings.read',
  SETTINGS_UPDATE = 'settings.update'
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    Permission.USERS_CREATE, Permission.USERS_READ, Permission.USERS_UPDATE, Permission.USERS_DELETE,
    Permission.PRODUCTS_CREATE, Permission.PRODUCTS_READ, Permission.PRODUCTS_UPDATE, Permission.PRODUCTS_DELETE, Permission.PRODUCTS_IMPORT,
    Permission.CATEGORIES_CREATE, Permission.CATEGORIES_READ, Permission.CATEGORIES_UPDATE, Permission.CATEGORIES_DELETE,
    Permission.CLIENTS_CREATE, Permission.CLIENTS_READ, Permission.CLIENTS_UPDATE, Permission.CLIENTS_DELETE,
    Permission.QUOTES_CREATE, Permission.QUOTES_READ, Permission.QUOTES_UPDATE, Permission.QUOTES_DELETE, Permission.QUOTES_EXPORT,
    Permission.ORDERS_CREATE, Permission.ORDERS_READ, Permission.ORDERS_UPDATE, Permission.ORDERS_DELETE,
    Permission.INVOICES_CREATE, Permission.INVOICES_READ, Permission.INVOICES_UPDATE, Permission.INVOICES_DELETE, Permission.INVOICES_EXPORT,
    Permission.SUPPLIER_ORDERS_CREATE, Permission.SUPPLIER_ORDERS_READ, Permission.SUPPLIER_ORDERS_UPDATE, Permission.SUPPLIER_ORDERS_DELETE,
    Permission.ANALYTICS_READ, Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE
  ],
  [UserRole.COMPLECTATOR]: [
    Permission.PRODUCTS_READ, Permission.CATEGORIES_READ,
    Permission.CLIENTS_CREATE, Permission.CLIENTS_READ, Permission.CLIENTS_UPDATE,
    Permission.QUOTES_CREATE, Permission.QUOTES_READ, Permission.QUOTES_UPDATE, Permission.QUOTES_EXPORT,
    Permission.ORDERS_CREATE, Permission.ORDERS_READ, Permission.ORDERS_UPDATE,
    Permission.INVOICES_CREATE, Permission.INVOICES_READ, Permission.INVOICES_EXPORT
  ],
  [UserRole.EXECUTOR]: [
    Permission.PRODUCTS_READ, Permission.CATEGORIES_READ, Permission.CLIENTS_READ,
    Permission.QUOTES_READ, Permission.ORDERS_READ, Permission.INVOICES_READ,
    Permission.SUPPLIER_ORDERS_CREATE, Permission.SUPPLIER_ORDERS_READ, Permission.SUPPLIER_ORDERS_UPDATE
  ],
  [UserRole.MANAGER]: [
    Permission.PRODUCTS_READ, Permission.CATEGORIES_READ, Permission.CLIENTS_READ,
    Permission.QUOTES_READ, Permission.ORDERS_READ, Permission.INVOICES_READ,
    Permission.SUPPLIER_ORDERS_READ, Permission.ANALYTICS_READ
  ]
};

export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role as UserRole] || [];
}

export function getRoleDisplayName(role: string): string {
  const displayNames = {
    [UserRole.ADMIN]: 'Администратор',
    [UserRole.COMPLECTATOR]: 'Комплектатор',
    [UserRole.EXECUTOR]: 'Исполнитель',
    [UserRole.MANAGER]: 'Руководитель'
  };
  return displayNames[role as UserRole] || 'Неизвестная роль';
}

export function getRoleColor(role: string): string {
  const colors = {
    [UserRole.ADMIN]: 'text-red-600',
    [UserRole.COMPLECTATOR]: 'text-blue-600',
    [UserRole.EXECUTOR]: 'text-green-600',
    [UserRole.MANAGER]: 'text-purple-600'
  };
  return colors[role as UserRole] || 'text-gray-600';
}

export function getRoleIcon(role: string): string {
  const icons = {
    [UserRole.ADMIN]: '👑',
    [UserRole.COMPLECTATOR]: '📋',
    [UserRole.EXECUTOR]: '⚙️',
    [UserRole.MANAGER]: '👔'
  };
  return icons[role as UserRole] || '👤';
}

// Типы для обратной совместимости
export type Role = UserRole | 'admin' | 'complectator' | 'executor' | 'manager' | 'sales' | 'viewer' | string;

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

// Вспомогательная функция для проверки роли администратора
function isAdminRole(role: Role): boolean {
  return role === UserRole.ADMIN || role === 'admin';
}

// Сервис для работы с ролями
export const roleService = {
  getAllRoles(): RoleDefinition[] {
    return [
      {
        id: UserRole.ADMIN,
        name: 'Администратор',
        description: 'Полный доступ ко всем функциям системы',
        permissions: getRolePermissions(UserRole.ADMIN),
        color: 'red'
      },
      {
        id: UserRole.COMPLECTATOR,
        name: 'Комплектатор',
        description: 'Управление каталогом, клиентами и документами',
        permissions: getRolePermissions(UserRole.COMPLECTATOR),
        color: 'blue'
      },
      {
        id: UserRole.EXECUTOR,
        name: 'Исполнитель',
        description: 'Просмотр и выполнение заказов',
        permissions: getRolePermissions(UserRole.EXECUTOR),
        color: 'green'
      },
      {
        id: UserRole.MANAGER,
        name: 'Руководитель',
        description: 'Контроль всех процессов, просмотр всех заказов и статистики',
        permissions: getRolePermissions(UserRole.MANAGER),
        color: 'purple'
      }
    ];
  },

  getRole(role: Role): RoleDefinition | null {
    const allRoles = this.getAllRoles();
    return allRoles.find(r => r.id === role) || null;
  },

  getManageableRoles(currentRole: Role): RoleDefinition[] {
    const allRoles = this.getAllRoles();
    
    if (isAdminRole(currentRole)) {
      return allRoles;
    }
    
    // Только свою роль
    const currentRoleDef = this.getRole(currentRole);
    return currentRoleDef ? [currentRoleDef] : [];
  },

  hasPermission(role: Role, permission: string): boolean {
    const roleDef = this.getRole(role);
    if (!roleDef) return false;
    
    // Администратор имеет все разрешения
    if (isAdminRole(role)) {
      return true;
    }
    
    return roleDef.permissions.includes(permission);
  },

  canManageRole(managerRole: Role, targetRole: Role): boolean {
    // Только админ может управлять всеми ролями
    if (isAdminRole(managerRole)) {
      return true;
    }
    
    // Остальные могут управлять только своей ролью
    return managerRole === targetRole;
  }
};