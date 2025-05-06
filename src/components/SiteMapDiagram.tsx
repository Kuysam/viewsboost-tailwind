import React from "react";

export default function SiteMapDiagram() {
  return (
    <div className="flex justify-center items-center py-8">
      <svg width="350" height="400" viewBox="0 0 350 400">
        {/* Landing Page */}
        <circle cx="175" cy="40" r="40" stroke="black" strokeWidth="2" fill="white" />
        <text x="175" y="45" textAnchor="middle" fontSize="18" fontWeight="bold" fill="black">Landing Page</text>
        {/* Home */}
        <line x1="175" y1="80" x2="175" y2="120" stroke="black" strokeWidth="2"/>
        <circle cx="175" cy="140" r="35" stroke="black" strokeWidth="2" fill="white" />
        <text x="175" y="145" textAnchor="middle" fontSize="16" fontWeight="bold" fill="black">Home</text>
        {/* Home branches */}
        <line x1="175" y1="175" x2="55" y2="220" stroke="black" strokeWidth="2"/>
        <line x1="175" y1="175" x2="115" y2="220" stroke="black" strokeWidth="2"/>
        <line x1="175" y1="175" x2="175" y2="220" stroke="black" strokeWidth="2"/>
        <line x1="175" y1="175" x2="235" y2="220" stroke="black" strokeWidth="2"/>
        <line x1="175" y1="175" x2="295" y2="220" stroke="black" strokeWidth="2"/>
        {/* Shorts */}
        <circle cx="55" cy="240" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="55" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">Shorts</text>
        {/* Live */}
        <circle cx="115" cy="240" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="115" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">Live</text>
        {/* News */}
        <circle cx="175" cy="240" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="175" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">News</text>
        {/* Studio */}
        <circle cx="235" cy="240" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="235" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">Studio</text>
        {/* Profile */}
        <circle cx="295" cy="240" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="295" y="245" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">Profile</text>
        {/* /:userId */}
        <line x1="175" y1="270" x2="175" y2="320" stroke="black" strokeWidth="2"/>
        <circle cx="175" cy="340" r="30" stroke="black" strokeWidth="2" fill="white" />
        <text x="175" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="black">/:userId</text>
      </svg>
    </div>
  );
} 