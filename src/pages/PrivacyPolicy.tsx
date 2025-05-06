// src/pages/PrivacyPolicy.tsx
import React from 'react';
import BaseLayout from '../components/BaseLayout';

export default function PrivacyPolicy() {
  return (
    <BaseLayout>
      <div className="p-6 max-w-3xl mx-auto bg-black/60 backdrop-blur-md rounded-lg text-white">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-2">
          This Privacy Policy describes how ViewsBoost (“we”, “us”, or “our”) collects,
          uses, and shares your personal information when you use our application.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Information We Collect</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Google account information when you sign in.</li>
          <li>Channel IDs and public YouTube data for analytics and display.</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-4 mb-2">How We Use Information</h2>
        <ul className="list-disc list-inside mb-4">
          <li>To authenticate you via Google Sign-In.</li>
          <li>To fetch and display your YouTube channel data and analytics.</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Data Sharing</h2>
        <p className="mb-4">
          We do not share your personal data with third parties except as required
          by law or to provide services (e.g., YouTube API). Your data remains within
          our Firebase project.
        </p>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Contact Us</h2>
        <p>If you have any questions, please contact us at support@viewsboost.com.</p>
      </div>
    </BaseLayout>
  );
}