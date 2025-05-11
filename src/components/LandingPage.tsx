import { useNavigate, Link } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const dark = localStorage.getItem('theme') === 'dark';

  return (
    // force exactly viewport height; no scroll
    <div
      className={`relative w-full h-screen flex flex-col ${
        dark ? '' : ''
      } bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center text-white`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Top header (logo + actions) */}
      <div className="relative z-10 flex justify-between items-center px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-12 h-12" />
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            ViewsBoost
          </span>
        </Link>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="text-white hover:text-yellow-400 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-4 py-2 rounded-lg shadow hover:scale-105 transition"
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-2xl mb-4">
          Welcome to <span className="text-yellow-400">ViewsBoost</span>
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl text-gray-200">
          Revolutionize YouTube growth with AI-powered views, engagement, and earnings.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold px-6 py-3 rounded-lg shadow hover:scale-105 transition"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
