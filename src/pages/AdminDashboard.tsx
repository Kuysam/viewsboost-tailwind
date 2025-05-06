import React, { useState, Suspense, lazy, useCallback } from 'react';
import { Settings, Bell, User, Clock, Calendar, Search, LogOut } from 'lucide-react';
import SiteMapDiagram from '../components/SiteMapDiagram';

// Lazy load components for better initial load time
const PlatformHealth = lazy(() => import('../components/admin/PlatformHealth'));
const UserActivity = lazy(() => import('../components/admin/UserActivity'));
const YoutubeQuota = lazy(() => import('../components/admin/YoutubeQuota'));
const ContentInsights = lazy(() => import('../components/admin/ContentInsights'));
const AccessManagement = lazy(() => import('../components/admin/AccessManagement'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white/70">Loading...</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [currentSection, setCurrentSection] = useState('platform-health');
  const [currentSubsection, setCurrentSubsection] = useState('crash-logs');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Memoize the section change handler
  const handleSectionChange = useCallback((sectionId: string, subsectionId: string) => {
    setCurrentSection(sectionId);
    setCurrentSubsection(subsectionId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  }, []);

  // Navigation items with pre-defined configurations
  const navItems = [
    {
      id: 'platform-health',
      label: 'Platform Health',
      subsections: ['crash-logs', 'feature-usage', 'app-version']
    },
    {
      id: 'user-activity',
      label: 'User Activity',
      subsections: ['daily-logins', 'new-users', 'watch-time']
    },
    {
      id: 'youtube-quota',
      label: 'YouTube Quota',
      subsections: ['quota-usage', 'historical-graphs']
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      subsections: ['trending-videos', 'retention-analysis']
    },
    {
      id: 'access-management',
      label: 'Access Management',
      subsections: ['admin-history', 'role-management']
    }
  ];

  // Memoized content renderer
  const renderContent = useCallback(() => {
    const props = { activeSubsection: currentSubsection };
    
    switch (currentSection) {
      case 'platform-health':
        return <PlatformHealth {...props} />;
      case 'user-activity':
        return <UserActivity {...props} />;
      case 'youtube-quota':
        return <YoutubeQuota {...props} />;
      case 'ai-insights':
        return <ContentInsights {...props} />;
      case 'access-management':
        return <AccessManagement {...props} />;
      default:
        return <PlatformHealth {...props} />;
    }
  }, [currentSection, currentSubsection]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181818] via-[#232526] to-[#0a0a0a] text-white">
      <div className="relative min-h-screen bg-[url('/images/satin-phone-bg.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10">
          {/* Header */}
          <header className="sticky top-0 z-30 backdrop-blur-md bg-black/40 border-b border-gray-800">
            <div className="px-4 lg:px-8 py-4">
              {/* Logo and Menu Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-yellow-500 animate-spin-slow" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                </div>
                
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="w-6 h-0.5 bg-white mb-1.5" />
                  <div className="w-6 h-0.5 bg-white mb-1.5" />
                  <div className="w-6 h-0.5 bg-white" />
                </button>
              </div>

              {/* Navigation */}
              <nav className={`${
                isMobileMenuOpen ? 'block' : 'hidden'
              } lg:block transition-all duration-200 ease-in-out`}>
                <div className="flex flex-col gap-4">
                  {/* Centered Menu Items */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id, item.subsections[0])}
                        className={`text-left px-4 py-2 rounded-lg transition-colors ${
                          currentSection === item.id
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'text-white hover:bg-white/5'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* Centered Quick Actions */}
                  <div className="flex items-center gap-2 justify-center mt-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <Bell className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <User className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </header>

          {/* Add the site map diagram below your header or wherever you want */}
          <div className="my-8">
            <SiteMapDiagram />
          </div>

          {/* Main Content */}
          <main className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb */}
              <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
                <span>Dashboard</span>
                <span>→</span>
                <span className="text-white/70">
                  {navItems.find(item => item.id === currentSection)?.label}
                </span>
              </div>

              {/* Content */}
              <Suspense fallback={<LoadingFallback />}>
                <div className="bg-black/30 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-800">
                  {renderContent()}
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 