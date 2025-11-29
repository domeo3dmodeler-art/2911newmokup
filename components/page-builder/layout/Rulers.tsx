'use client';

import React from 'react';

interface RulersProps {
  width: number;
  height: number;
  zoom: number;
}

export function Rulers({ width, height, zoom }: RulersProps) {
  const scale = zoom;
  const tickSize = 20 * scale;
  const majorTickSize = 100 * scale;

  // Генерация меток для линейки
  const generateTicks = (size: number, step: number, majorStep: number) => {
    const ticks = [];
    for (let i = 0; i <= size; i += step) {
      const isMajor = i % majorStep === 0;
      ticks.push(
        <div
          key={i}
          className="absolute text-xs text-gray-500 select-none"
          style={{
            left: i,
            top: isMajor ? 0 : 4,
            fontSize: '10px',
            transform: isMajor ? 'translateX(-50%)' : 'translateX(-25%)'
          }}
        >
          {isMajor ? i : ''}
        </div>
      );
    }
    return ticks;
  };

  return (
    <>
      {/* Горизонтальная линейка */}
      <div
        className="absolute bg-gray-100 border-r border-gray-300"
        style={{
          top: 0,
          left: 0,
          width: width,
          height: 24
        }}
      >
        {generateTicks(width, tickSize, majorTickSize)}
      </div>

      {/* Вертикальная линейка */}
      <div
        className="absolute bg-gray-100 border-b border-gray-300"
        style={{
          top: 0,
          left: 0,
          width: 24,
          height: height
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: Math.ceil(height / tickSize) + 1 }, (_, i) => {
            const y = i * tickSize;
            const isMajor = y % majorTickSize === 0;
            return (
              <div
                key={i}
                className="absolute text-xs text-gray-500 select-none"
                style={{
                  top: y,
                  left: isMajor ? 0 : 4,
                  fontSize: '10px',
                  transform: isMajor ? 'translateY(-50%)' : 'translateY(-25%)',
                  writingMode: 'vertical-rl'
                }}
              >
                {isMajor ? y : ''}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
