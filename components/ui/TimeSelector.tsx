'use client';

import React from 'react';

interface TimeSelectorProps {
  label: string;
  value: string; // formato "HH:mm" o "HH:mm:ss"
  onChange: (value: string) => void;
}

export default function TimeSelector({ label, value, onChange }: TimeSelectorProps) {
  // Parsear valor actual "HH:mm"
  const cleanValue = value ? value.slice(0, 5) : '18:00';
  const [currentHour, currentMinute] = cleanValue.split(':');

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    onChange(`${newHour}:${currentMinute || '00'}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    onChange(`${currentHour || '18'}:${newMinute}`);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <select
          value={currentHour || '18'}
          onChange={handleHourChange}
          className="w-1/2 ig-input px-3 py-3 text-sm font-bold"
        >
          {hours.map(h => (
            <option key={h} value={h} className="bg-[#121212] text-white">
              {h} hrs
            </option>
          ))}
        </select>
        <select
          value={currentMinute || '00'}
          onChange={handleMinuteChange}
          className="w-1/2 ig-input px-3 py-3 text-sm font-bold"
        >
          {minutes.map(m => (
            <option key={m} value={m} className="bg-[#121212] text-white">
              {m} min
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
