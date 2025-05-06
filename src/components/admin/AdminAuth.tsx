import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_PASSWORD = '212003Cham212003Kuysam!!';

export default function AdminAuth() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();
  const MAX_ATTEMPTS = 3;

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (attempts >= MAX_ATTEMPTS) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    if (password === ADMIN_PASSWORD) {
      // Store admin authentication in session storage
      sessionStorage.setItem('adminAuthenticated', 'true');
      navigate('/admin-panel');
    } else {
      setAttempts(prev => prev + 1);
      setError(`Invalid password. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-black/60 backdrop-blur-md p-8 rounded-lg text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-white/10 focus:ring-2 focus:ring-yellow-500 placeholder-gray-400"
              placeholder="Enter Admin Password"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={attempts >= MAX_ATTEMPTS}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
              attempts >= MAX_ATTEMPTS
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:scale-105'
            }`}
          >
            {attempts >= MAX_ATTEMPTS ? 'Access Locked' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          Press Esc to exit
        </div>
      </div>
    </div>
  );
} 