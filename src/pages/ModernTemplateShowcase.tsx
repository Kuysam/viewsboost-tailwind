import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Crown, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModernTemplateGrid from '../components/ModernTemplateGrid';
import { toast, Toaster } from 'react-hot-toast';

const ModernTemplateShowcase: React.FC = () => {
  const navigate = useNavigate();

  // Sample templates with modern features
  const sampleTemplates = [
    {
      id: '1',
      title: 'TikTok Dance Challenge',
      category: 'TikTok Shorts',
      desc: 'Trending dance challenge template with dynamic transitions and beat-synced effects',
      preview: '/videos/video1.mp4',
      videoSource: '/videos/video1.mp4',
      icon: '💃',
      platform: 'TikTok',
      quality: 'premium',
      tags: ['dance', 'trending', 'music', 'viral'],
      isPremium: true,
      isNew: true,
      isTrending: true,
      likes: 2340,
      views: 45600,
      duration: '0:15',
      aspectRatio: '9:16',
      creator: { name: 'DanceStudio Pro', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '2',
      title: 'YouTube Gaming Intro',
      category: 'YouTube',
      desc: 'Epic gaming intro with 3D effects and customizable text animations',
      preview: '/videos/video2.mp4',
      videoSource: '/videos/video2.mp4',
      icon: '🎮',
      platform: 'YouTube',
      quality: 'premium',
      tags: ['gaming', 'intro', '3d', 'epic'],
      isPremium: true,
      isNew: false,
      isTrending: true,
      likes: 1890,
      views: 23400,
      duration: '0:08',
      aspectRatio: '16:9',
      creator: { name: 'GameMaster FX', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '3',
      title: 'Instagram Fashion Reel',
      category: 'Instagram',
      desc: 'Stylish fashion showcase with smooth transitions and color grading',
      preview: '/videos/video3.mp4',
      videoSource: '/videos/video3.mp4',
      icon: '👗',
      platform: 'Instagram',
      quality: 'free',
      tags: ['fashion', 'style', 'trendy', 'outfit'],
      isPremium: false,
      isNew: true,
      isTrending: false,
      likes: 987,
      views: 12300,
      duration: '0:30',
      aspectRatio: '9:16',
      creator: { name: 'StyleCraft', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '4',
      title: 'Business Presentation',
      category: 'Business',
      desc: 'Professional presentation template with animated charts and graphs',
      preview: '/videos/video4.mp4',
      icon: '📊',
      platform: 'LinkedIn',
      quality: 'premium',
      tags: ['business', 'presentation', 'professional', 'charts'],
      isPremium: true,
      isNew: false,
      isTrending: false,
      likes: 543,
      views: 8900,
      duration: '1:20',
      aspectRatio: '16:9',
      creator: { name: 'BizTemplate Pro', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '5',
      title: 'Food Recipe Tutorial',
      category: 'Food & Cooking',
      desc: 'Step-by-step cooking tutorial with ingredient highlights and timer effects',
      preview: '/videos/video5.mp4',
      videoSource: '/videos/video5.mp4',
      icon: '👨‍🍳',
      platform: 'YouTube',
      quality: 'free',
      tags: ['cooking', 'recipe', 'tutorial', 'food'],
      isPremium: false,
      isNew: true,
      isTrending: true,
      likes: 3240,
      views: 67800,
      duration: '2:15',
      aspectRatio: '16:9',
      creator: { name: 'ChefMaster', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '6',
      title: 'Travel Vlog Opener',
      category: 'Travel',
      desc: 'Cinematic travel opener with map animations and location pins',
      preview: '/videos/video6.mp4',
      videoSource: '/videos/video6.mp4',
      icon: '✈️',
      platform: 'YouTube',
      quality: 'premium',
      tags: ['travel', 'vlog', 'cinematic', 'adventure'],
      isPremium: true,
      isNew: false,
      isTrending: false,
      likes: 1560,
      views: 34200,
      duration: '0:12',
      aspectRatio: '16:9',
      creator: { name: 'Wanderlust Media', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '7',
      title: 'Workout Motivation',
      category: 'Fitness',
      desc: 'High-energy workout template with motivational text and beat drops',
      icon: '💪',
      platform: 'Instagram',
      quality: 'free',
      tags: ['fitness', 'workout', 'motivation', 'energy'],
      isPremium: false,
      isNew: true,
      isTrending: true,
      likes: 2100,
      views: 41500,
      duration: '0:45',
      aspectRatio: '9:16',
      creator: { name: 'FitLife Studio', avatar: '/images/viewsboost-logo.png' }
    },
    {
      id: '8',
      title: 'Tech Product Review',
      category: 'Technology',
      desc: 'Clean tech review template with product highlights and spec callouts',
      icon: '📱',
      platform: 'YouTube',
      quality: 'premium',
      tags: ['tech', 'review', 'product', 'gadget'],
      isPremium: true,
      isNew: false,
      isTrending: false,
      likes: 876,
      views: 15600,
      duration: '3:30',
      aspectRatio: '16:9',
      creator: { name: 'TechReview Pro', avatar: '/images/viewsboost-logo.png' }
    }
  ];

  const handleTemplateSelect = (template: any) => {
    toast.success(`Opening ${template.title} in editor!`, {
      icon: '🎨',
      duration: 2000,
    });
    // Simulate navigation to editor
    setTimeout(() => {
      navigate('/studio');
    }, 1000);
  };

  const handleTemplatePreview = (template: any) => {
    toast.success(`Previewing ${template.title}`, {
      icon: '👀',
      duration: 1500,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17171c] to-[#232438] text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Navigation */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <div className="h-6 w-px bg-white/20" />
              <nav className="flex items-center gap-2 text-sm text-gray-400">
                <span>ViewsBoost</span>
                <span>/</span>
                <span className="text-white">Modern Template Showcase</span>
              </nav>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6"
              >
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                  Modern Templates
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                  Experience the future of template design with live thumbnails, interactive previews, and professional-grade quality
                </p>
              </motion.div>

              {/* Feature Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 mb-8"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full font-semibold">
                  <Crown size={16} />
                  Premium Quality
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full font-semibold">
                  <Sparkles size={16} />
                  AI-Enhanced
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-red-500 text-white rounded-full font-semibold">
                  <Zap size={16} />
                  Trending Now
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-indigo-500 text-white rounded-full font-semibold">
                  <Star size={16} />
                  Editor's Choice
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
              >
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-400">50K+</div>
                  <div className="text-sm text-gray-400">Templates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-green-400">1M+</div>
                  <div className="text-sm text-gray-400">Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-400">99%</div>
                  <div className="text-sm text-gray-400">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-pink-400">24/7</div>
                  <div className="text-sm text-gray-400">Support</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <ModernTemplateGrid
              templates={sampleTemplates}
              onTemplateSelect={handleTemplateSelect}
              onTemplatePreview={handleTemplatePreview}
              loading={false}
              viewMode="grid"
              showFilters={true}
            />
          </motion.div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-6 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-3xl p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Create Amazing Content?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join millions of creators who trust ViewsBoost for their video templates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/studio')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Start Creating Now
              </button>
              <button
                onClick={() => navigate('/category/TikTok%20Shorts')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors border border-white/20"
              >
                Browse All Templates
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplateShowcase;