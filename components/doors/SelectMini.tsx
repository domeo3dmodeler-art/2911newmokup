'use client';

import React from 'react';

interface SelectMiniProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allowEmpty?: boolean;
}

export function SelectMini({
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
}: SelectMiniProps) {
  return (
    <label className="text-xs space-y-1">
      <div className="text-gray-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        className="w-full border border-black/20 px-2 py-1 text-xs text-black"
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

