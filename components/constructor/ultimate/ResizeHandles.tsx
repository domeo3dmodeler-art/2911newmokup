'use client';

import React from 'react';
import type { BlockSettings } from './types';

interface ResizeHandlesProps {
  block: BlockSettings;
  onStartResize: (e: React.MouseEvent, handle: string) => void;
}

export function ResizeHandles({ block, onStartResize }: ResizeHandlesProps) {
  const handles = [
    { position: 'n', cursor: 'n-resize', icon: '↕' },
    { position: 's', cursor: 's-resize', icon: '↕' },
    { position: 'e', cursor: 'e-resize', icon: '↔' },
    { position: 'w', cursor: 'w-resize', icon: '↔' },
    { position: 'ne', cursor: 'ne-resize', icon: '↗' },
    { position: 'nw', cursor: 'nw-resize', icon: '↖' },
    { position: 'se', cursor: 'se-resize', icon: '↘' },
    { position: 'sw', cursor: 'sw-resize', icon: '↙' }
  ];

  return (
    <>
      {handles.map(({ position, cursor, icon }) => (
        <div
          key={position}
          className={`resize-handle resize-handle-${position}`}
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            cursor: cursor,
            zIndex: 1000,
            ...(position === 'n' && { top: '-4px', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 's' && { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'e' && { right: '-4px', top: '50%', transform: 'translateY(-50%)' }),
            ...(position === 'w' && { left: '-4px', top: '50%', transform: 'translateY(-50%)' }),
            ...(position === 'ne' && { top: '-4px', right: '-4px' }),
            ...(position === 'nw' && { top: '-4px', left: '-4px' }),
            ...(position === 'se' && { bottom: '-4px', right: '-4px' }),
            ...(position === 'sw' && { bottom: '-4px', left: '-4px' })
          }}
          onMouseDown={(e) => onStartResize(e, position)}
        />
      ))}
    </>
  );
}

