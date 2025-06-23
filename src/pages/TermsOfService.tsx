// src/pages/TermsOfService.tsx
import React from 'react';
import BaseLayout from '../components/BaseLayout';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black py-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-yellow-400">Terms of Service</h1>
          <p className="text-gray-400 mt-2">Your agreement with ViewsBoost</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using ViewsBoost, you accept and agree to be bound by the terms 
              and provisions of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Use of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              ViewsBoost provides tools for template creation and video content development. 
              You agree to use the service responsibly and in accordance with applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed">
              Users are responsible for their content, account security, and compliance with 
              platform guidelines. Misuse of the service may result in account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of your original content. By using our service, you grant us 
              a license to host and display your content as necessary to provide our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              ViewsBoost is provided "as is" without warranties. We shall not be liable for any 
              damages arising from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
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
