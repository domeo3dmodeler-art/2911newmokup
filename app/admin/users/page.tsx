'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Card, Button, DataTable, Pagination, useFormValidation, ErrorMessage } from '../../../components/ui';
import { ClientAuthGuard } from '../../../components/auth/ClientAuthGuard';
import { clientLogger } from '@/lib/logging/client-logger';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: 'admin' | 'complectator' | 'executor';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  return (
    <ClientAuthGuard>
      <AdminUsersPageContent />
    </ClientAuthGuard>
  );
}

function AdminUsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    password: '',
    role: 'complectator' as 'admin' | 'complectator' | 'executor',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  // Перезагружаем данные при возврате на страницу
  useEffect(() => {
    const handleFocus = () => {
      loadUsers();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      // Получаем токен для авторизации
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch('/api/users', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        clientLogger.error('Ошибка загрузки пользователей', { status: response.status });
        setUsers([]);
        return;
      }
      
      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { users: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { users?: User[] } }).data
        : null;
      const users = responseData && 'users' in responseData && Array.isArray(responseData.users)
        ? responseData.users
        : (data.users || []);
      
      if (data.success) {
        setUsers(users);
      } else {
        clientLogger.error('Ошибка загрузки пользователей', { error: data.error });
        setUsers([]);
      }
    } catch (error) {
      clientLogger.error('Ошибка загрузки пользователей:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'complectator': return 'bg-blue-100 text-blue-800';
      case 'executor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'complectator': return 'Комплектатор';
      case 'executor': return 'Исполнитель';
      default: return role;
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return ['products.import', 'products.manage', 'categories.create', 'users.manage', 'analytics.view'];
      case 'complectator':
        return ['catalog.view', 'pricing.calculate', 'quotes.create', 'quotes.export', 'analytics.view'];
      case 'executor':
        return ['catalog.view', 'pricing.calculate', 'quotes.create', 'factory.order', 'analytics.view'];
      default:
        return [];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Обновляем существующего пользователя
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              ...formData, 
              permissions: getRolePermissions(formData.role),
              lastLogin: user.lastLogin
            }
          : user
      );
      setUsers(updatedUsers);
      
      // Сохраняем обновленные данные в localStorage
      localStorage.setItem('usersData', JSON.stringify(updatedUsers));
      
      // Если редактируем текущего пользователя, обновляем его данные в localStorage
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId === editingUser.id) {
        localStorage.setItem('userFirstName', formData.firstName);
        localStorage.setItem('userLastName', formData.lastName);
        localStorage.setItem('userMiddleName', formData.middleName);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userRole', formData.role);
      }
    } else {
      // Добавляем нового пользователя
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        permissions: getRolePermissions(formData.role),
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: undefined
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      
      // Сохраняем обновленные данные в localStorage
      localStorage.setItem('usersData', JSON.stringify(updatedUsers));
    }

    // Сбрасываем форму
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      password: '',
      role: 'complectator',
      isActive: true
    });
    setShowForm(false);
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '',
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowForm(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Управление пользователями" 
      subtitle="Создание и настройка пользователей системы"
    >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
                <p className="text-2xl font-bold text-black mt-1">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Администраторы</p>
                <p className="text-2xl font-bold text-black mt-1">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="text-2xl">👑</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Комплектаторы</p>
                <p className="text-2xl font-bold text-black mt-1">{users.filter(u => u.role === 'complectator').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Исполнители</p>
                <p className="text-2xl font-bold text-black mt-1">{users.filter(u => u.role === 'executor').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">Список пользователей</h2>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => window.location.href = '/admin/users/new'}
            >
              👤 Добавить пользователя
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последний вход</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">
                          {user.lastName} {user.firstName} {user.middleName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">{user.lastLogin || 'Никогда'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">{user.createdAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-black hover:text-yellow-400 transition-colors duration-200"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`transition-colors duration-200 ${
                            user.isActive 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {user.isActive ? 'Заблокировать' : 'Активировать'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit User Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-black mb-4">
                {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="user@domeo.ru"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Фамилия *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Имя *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Отчество</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Иванович"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Пароль {editingUser ? '(оставьте пустым, чтобы не менять)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Роль *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="complectator">Комплектатор</option>
                    <option value="executor">Исполнитель</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-black">
                    Активный пользователь
                  </label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
                  >
                    {editingUser ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({
                        email: '',
                        firstName: '',
                        lastName: '',
                        middleName: '',
                        password: '',
                        role: 'complectator',
                        isActive: true
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
