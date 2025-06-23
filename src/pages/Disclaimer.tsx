// src/pages/Disclaimer.tsx
// Disclaimer page component
import { useNavigate } from 'react-router-dom';

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 text-white">
      <div className="w-full max-w-3xl bg-black/60 backdrop-blur-md p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">Disclaimer</h1>

        <p className="mb-4">
          <strong>ViewsBoost</strong> is an independent platform developed to help YouTube creators
          promote their content and help viewers earn rewards by watching public videos.
        </p>

        <p className="mb-4">
          This application is <strong>not affiliated with, endorsed by, or sponsored by YouTube,
          Google LLC, or any of their subsidiaries</strong>. All trademarks, service marks, trade
          names, product names, and logos appearing on the site are the property of their respective
          owners.
        </p>

        <p className="mb-4">
          All videos embedded within this platform use the official YouTube <strong>IFrame Player
          API</strong> and are publicly available on YouTube. We do not interfere with or block
          advertisements, nor do we alter playback behavior.
        </p>

        <p className="mb-4">
          Our reward system is designed to promote <strong>authentic engagement</strong>. We do not
          offer fake views, bots, or any automated services that violate YouTube’s Terms of Service
          or Community Guidelines.
        </p>

        <p className="mb-4">
          Users are responsible for adhering to YouTube’s terms when using this platform. Any misuse
          of this service to manipulate metrics, generate artificial traffic, or violate platform
          policies will result in removal from the platform.
        </p>

        <p className="mb-4">
          For API usage, we adhere to the{' '}
          <a
            href="https://developers.google.com/youtube/terms/api-services-terms-of-service"
            className="text-yellow-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube API Services Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/privacy"
            className="text-yellow-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Privacy Policy
          </a>
          .
        </p>

        <p className="mt-6">If you have any questions or concerns, please contact us through the official support channel provided within the app.</p>

        <button
          onClick={() => navigate(-1)}
          className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-[#0a0a0a] font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
