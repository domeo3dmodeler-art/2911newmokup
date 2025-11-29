'use client';

import React from 'react';
import { roleService, Role } from '@/lib/auth/roles';

interface UserRoleBadgeProps {
  role: Role;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserRoleBadge({ 
  role, 
  showDescription = false, 
  size = 'md' 
}: UserRoleBadgeProps) {
  const roleDef = roleService.getRole(role);
  
  if (!roleDef) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const colorClasses = {
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full border font-semibold ${colorClasses[roleDef.color as keyof typeof colorClasses]}`}>
        <span className="mr-1">{roleDef.icon}</span>
        {roleDef.name}
      </div>
      {showDescription && (
        <span className="text-sm text-gray-600">
          {roleDef.description}
        </span>
      )}
    </div>
  );
}
