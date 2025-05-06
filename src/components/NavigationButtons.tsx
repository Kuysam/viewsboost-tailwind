import React from 'react';
import { Link } from 'react-router-dom';

export default function NavigationButtons() {
  return (
    <div className="flex space-x-6 justify-center mt-4">
      <Link
        to="/"
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-2 px-4 rounded-lg shadow hover:scale-105 transition"
      >
        Home
      </Link>
      <Link
        to="/disclaimer"
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold py-2 px-4 rounded-lg shadow hover:scale-105 transition"
      >
        Disclaimer
      </Link>
    </div>
  );
} 