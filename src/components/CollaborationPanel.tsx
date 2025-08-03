import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Share2, MessageCircle, History, Clock, 
  Eye, EyeOff, Crown, Mail, Link, Copy, Check,
  GitBranch, Save, Download, Bell, Settings,
  UserPlus, Shield, Globe, Lock, Star, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CollaborationPanelProps {
  projectId: string;
  onShare: (options: ShareOptions) => void;
  onClose: () => void;
}

interface ShareOptions {
  type: 'view' | 'edit' | 'comment';
  expiry?: Date;
  password?: string;
  allowDownload: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

interface Comment {
  id: string;
  author: TeamMember;
  content: string;
  timestamp: Date;
  x: number;
  y: number;
  resolved: boolean;
  replies: Comment[];
}

interface Version {
  id: string;
  name: string;
  author: TeamMember;
  timestamp: Date;
  description: string;
  thumbnail: string;
  current: boolean;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  onShare,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'team' | 'comments' | 'versions'>('share');
  const [shareType, setShareType] = useState<'view' | 'edit' | 'comment'>('view');
  const [shareSettings, setShareSettings] = useState({
    allowDownload: true,
    requirePassword: false,
    password: '',
    expiry: null as Date | null,
    publicLink: false
  });

  // Mock data
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      avatar: '👩‍💻',
      role: 'owner',
      status: 'online',
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      avatar: '👨‍🎨',
      role: 'editor',
      status: 'online',
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma@company.com',
      avatar: '👩‍🎨',
      role: 'commenter',
      status: 'away',
      lastSeen: new Date(Date.now() - 30 * 60 * 1000)
    }
  ];

  const comments: Comment[] = [
    {
      id: '1',
      author: teamMembers[1],
      content: 'Love the color scheme! Maybe we could make the title a bit larger?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      x: 320,
      y: 180,
      resolved: false,
      replies: [
        {
          id: '1-1',
          author: teamMembers[0],
          content: 'Great suggestion! I\'ll increase it by 20%',
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
          x: 0,
          y: 0,
          resolved: false,
          replies: []
        }
      ]
    }
  ];

  const versions: Version[] = [
    {
      id: '1',
      name: 'Initial Design',
      author: teamMembers[0],
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      description: 'First version with basic layout',
      thumbnail: '/api/placeholder/80/60',
      current: false
    },
    {
      id: '2',
      name: 'Color Refinements',
      author: teamMembers[1],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Updated color palette and typography',
      thumbnail: '/api/placeholder/80/60',
      current: false
    },
    {
      id: '3',
      name: 'Final Draft',
      author: teamMembers[0],
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      description: 'Ready for client review',
      thumbnail: '/api/placeholder/80/60',
      current: true
    }
  ];

  const handleGenerateLink = () => {
    const link = `https://app.viewsboost.com/shared/${projectId}?token=abc123`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard!');
  };

  const handleInviteByEmail = () => {
    toast.success('Invitation sent successfully!');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-400';
      case 'editor': return 'text-green-400';
      case 'commenter': return 'text-blue-400';
      case 'viewer': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-2xl"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Collaboration</h2>
              <div className="text-sm text-gray-400">Share and work together</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
          {[
            { id: 'share', name: 'Share', icon: <Share2 size={16} /> },
            { id: 'team', name: 'Team', icon: <Users size={16} /> },
            { id: 'comments', name: 'Comments', icon: <MessageCircle size={16} /> },
            { id: 'versions', name: 'Versions', icon: <History size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            {/* Share Type Selection */}
            <div className="space-y-3">
              <h3 className="text-white font-medium">Permission Level</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'view', label: 'View Only', icon: <Eye size={16} />, desc: 'Can only view' },
                  { type: 'comment', label: 'Comment', icon: <MessageCircle size={16} />, desc: 'Can view & comment' },
                  { type: 'edit', label: 'Edit', icon: <Users size={16} />, desc: 'Can view & edit' }
                ].map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setShareType(option.type as any)}
                    className={`p-3 rounded-lg border text-left transition ${
                      shareType === option.type
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Share Options</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Allow downloads</span>
                <button
                  onClick={() => setShareSettings(prev => ({ ...prev, allowDownload: !prev.allowDownload }))}
                  className={`w-12 h-6 rounded-full transition ${
                    shareSettings.allowDownload ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    shareSettings.allowDownload ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Password protect</span>
                <button
                  onClick={() => setShareSettings(prev => ({ ...prev, requirePassword: !prev.requirePassword }))}
                  className={`w-12 h-6 rounded-full transition ${
                    shareSettings.requirePassword ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    shareSettings.requirePassword ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {shareSettings.requirePassword && (
                <input
                  type="password"
                  placeholder="Enter password"
                  value={shareSettings.password}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
                />
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Public link</span>
                <button
                  onClick={() => setShareSettings(prev => ({ ...prev, publicLink: !prev.publicLink }))}
                  className={`w-12 h-6 rounded-full transition ${
                    shareSettings.publicLink ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    shareSettings.publicLink ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              <button
                onClick={handleGenerateLink}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Link size={18} />
                Generate Share Link
              </button>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
                />
                <button
                  onClick={handleInviteByEmail}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  <Mail size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Team Members ({teamMembers.length})</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                <UserPlus size={16} />
                Invite
              </button>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg">
                      {member.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusIndicator(member.status)} rounded-full border-2 border-gray-900`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{member.name}</span>
                      {member.role === 'owner' && <Crown size={14} className="text-yellow-400" />}
                    </div>
                    <div className="text-sm text-gray-400">{member.email}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getRoleColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {member.status === 'online' ? 'Online' : 
                       member.status === 'away' ? 'Away' : 
                       `Last seen ${member.lastSeen.toLocaleTimeString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Comments ({comments.length})</h3>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Resolve All
              </button>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  className="bg-gray-800/50 rounded-lg p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                      {comment.author.avatar}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{comment.author.name}</span>
                        <span className="text-xs text-gray-400">
                          {comment.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{comment.content}</p>
                      
                      {comment.replies.length > 0 && (
                        <div className="space-y-2 border-l-2 border-gray-600 pl-3 ml-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs">
                                {reply.author.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-medium">{reply.author.name}</span>
                                  <span className="text-xs text-gray-400">
                                    {reply.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-3">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          Reply
                        </button>
                        <button className="text-green-400 hover:text-green-300 text-sm">
                          Resolve
                        </button>
                        <button className="text-gray-400 hover:text-gray-300 text-sm">
                          <Heart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Version History</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                <Save size={16} />
                Save Version
              </button>
            </div>

            <div className="space-y-3">
              {versions.map((version) => (
                <motion.div
                  key={version.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                    version.current
                      ? 'border-blue-400 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-16 h-12 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-400">IMG</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{version.name}</span>
                      {version.current && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mb-1">{version.description}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{version.author.name}</span>
                      <span>•</span>
                      <span>{version.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!version.current && (
                      <button className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition">
                        <GitBranch size={14} />
                      </button>
                    )}
                    <button className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition">
                      <Download size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CollaborationPanel; 