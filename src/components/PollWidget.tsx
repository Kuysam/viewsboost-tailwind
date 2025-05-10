//    src/components/PollWidget.tsx
import React from 'react';

interface PollWidgetProps {
  items: any[];
}

export default function PollWidget({ items }: PollWidgetProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your Poll Widget strip */}
      <span className="text-gray-500">PollWidget placeholder</span>
    </div>
  );
}
