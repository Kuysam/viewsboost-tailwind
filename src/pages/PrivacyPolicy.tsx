// src/pages/PrivacyPolicy.tsx
import React from 'react';
import BaseLayout from '../components/BaseLayout';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black py-6 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-yellow-400">Privacy Policy</h1>
          <p className="text-gray-400 mt-2">How we protect and handle your data</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              ViewsBoost collects minimal information necessary to provide our services, including 
              account information, usage data, and preferences to enhance your experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed">
              We use collected information to provide, maintain, and improve our services, 
              personalize your experience, and communicate important updates about our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement industry-standard security measures to protect your personal information 
              and maintain the confidentiality of your data through encryption and secure storage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed">
              Our platform integrates with Firebase for authentication and data storage, 
              and external APIs for content discovery. These services have their own privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to access, update, or delete your personal information. 
              You can also opt out of certain data collection practices at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, 
              please contact us through the support channels provided in the application.
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