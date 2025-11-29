// components/UserManagement.tsx
// Компонент для управления пользователями и ролями

"use client";

import { useState, useEffect } from 'react';
import { roleService, Role, RoleDefinition, UserRole } from '@/lib/auth/roles';
import { clientLogger } from '@/lib/logging/client-logger';

type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
};

type Props = {
  currentUserRole: Role;
};

export default function UserManagement({ currentUserRole }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: UserRole.COMPLECTATOR as Role,
    password: ''
  });

  const roles = roleService.getAllRoles();
  const manageableRoles = roleService.getManageableRoles(currentUserRole);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Заглушка для демонстрации
      const mockUsers: User[] = [
        {
          id: 'user-1',
          email: 'admin@company.ru',
          name: 'Администратор',
          role: 'admin',
          createdAt: '2025-01-01T00:00:00Z',
          lastLoginAt: '2025-01-15T10:30:00Z',
          isActive: true
        },
        {
          id: 'user-2',
          email: 'complectator@company.ru',
          name: 'Комплектатор',
          role: UserRole.COMPLECTATOR,
          createdAt: '2025-01-02T00:00:00Z',
          lastLoginAt: '2025-01-15T09:15:00Z',
          isActive: true
        },
        {
          id: 'user-3',
          email: 'executor@company.ru',
          name: 'Исполнитель',
          role: UserRole.EXECUTOR,
          createdAt: '2025-01-03T00:00:00Z',
          lastLoginAt: '2025-01-14T16:45:00Z',
          isActive: true
        }
      ];

      setUsers(mockUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      // Здесь должен быть API вызов для изменения роли
      clientLogger.debug(`Changing user ${userId} role to ${newRole}`);
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Здесь должен быть API вызов для создания пользователя
      clientLogger.debug('Creating user:', newUser);
      
      const createdUser: User = {
        id: `user-${Date.now()}`,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      setUsers(prev => [...prev, createdUser]);
      setShowCreateForm(false);
      setNewUser({ email: '', name: '', role: UserRole.COMPLECTATOR, password: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      // Здесь должен быть API вызов для изменения статуса пользователя
      clientLogger.debug(`Toggling user ${userId} status`);
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: Role) => {
    const roleDef = roleService.getRole(role);
    if (!roleDef) return 'bg-gray-100 text-gray-800';
    
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    
    return colorMap[roleDef.color] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка пользователей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
        
        {roleService.hasPermission(currentUserRole, 'users.manage') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Добавить пользователя
          </button>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Форма создания пользователя */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Создание пользователя</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="user@company.ru"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Имя пользователя"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as Role }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {roles
                  .filter(role => manageableRoles.includes(role.role))
                  .map(role => (
                    <option key={role.role} value={role.role}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Пароль"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Создать
            </button>
          </div>
        </div>
      )}

      {/* Список пользователей */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последний вход
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {roleService.canManageRole(currentUserRole, user.role) ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getRoleColor(user.role)}`}
                      >
                        {roles
                          .filter(role => manageableRoles.includes(role.role))
                          .map(role => (
                            <option key={role.role} value={role.role}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {roles.find(r => r.role === user.role)?.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Никогда'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {roleService.canManageRole(currentUserRole, user.role) && (
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          user.isActive 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {user.isActive ? 'Заблокировать' : 'Активировать'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Информация о ролях */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о ролях</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.role} className="bg-white p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role.role)}`}>
                  {role.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{role.description}</p>
              <div className="text-xs text-gray-500">
                Разрешений: {role.permissions.length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
