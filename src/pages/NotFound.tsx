// src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">The page you're looking for doesn't exist.</p>
      <Link 
        to="/" 
        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-[#0a0a0a] font-semibold py-2 px-6 rounded-lg shadow-lg hover:scale-105 transition"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
