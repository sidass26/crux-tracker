'use client';

import { FormFactor } from '@/lib/types';

interface Props {
  value: FormFactor;
  onChange: (value: FormFactor) => void;
}

export default function FormFactorToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        onClick={() => onChange('PHONE')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 'PHONE'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Mobile
      </button>
      <button
        onClick={() => onChange('DESKTOP')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          value === 'DESKTOP'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Desktop
      </button>
    </div>
  );
}
