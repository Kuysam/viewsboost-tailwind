import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-4">
      <input
        type="text"
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-gray-900 text-white"
        placeholder="Search videos..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
} 