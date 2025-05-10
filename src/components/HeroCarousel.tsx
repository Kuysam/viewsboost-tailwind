// src/components/HeroCarousel.tsx
import React from 'react';

interface HeroCarouselProps {
  items: any[];
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  return (
    <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
      {/* TODO: implement your carousel here */}
      <span className="text-gray-500">HeroCarousel placeholder</span>
    </div>
  );
}
