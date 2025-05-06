import React, { useState } from 'react';
import { 
  Menu, 
  ChevronDown, 
  Activity, 
  Box, 
  Users, 
  BarChart2, 
  Youtube, 
  Brain,
  Shield,
  Settings,
  MonitorSmartphone
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  subsections?: {
    id: string;
    label: string;
  }[];
}

const menuItems: MenuItem[] = [
  {
    id: 'platform-health',
    label: 'Platform & App Health',
    icon: Activity,
    subsections: [
      { id: 'crash-logs', label: 'Crash Logs & Errors' },
      { id: 'feature-usage', label: 'Feature Usage Analytics' },
      { id: 'app-version', label: 'App Version Monitor' },
      { id: 'recent-feature-usage', label: 'Recent Feature Usage' },
      { id: 'platform-logs', label: 'Platform Logs' }
    ]
  },
  {
    id: 'user-activity',
    label: 'User Activity & Growth',
    icon: Users,
    subsections: [
      { id: 'daily-logins', label: 'Daily Logins Graph' },
      { id: 'new-users', label: 'New Users Registered' },
      { id: 'watch-time', label: 'Watch Time Analytics' },
      { id: 'active-users', label: 'Top Active Users' }
    ]
  },
  {
    id: 'youtube-quota',
    label: 'YouTube API Quota',
    icon: Youtube,
    subsections: [
      { id: 'quota-usage', label: 'API Key Usage Tracking' },
      { id: 'historical-graphs', label: 'Historical API Graphs' },
      { id: 'quota-alerts', label: 'Quota Threshold Alerts' }
    ]
  },
  {
    id: 'ai-insights',
    label: 'AI & Content Insights',
    icon: Brain,
    subsections: [
      { id: 'trending-videos', label: 'Top Trending Videos' },
      { id: 'watched-channels', label: 'Most Watched Channels' },
      { id: 'retention-analysis', label: 'Viewer Retention Analysis' }
    ]
  },
  {
    id: 'access-management',
    label: 'Access & Security',
    icon: Shield,
    subsections: [
      { id: 'admin-history', label: 'Admin Login History' },
      { id: 'role-management', label: 'User Role Management' },
      { id: 'user-search', label: 'Manual User Search' },
      { id: 'account-actions', label: 'Ban/Disable Accounts' }
    ]
  }
];

interface AdminMenuProps {
  onSectionChange: (sectionId: string, subsectionId: string) => void;
  currentSection: string;
  currentSubsection: string;
}

export default function AdminMenu({ onSectionChange, currentSection, currentSubsection }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="relative">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900 w-64 shadow-xl z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:relative lg:transform-none
      `}>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Dashboard
          </h2>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => toggleSection(item.id)}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg
                  ${currentSection === item.id ? 'bg-blue-600' : 'hover:bg-gray-800'}
                  transition-colors
                `}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  expandedSection === item.id ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Subsections */}
              {expandedSection === item.id && item.subsections && (
                <div className="ml-6 space-y-1 mt-1">
                  {item.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSectionChange(item.id, sub.id);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full text-left p-2 rounded-lg text-sm
                        ${currentSection === item.id && currentSubsection === sub.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        }
                        transition-colors
                      `}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 