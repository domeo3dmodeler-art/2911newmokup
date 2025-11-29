'use client';

import React, { useState } from 'react';

interface ConnectionLineProps {
  sourceId: string;
  targetId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  sourceSize?: { width: number; height: number };
  targetSize?: { width: number; height: number };
  connectionType: 'data' | 'filter' | 'cart' | 'navigate';
  isActive: boolean;
  onClick: () => void;
  zoom: number;
}

export function ConnectionLine({ 
  sourcePosition, 
  targetPosition, 
  sourceSize = { width: 300, height: 200 },
  targetSize = { width: 300, height: 200 },
  connectionType, 
  isActive, 
  onClick,
  zoom 
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Вычисляем путь линии с учетом размеров элементов
  const startX = sourcePosition.x + sourceSize.width / 2; // Центр элемента источника
  const startY = sourcePosition.y + sourceSize.height / 2;
  const endX = targetPosition.x + targetSize.width / 2;
  const endY = targetPosition.y + targetSize.height / 2;

  // Создаем кривую Безье для красивого соединения
  const controlPoint1X = startX + (endX - startX) * 0.5;
  const controlPoint1Y = startY;
  const controlPoint2X = startX + (endX - startX) * 0.5;
  const controlPoint2Y = endY;

  const pathData = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;

  const getConnectionColor = () => {
    if (!isActive) return '#d1d5db'; // серый для неактивных
    if (isHovered) return '#3b82f6'; // синий при наведении
    
    switch (connectionType) {
      case 'data': return '#10b981'; // зеленый
      case 'filter': return '#f59e0b'; // оранжевый
      case 'cart': return '#8b5cf6'; // фиолетовый
      case 'navigate': return '#06b6d4'; // голубой
      default: return '#6b7280'; // серый
    }
  };

  const getConnectionIcon = () => {
    switch (connectionType) {
      case 'data': return '📊';
      case 'filter': return '🔍';
      case 'cart': return '🛒';
      case 'navigate': return '🧭';
      default: return '🔗';
    }
  };

  return (
    <g>
      {/* Основная линия */}
      <path
        d={pathData}
        stroke={getConnectionColor()}
        strokeWidth={isHovered ? 3 : 2}
        fill="none"
        strokeDasharray={!isActive ? '5,5' : '0'}
        className="cursor-pointer transition-all duration-200"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Стрелка на конце */}
      <polygon
        points={`${endX-5},${endY-3} ${endX+5},${endY} ${endX-5},${endY+3}`}
        fill={getConnectionColor()}
        className="cursor-pointer transition-all duration-200"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Иконка типа связи в середине линии */}
      {isActive && (
        <circle
          cx={startX + (endX - startX) * 0.5}
          cy={startY + (endY - startY) * 0.5}
          r="12"
          fill="white"
          stroke={getConnectionColor()}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200"
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
      
      {/* Текст иконки */}
      {isActive && (
        <text
          x={startX + (endX - startX) * 0.5}
          y={startY + (endY - startY) * 0.5 + 4}
          textAnchor="middle"
          fontSize="10"
          fill={getConnectionColor()}
          className="cursor-pointer pointer-events-none select-none"
        >
          {getConnectionIcon()}
        </text>
      )}
      
      {/* Подсветка при наведении */}
      {isHovered && (
        <path
          d={pathData}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="8"
          fill="none"
          className="pointer-events-none"
        />
      )}
    </g>
  );
}
