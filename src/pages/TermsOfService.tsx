
// src/pages/TermsOfService.tsx
import React from 'react';
import BaseLayout from '../components/BaseLayout';

export default function TermsOfService() {
  return (
    <BaseLayout>
      <div className="p-6 max-w-3xl mx-auto bg-black/60 backdrop-blur-md rounded-lg text-white">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-2">
          By using ViewsBoost, you agree to the following terms and conditions.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">1. Use of Service</h2>
        <p className="mb-4">
          You may use this service to view and analyze your YouTube channel data.
          You must comply with YouTube’s Terms of Service when accessing content.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">2. Account Security</h2>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your Google
          account credentials and all actions taken under your account.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">3. Modifications</h2>
        <p className="mb-4">
          We may update these terms at any time. Continued use of the service
          constitutes acceptance of any changes.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Contact Us</h2>
        <p>If you have questions about these terms, email support@viewsboost.com.</p>
      </div>
    </BaseLayout>
  );
}
