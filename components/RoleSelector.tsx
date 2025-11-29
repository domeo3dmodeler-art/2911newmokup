'use client';

import React, { useState } from 'react';
import { roleService, Role } from '@/lib/auth/roles';

interface RoleSelectorProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  disabled?: boolean;
}

export default function RoleSelector({ 
  currentRole, 
  onRoleChange, 
  disabled = false 
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const roles = roleService.getAllRoles();

  const handleRoleSelect = (role: Role) => {
    onRoleChange(role);
    setIsOpen(false);
  };

  const currentRoleDef = roleService.getRole(currentRole);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
          disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400'
        }`}
      >
        <span>{currentRoleDef?.icon}</span>
        <span className="font-medium">{currentRoleDef?.name}</span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Выберите роль пользователя
            </h3>
            <div className="space-y-3">
              {roles.map((role) => (
                <button
                  key={role.role}
                  onClick={() => handleRoleSelect(role.role)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    currentRole === role.role
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{role.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          role.color === 'red' ? 'bg-red-100 text-red-800' :
                          role.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          role.color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Уровень {role.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Доступные функции:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((permission) => (
                            <span 
                              key={permission}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {permission.split('.')[1]}
                            </span>
                          ))}
                          {role.permissions.length > 4 && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              +{role.permissions.length - 4} еще
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
