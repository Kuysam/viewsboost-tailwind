// src/pages/Disclaimer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black py-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-yellow-400">Disclaimer</h1>
          <p className="text-gray-400 mt-2">Important information about ViewsBoost</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Educational Purpose</h2>
            <p className="text-gray-300 leading-relaxed">
              ViewsBoost is designed for educational and creative purposes. This platform demonstrates 
              video template creation and social media content development workflows.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Content Responsibility</h2>
            <p className="text-gray-300 leading-relaxed">
              Users are responsible for ensuring their content complies with platform guidelines 
              and applicable laws. ViewsBoost does not endorse any specific content or claims made by users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed">
              This platform integrates with various third-party services including YouTube, Firebase, 
              and external content APIs. We are not responsible for the availability or content of these services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">No Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              ViewsBoost is provided "as is" without warranties of any kind. We do not guarantee 
              uninterrupted service, data accuracy, or fitness for any particular purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              In no event shall ViewsBoost be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising from your use of the platform.
            </p>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <button 
            onClick={() => window.history.back()} 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </main>
    </div>
  );
}
