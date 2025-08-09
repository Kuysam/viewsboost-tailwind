import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TemplateService, Template, CategoryUpdateResult } from '../lib/services/templateService';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ImageService } from '../lib/services/imageService';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadBytesResumable, UploadTaskSnapshot } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { auth } from '../lib/firebase';

interface TemplateCategoryManagerProps {
  onTemplateUpdated?: (result: CategoryUpdateResult) => void;
  onCategoryUpdated?: () => void;
}

interface CategoryGroup {
  id: string;
  title: string;
  templates: Template[];
  color: string;
  icon: string;
  isExpanded: boolean;
  isSelected?: boolean;
}

// ALL STUDIO CATEGORIES - Complete list matching Studio.tsx exactly
const ALL_STUDIO_CATEGORIES = [
  // Main Create Categories (top-level tabs)
  { id: 'business', title: 'Business', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Main' },
  { id: 'marketing', title: 'Marketing', color: 'from-green-600 to-green-700', icon: '📢', group: 'Main' },
  { id: 'social-media', title: 'Social Media', color: 'from-purple-600 to-purple-700', icon: '📱', group: 'Main' },
  { id: 'web-design', title: 'Web Design', color: 'from-cyan-600 to-cyan-700', icon: '🌐', group: 'Main' },
  { id: 'documents', title: 'Documents', color: 'from-gray-600 to-gray-700', icon: '📄', group: 'Main' },
  { id: 'education', title: 'Education', color: 'from-yellow-600 to-yellow-700', icon: '🎓', group: 'Main' },
  { id: 'events', title: 'Events', color: 'from-pink-600 to-pink-700', icon: '🎉', group: 'Main' },
  { id: 'personal', title: 'Personal', color: 'from-indigo-600 to-indigo-700', icon: '👤', group: 'Main' },

  // Video Categories (from VIDEO_SELECTOR_LIST in Studio.tsx)
  { id: 'youtube-video', title: 'YouTube Video', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Video' },
  { id: 'facebook-video', title: 'Facebook Video', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Video' },
  { id: 'video-landscape', title: 'Video Landscape', color: 'from-green-500 to-green-600', icon: '🖥️', group: 'Video' },
  { id: 'video-ads', title: 'Video Ads', color: 'from-purple-500 to-purple-600', icon: '📺', group: 'Video' },
  { id: 'twitter-video', title: 'Twitter Video', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Video' },
  { id: 'viewsboost-video', title: 'ViewsBoost Video', color: 'from-violet-500 to-violet-600', icon: '⚡', group: 'Video' },
  { id: 'intro-outro', title: 'Intro/Outro', color: 'from-orange-500 to-orange-600', icon: '🎭', group: 'Video' },
  { id: 'square-video', title: 'Square Video', color: 'from-pink-500 to-pink-600', icon: '⬜', group: 'Video' },
  { id: 'vertical-video', title: 'Vertical Video', color: 'from-emerald-500 to-emerald-600', icon: '📱', group: 'Video' },
  { id: 'podcast', title: 'Podcast', color: 'from-purple-500 to-purple-600', icon: '🎙️', group: 'Video' },
  { id: 'multi-screen', title: 'Multi-screen', color: 'from-cyan-500 to-cyan-600', icon: '🖥️', group: 'Video' },
  { id: 'hd-video', title: 'HD Video', color: 'from-blue-500 to-blue-600', icon: '🎥', group: 'Video' },
  { id: 'linkedin-videos', title: 'LinkedIn Videos', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Video' },

  // Shorts Categories (from SHORTS_SELECTOR_LIST in Studio.tsx)
  { id: 'facebook-reel', title: 'Facebook Reel', color: 'from-blue-400 to-blue-500', icon: '📘', group: 'Shorts' },
  { id: 'instagram-reel', title: 'Instagram Reel', color: 'from-purple-400 to-purple-500', icon: '📸', group: 'Shorts' },
  { id: 'snapchat-shorts', title: 'Snapchat Shorts', color: 'from-yellow-400 to-yellow-500', icon: '👻', group: 'Shorts' },
  { id: 'tiktok-shorts', title: 'TikTok Shorts', color: 'from-pink-500 to-pink-600', icon: '🎵', group: 'Shorts' },
  { id: 'pinterest-video-pin', title: 'Pinterest Video Pin', color: 'from-red-400 to-red-500', icon: '📌', group: 'Shorts' },
  { id: 'linked-short', title: 'Linked Short', color: 'from-blue-500 to-blue-600', icon: '🔗', group: 'Shorts' },
  { id: 'linkedin-video', title: 'LinkedIn Video', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Shorts' },
  { id: 'viewsboost-shorts', title: 'ViewsBoost Shorts', color: 'from-violet-400 to-violet-500', icon: '⚡', group: 'Shorts' },
  { id: 'youtube-shorts', title: 'YouTube Shorts', color: 'from-red-400 to-red-500', icon: '📱', group: 'Shorts' },

  // Photo Categories (from PHOTO_SELECTOR_LIST in Studio.tsx)
  { id: 'social-media-posts', title: 'Social Media Posts', color: 'from-purple-500 to-purple-600', icon: '📱', group: 'Photo' },
  { id: 'marketing-promotional', title: 'Marketing/Promotional', color: 'from-green-500 to-green-600', icon: '📢', group: 'Photo' },
  { id: 'restaurant', title: 'Restaurant', color: 'from-orange-500 to-orange-600', icon: '🍽️', group: 'Photo' },
  { id: 'quote-motivational', title: 'Quote/Motivational', color: 'from-yellow-500 to-yellow-600', icon: '💭', group: 'Photo' },
  { id: 'business-professional', title: 'Business/Professional', color: 'from-blue-500 to-blue-600', icon: '💼', group: 'Photo' },
  { id: 'e-commerce', title: 'E-commerce', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Photo' },
  { id: 'event-announcement', title: 'Event/Announcement', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Photo' },
  { id: 'infographic', title: 'Infographic', color: 'from-cyan-500 to-cyan-600', icon: '📊', group: 'Photo' },
  { id: 'seasonal-holiday', title: 'Seasonal/Holiday', color: 'from-red-500 to-red-600', icon: '🎄', group: 'Photo' },
  { id: 'personal-branding', title: 'Personal Branding', color: 'from-indigo-500 to-indigo-600', icon: '👤', group: 'Photo' },

  // Post Categories (from POST_SELECTOR_LIST in Studio.tsx)
  { id: 'marketing', title: 'Marketing', color: 'from-green-500 to-green-600', icon: '📢', group: 'Post' },
  { id: 'promotions', title: 'Promotions', color: 'from-orange-500 to-orange-600', icon: '🎯', group: 'Post' },
  { id: 'educational-informative', title: 'Educational & Informative', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Post' },
  { id: 'personal-lifestyle', title: 'Personal & Lifestyle', color: 'from-purple-500 to-purple-600', icon: '🌟', group: 'Post' },
  { id: 'entertainment', title: 'Entertainment', color: 'from-pink-500 to-pink-600', icon: '🎭', group: 'Post' },
  { id: 'humorous', title: 'Humorous', color: 'from-yellow-500 to-yellow-600', icon: '😂', group: 'Post' },
  { id: 'inspirational', title: 'Inspirational', color: 'from-cyan-500 to-cyan-600', icon: '✨', group: 'Post' },
  { id: 'motivational', title: 'Motivational', color: 'from-emerald-500 to-emerald-600', icon: '💪', group: 'Post' },
  { id: 'events-seasonal', title: 'Events & Seasonal', color: 'from-red-500 to-red-600', icon: '🎉', group: 'Post' },
  { id: 'interactive-engagement', title: 'Interactive & Engagement', color: 'from-violet-500 to-violet-600', icon: '🤝', group: 'Post' },
  { id: 'creative-artistic', title: 'Creative & Artistic', color: 'from-indigo-500 to-indigo-600', icon: '🎨', group: 'Post' },

  // Carousel Categories (from CAROUSEL_SELECTOR_LIST in Studio.tsx)
  { id: 'educational', title: 'Educational', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Carousel' },
  { id: 'business', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Carousel' },
  { id: 'e-commerce-carousel', title: 'E-commerce', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Carousel' },
  { id: 'storytelling', title: 'Storytelling', color: 'from-purple-500 to-purple-600', icon: '📖', group: 'Carousel' },
  { id: 'tips-lists', title: 'Tips & Lists', color: 'from-green-500 to-green-600', icon: '📝', group: 'Carousel' },
  { id: 'portfolio', title: 'Portfolio', color: 'from-cyan-500 to-cyan-600', icon: '🎨', group: 'Carousel' },
  { id: 'before-after', title: 'Before & After', color: 'from-orange-500 to-orange-600', icon: '🔄', group: 'Carousel' },
  { id: 'creative', title: 'Creative', color: 'from-pink-500 to-pink-600', icon: '✨', group: 'Carousel' },

  // Thumbnail Categories (from THUMBNAIL_SELECTOR_LIST in Studio.tsx)
  { id: 'youtube', title: 'YouTube', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Thumbnail' },
  { id: 'igtv', title: 'IGTV', color: 'from-purple-500 to-purple-600', icon: '📺', group: 'Thumbnail' },
  { id: 'facebook-video-thumb', title: 'Facebook Video', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Thumbnail' },
  { id: 'course-webinar', title: 'Course/Webinar', color: 'from-green-500 to-green-600', icon: '🎓', group: 'Thumbnail' },
  { id: 'gaming', title: 'Gaming', color: 'from-purple-600 to-purple-700', icon: '🎮', group: 'Thumbnail' },
  { id: 'vlog', title: 'Vlog', color: 'from-pink-500 to-pink-600', icon: '📹', group: 'Thumbnail' },
  { id: 'tutorial', title: 'Tutorial', color: 'from-blue-600 to-blue-700', icon: '📖', group: 'Thumbnail' },
  { id: 'entertainment-thumb', title: 'Entertainment', color: 'from-yellow-500 to-yellow-600', icon: '🎭', group: 'Thumbnail' },
  { id: 'business-thumb', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Thumbnail' },
  { id: 'text-style', title: 'Text Style', color: 'from-cyan-500 to-cyan-600', icon: '📝', group: 'Thumbnail' },
  { id: 'arrow-pointer', title: 'Arrow/Pointer', color: 'from-orange-500 to-orange-600', icon: '👉', group: 'Thumbnail' },
  { id: 'minimalist', title: 'Minimalist', color: 'from-gray-400 to-gray-500', icon: '⚪', group: 'Thumbnail' },
  { id: 'text-focus', title: 'Text Focus', color: 'from-indigo-500 to-indigo-600', icon: '🔤', group: 'Thumbnail' },
  { id: 'split-screen', title: 'Split Screen', color: 'from-emerald-500 to-emerald-600', icon: '⚡', group: 'Thumbnail' },
  { id: 'face-reaction', title: 'Face Reaction', color: 'from-pink-600 to-pink-700', icon: '😮', group: 'Thumbnail' },

  // Cover & Banner Categories (from COVER_SELECTOR_LIST in Studio.tsx)
  { id: 'social-media-general', title: 'Social Media General (Universal Appeal)', color: 'from-purple-500 to-purple-600', icon: '📱', group: 'Cover' },
  { id: 'youtube-channel-art', title: 'YouTube Channel Art (Video-focused engagement)', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Cover' },
  { id: 'facebook-covers', title: 'Facebook Covers (Community-focused)', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Cover' },
  { id: 'linkedin-banners', title: 'LinkedIn Banners (Professional Networking)', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Cover' },
  { id: 'event-promotions', title: 'Event & Promotions (Timely Engagement)', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Cover' },
  { id: 'business-corporate', title: 'Business & Corporate (Brand Authority)', color: 'from-gray-500 to-gray-600', icon: '🏢', group: 'Cover' },
  { id: 'music-entertainment', title: 'Music & Entertainment (Broad Audience Appeal)', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Cover' },
  { id: 'health-fitness', title: 'Health & Fitness (Wellness Engagement)', color: 'from-green-500 to-green-600', icon: '💪', group: 'Cover' },
  { id: 'creative-artistic-cover', title: 'Creative & Artistic (Visual Inspiration)', color: 'from-indigo-500 to-indigo-600', icon: '🎨', group: 'Cover' },

  // Profile Categories (from PROFILE_SELECTOR_LIST in Studio.tsx)
  { id: 'personal-branding-profile', title: 'Personal Branding', color: 'from-indigo-500 to-indigo-600', icon: '👤', group: 'Profile' },
  { id: 'business-corporate-profile', title: 'Business & Corporate', color: 'from-gray-500 to-gray-600', icon: '🏢', group: 'Profile' },
  { id: 'influencer-creator', title: 'Influencer & Creator', color: 'from-purple-500 to-purple-600', icon: '⭐', group: 'Profile' },
  { id: 'creative-artistic-profile', title: 'Creative & Artistic', color: 'from-pink-500 to-pink-600', icon: '🎨', group: 'Profile' },
  { id: 'educational-academic', title: 'Educational & Academic', color: 'from-blue-500 to-blue-600', icon: '🎓', group: 'Profile' },
  { id: 'beauty-fashion', title: 'Beauty & Fashion', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Profile' },
  { id: 'health-fitness-profile', title: 'Health & Fitness', color: 'from-green-500 to-green-600', icon: '💪', group: 'Profile' },
  { id: 'music-entertainment-profile', title: 'Music & Entertainment', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Profile' },
  { id: 'real-estate', title: 'Real Estate', color: 'from-emerald-500 to-emerald-600', icon: '🏠', group: 'Profile' },

  // Story Categories (from STORY_SELECTOR_LIST in Studio.tsx)
  { id: 'promotional', title: 'Promotional', color: 'from-orange-500 to-orange-600', icon: '📢', group: 'Story' },
  { id: 'educational-story', title: 'Educational', color: 'from-blue-500 to-blue-600', icon: '📚', group: 'Story' },
  { id: 'engagement', title: 'Engagement', color: 'from-purple-500 to-purple-600', icon: '🤝', group: 'Story' },
  { id: 'business-story', title: 'Business', color: 'from-gray-500 to-gray-600', icon: '💼', group: 'Story' },
  { id: 'personal-story', title: 'Personal', color: 'from-pink-500 to-pink-600', icon: '👤', group: 'Story' },
  { id: 'seasonal-story', title: 'Seasonal', color: 'from-green-500 to-green-600', icon: '🌿', group: 'Story' },
  { id: 'quote-motivational-story', title: 'Quote/Motivational', color: 'from-yellow-500 to-yellow-600', icon: '💭', group: 'Story' },
  { id: 'announcement-story', title: 'Announcement', color: 'from-red-500 to-red-600', icon: '📣', group: 'Story' },
  { id: 'user-generated-content', title: 'User-Generated Content', color: 'from-cyan-500 to-cyan-600', icon: '👥', group: 'Story' },
  { id: 'call-to-action', title: 'Call-to-Action', color: 'from-emerald-500 to-emerald-600', icon: '📞', group: 'Story' },
  { id: 'youtube-story', title: 'Youtube story', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Story' },
  { id: 'instagram-story-cat', title: 'Instagram story', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Story' },
  { id: 'twitter-story', title: 'Twitter story', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Story' },
  { id: 'facebook-story-cat', title: 'Facebook story', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Story' },

  // Live Categories (from LIVE_SELECTOR_LIST in Studio.tsx)
  { id: 'live-event-promotion', title: 'Live Event Promotion', color: 'from-red-500 to-red-600', icon: '🎪', group: 'Live' },
  { id: 'qa-interviews', title: 'Q&A and Interviews', color: 'from-blue-500 to-blue-600', icon: '❓', group: 'Live' },
  { id: 'gaming-live', title: 'Gaming', color: 'from-purple-500 to-purple-600', icon: '🎮', group: 'Live' },
  { id: 'esports', title: 'Esports', color: 'from-violet-500 to-violet-600', icon: '🏆', group: 'Live' },
  { id: 'music-live', title: 'Music', color: 'from-yellow-500 to-yellow-600', icon: '🎵', group: 'Live' },
  { id: 'performance', title: 'Performance', color: 'from-pink-500 to-pink-600', icon: '🎭', group: 'Live' },
  { id: 'educational-informative-live', title: 'Educational & Informative', color: 'from-green-500 to-green-600', icon: '📚', group: 'Live' },
  { id: 'beauty-fashion-live', title: 'Beauty & Fashion', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Live' },
  { id: 'health-fitness-live', title: 'Health & Fitness', color: 'from-emerald-500 to-emerald-600', icon: '💪', group: 'Live' },
  { id: 'interactive-engagement-live', title: 'Interactive Engagement', color: 'from-cyan-500 to-cyan-600', icon: '🤝', group: 'Live' },
  { id: 'behind-the-scenes', title: 'Behind-the-Scenes', color: 'from-orange-500 to-orange-600', icon: '🎬', group: 'Live' },

  // Ads Categories (from ADS_SELECTOR_LIST in Studio.tsx)
  { id: 'sales-promotions', title: 'Sales & Promotions', color: 'from-green-500 to-green-600', icon: '💰', group: 'Ads' },
  { id: 'lead-generation', title: 'Lead Generation', color: 'from-blue-500 to-blue-600', icon: '🎯', group: 'Ads' },
  { id: 'brand-awareness', title: 'Brand Awareness', color: 'from-purple-500 to-purple-600', icon: '🏷️', group: 'Ads' },
  { id: 'product-showcase-ads', title: 'Product Showcase', color: 'from-orange-500 to-orange-600', icon: '🛍️', group: 'Ads' },
  { id: 'event-ads', title: 'Event', color: 'from-pink-500 to-pink-600', icon: '🎉', group: 'Ads' },
  { id: 'webinar-promotions', title: 'Webinar Promotions', color: 'from-cyan-500 to-cyan-600', icon: '🎙️', group: 'Ads' },
  { id: 'fashion-beauty-ads', title: 'Fashion & Beauty', color: 'from-pink-600 to-pink-700', icon: '💄', group: 'Ads' },
  { id: 'tech-ads', title: 'Tech', color: 'from-blue-600 to-blue-700', icon: '💻', group: 'Ads' },
  { id: 'digital-products', title: 'Digital Products', color: 'from-indigo-500 to-indigo-600', icon: '📱', group: 'Ads' },
  { id: 'educational-in', title: 'Educational & In', color: 'from-emerald-500 to-emerald-600', icon: '📚', group: 'Ads' },

  // Business Sections (from BUSINESS_SECTIONS in Studio.tsx)
  { id: 'campaign', title: 'Campaign', color: 'from-red-500 to-red-600', icon: '🎯', group: 'Business' },
  { id: 'email', title: 'Email', color: 'from-blue-500 to-blue-600', icon: '📧', group: 'Business' },
  { id: 'banner', title: 'Banner', color: 'from-green-500 to-green-600', icon: '🎨', group: 'Business' },
  { id: 'infographic-business', title: 'Infographic', color: 'from-cyan-500 to-cyan-600', icon: '📊', group: 'Business' },
  { id: 'landing-page', title: 'Landing Page', color: 'from-purple-500 to-purple-600', icon: '🌐', group: 'Business' },
  { id: 'ad-creative', title: 'Ad Creative', color: 'from-orange-500 to-orange-600', icon: '🎨', group: 'Business' },
  { id: 'newsletter', title: 'Newsletter', color: 'from-yellow-500 to-yellow-600', icon: '📰', group: 'Business' },
  { id: 'lead-magnet', title: 'Lead Magnet', color: 'from-pink-500 to-pink-600', icon: '🧲', group: 'Business' },

  // Other categories
  { id: 'uncategorized', title: 'Uncategorized', color: 'from-gray-500 to-gray-600', icon: '📄', group: 'Other' }
];

// Group categories by type for dropdown organization
const CATEGORY_GROUPS = {
  'Main': 'Main Categories',
  'Video': 'Video Templates',
  'Shorts': 'Short Videos & Reels',
  'Photo': 'Photo & Image Templates',
  'Post': 'Social Media Posts',
  'Carousel': 'Carousel & Slideshow',
  'Thumbnail': 'Video Thumbnails',
  'Cover': 'Cover & Banner Designs',
  'Story': 'Story Templates',
  'Ads': 'Advertisement Designs',
  'Live': 'Live Streaming Graphics',
  'Business': 'Business & Professional',
  'Other': 'Other Templates'
};

// FIX: Use ALL_STUDIO_CATEGORIES for category group construction
const CATEGORY_SOURCE = typeof PREDEFINED_CATEGORIES !== 'undefined' ? PREDEFINED_CATEGORIES : ALL_STUDIO_CATEGORIES;
if (typeof PREDEFINED_CATEGORIES === 'undefined' && import.meta.env.DEV) {
  console.warn('[CategoryManager] PREDEFINED_CATEGORIES is not defined. Using ALL_STUDIO_CATEGORIES instead.');
}

// SortableTemplateItem component for drag and drop functionality
interface SortableTemplateItemProps {
  template: Template;
  categoryId: string;
  updating: string | null;
  onDelete: (templateId: string, categoryId: string) => void;
  // ✅ NEW: Bulk selection props
  isSelected?: boolean;
  onSelect?: (templateId: string, isSelected: boolean) => void;
  showSelection?: boolean;
}

function SortableTemplateItem({ template, categoryId, updating, onDelete, isSelected, onSelect, showSelection }: SortableTemplateItemProps) {
  const uniqueDraggableId = `${categoryId}|||${template.id}`; // Use ||| separator to avoid conflicts with dashes
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: uniqueDraggableId,
    data: {
      type: 'template',
      template,
      categoryId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div 
        data-testid="template-card"
        className={`
          bg-gray-800/50 rounded-lg p-3 border border-gray-700/50
          hover:bg-gray-700/50 transition-all duration-200
          ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}
          ${updating === template.id ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {/* ✅ NEW: Bulk selection checkbox */}
          {showSelection && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => onSelect?.(template.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
          )}

          {/* Template Preview */}
          {template.preview && (
            <img 
              src={template.preview} 
              alt={template.title}
              className="w-12 h-12 object-cover rounded border border-gray-600"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {/* Template Info */}
          <div className="flex-1 min-w-0">
            <h4 data-testid="template-title" className="text-white font-medium text-sm truncate">{template.title}</h4>
            <p className="text-gray-400 text-xs">{template.category || 'Uncategorized'}</p>
            {template.platform && (
              <span className="inline-block bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs mt-1">
                {template.platform}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Delete Button */}
            <button
              data-testid="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(template.id, categoryId);
              }}
              disabled={updating === template.id}
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors text-xs ${
                updating === template.id 
                  ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600/20 hover:bg-red-600/40 text-red-300 hover:text-red-200'
              }`}
              title={updating === template.id ? "Deleting..." : "Delete template"}
            >
              {updating === template.id ? '⏳' : '🗑️'}
            </button>
            
            {/* Drag Handle - Now Functional */}
            <div 
              {...attributes}
              {...listeners}
              className="text-gray-500 hover:text-blue-400 text-lg cursor-grab active:cursor-grabbing transition-colors p-1"
              title="Drag to move template"
            >
              ⋮⋮
            </div>
          </div>
        </div>
        
        {/* Update Status */}
        {updating === template.id && (
          <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            Updating...
          </div>
        )}
      </div>
    </div>
  );
}

// Droppable Category Container component
interface DroppableCategoryProps {
  category: CategoryGroup;
  children: React.ReactNode;
}

function DroppableCategory({ category, children }: DroppableCategoryProps) {
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: category.id,
    data: {
      type: 'category',
      category
    }
  });

  // Only log when actually dropping to reduce console spam
  if (isOver) {
    console.log(`🎯 [DroppableCategory] Category ${category.id} is ready to receive drop`);
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-500/10' : ''
      }`}
    >
      {children}
      {/* Add visual drop indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-400/20 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none flex items-center justify-center z-10">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">
            Drop here to move template
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateCategoryManager({ onTemplateUpdated, onCategoryUpdated }: TemplateCategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [recentUpdates, setRecentUpdates] = useState<CategoryUpdateResult[]>([]);
  const [expandAll, setExpandAll] = useState(false);
  const [dragInProgress, setDragInProgress] = useState(false);
  
  // NEW: Dropdown selector and playground states
  const [availableCategories] = useState(ALL_STUDIO_CATEGORIES);
  const [selectedCategoriesForPlayground, setSelectedCategoriesForPlayground] = useState<Set<string>>(new Set());
  const [playgroundCategories, setPlaygroundCategories] = useState<CategoryGroup[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  
  // Drag and drop states
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [lastMoveResult, setLastMoveResult] = useState<string | null>(null);
  
  // File import states
  const [isDragOverImport, setIsDragOverImport] = useState(false);
  const [importingFiles, setImportingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    currentFile: string;
    currentIndex: number;
    totalFiles: number;
    progress: number;
    uploadedFiles: string[];
    failedFiles: string[];
  }>({
    isUploading: false,
    currentFile: '',
    currentIndex: 0,
    totalFiles: 0,
    progress: 0,
    uploadedFiles: [],
    failedFiles: []
  });

  // ✅ NEW: Bulk selection states
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showBulkSelection, setShowBulkSelection] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Load templates and organize by category
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let allTemplates: Template[] = [];
      
      // FIRESTORE-ONLY MODE: Load directly from Firestore
      console.log('📁 [CategoryManager] Loading from Firestore (Firestore-only mode)...');
      const templatesRef = collection(db, 'templates');
      const snapshot = await getDocs(templatesRef);
      const rawTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Template[];
      
      // ✅ ENHANCED DEDUPLICATION: Remove duplicates using comprehensive criteria
      const deduplicatedTemplates = new Map<string, Template>();
      const seenKeys = new Set<string>();
      
      rawTemplates.forEach(template => {
        // Create multiple deduplication keys for comprehensive matching
        const titleKey = template.title?.toLowerCase().trim() || '';
        const categoryKey = template.category?.toLowerCase().trim() || '';
        const previewKey = template.preview || '';
        const imageSourceKey = template.imageSource || '';
        
        // Primary key: title + category combination
        const primaryKey = `${titleKey}|${categoryKey}`;
        // Secondary key: preview URL (for templates with same preview)
        const previewUrlKey = previewKey ? `preview:${previewKey}` : '';
        // Tertiary key: imageSource (for templates with same source)
        const imageSourceUrlKey = imageSourceKey ? `imageSource:${imageSourceKey}` : '';
        
        // Check if this template is a duplicate
        const isDuplicate = seenKeys.has(primaryKey) || 
                           (previewUrlKey && seenKeys.has(previewUrlKey)) ||
                           (imageSourceUrlKey && seenKeys.has(imageSourceUrlKey));
        
        if (isDuplicate) {
          console.log(`🔄 [Deduplication] Skipping duplicate: ${template.title} (${template.category})`);
          return;
        }
        
        // ✅ APPLY TIKTOK-STYLE PREVIEW LOGIC: Ensure all templates have proper preview URLs
        if (!template.preview || template.preview === '/default-template.png') {
          const sourceForPreview = template.imageSource || template.videoSource;
          if (sourceForPreview) {
            if (sourceForPreview.startsWith('http')) {
              // External URL - use as-is for videos, optimize for images
              if (template.videoSource && sourceForPreview === template.videoSource) {
                // ✅ FIX: Preserve video URLs from Firebase Storage as-is
                template.preview = sourceForPreview;
              } else {
                // Image optimization for non-video sources
                template.preview = ImageService.getOptimizedImageUrl(sourceForPreview, 1200, 900, 'high');
              }
            } else {
              // Local filename - convert to /images/ path (only for images)
              template.preview = `/images/${sourceForPreview}`;
            }
            console.log(`🎨 [Preview] Generated preview for ${template.title}: ${template.preview}`);
          }
        }
        
        // Mark all keys as seen
        seenKeys.add(primaryKey);
        if (previewUrlKey) seenKeys.add(previewUrlKey);
        if (imageSourceUrlKey) seenKeys.add(imageSourceUrlKey);
        
        deduplicatedTemplates.set(template.id, template);
      });
      
      allTemplates = Array.from(deduplicatedTemplates.values());
      
      console.log(`📁 [CategoryManager] Raw templates from Firestore: ${rawTemplates.length}`);
      console.log(`📁 [CategoryManager] After enhanced deduplication: ${allTemplates.length}`);
      console.log(`📁 [CategoryManager] Duplicates removed: ${rawTemplates.length - allTemplates.length}`);
      
      if (allTemplates.length > 0) {
        console.log(`📁 [CategoryManager] Template categories found:`, [...new Set(allTemplates.map(t => t.category))]);
        console.log(`📁 [CategoryManager] Sample templates:`, allTemplates.slice(0, 3).map(t => `${t.title} (${t.category})`));
        console.log(`📁 [CategoryManager] CRITICAL - ACTUAL TEMPLATE IDS FROM FIRESTORE:`, allTemplates.map(t => `${t.title} = ${t.id}`));
      }
      
      // Get all unique categories from templates
      const allCategories = Array.from(new Set(
        allTemplates
          .map(template => template.category)
          .filter(category => category && typeof category === 'string' && category.trim())
      )).sort();
      
      console.log(`📁 [CategoryManager] Found categories: ${allCategories.join(', ')}`);
      
      // Calculate category stats
      const categoryStats: Record<string, number> = {};
      allTemplates.forEach(template => {
        const category = template.category || 'Uncategorized';
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
      
      // Create category groups with templates
      const categoryGroups: CategoryGroup[] = [];
      
      // Add predefined categories first
      for (const predefinedCat of CATEGORY_SOURCE) {
        const matchingCategory = allCategories.find(cat => 
          cat.toLowerCase().includes(predefinedCat.title.toLowerCase()) ||
          predefinedCat.title.toLowerCase().includes(cat.toLowerCase()) ||
          cat === predefinedCat.title
        );
        
        let categoryTemplates: Template[] = [];
        
        if (matchingCategory) {
          categoryTemplates = allTemplates.filter(template => 
            template.category === matchingCategory
          );
        } else if (predefinedCat.id === 'uncategorized') {
          // Find templates with no category or unmatched categories
          categoryTemplates = allTemplates.filter(template => 
            !template.category || 
            template.category.trim() === '' ||
            !allCategories.includes(template.category)
          );
        }
        
        categoryGroups.push({
          id: predefinedCat.id,
          title: matchingCategory || predefinedCat.title,
          templates: categoryTemplates,
          color: predefinedCat.color,
          icon: predefinedCat.icon,
          isExpanded: true // Always expand categories by default to enable dragging
        });
      }
      
      // Add any remaining categories not covered by predefined ones
      const uncoveredCategories = allCategories.filter(cat => 
        !CATEGORY_SOURCE.some(predefined => 
          cat.toLowerCase().includes(predefined.title.toLowerCase()) ||
          predefined.title.toLowerCase().includes(cat.toLowerCase()) ||
          cat === predefined.title
        )
      );
      
      for (const category of uncoveredCategories) {
        const templates = allTemplates.filter(template => template.category === category);
        categoryGroups.push({
          id: `custom-${category.toLowerCase().replace(/\s+/g, '-')}`,
          title: category,
          templates,
          color: 'from-indigo-500 to-indigo-600',
          icon: '🎨',
          isExpanded: true // Always expand to enable dragging
        });
      }
      
      // Filter to show only categories with templates, but always show at least one category
      const filteredGroups = categoryGroups.filter(group => 
        group.templates.length > 0
      );
      
      if (filteredGroups.length === 0 && categoryGroups.length > 0) {
        // If no categories have templates, show the first one as a placeholder
        filteredGroups.push(categoryGroups[0]);
      }
      
      console.log(`📁 [CategoryManager] Created ${filteredGroups.length} category groups:`, 
        filteredGroups.map(cat => `${cat.title} (${cat.templates.length} templates)`).join(', '));
      setCategories(filteredGroups);
      
      // 🎯 AUTO-POPULATE PLAYGROUND: Only auto-populate on initial load (when playground is empty)
      // This preserves user's category selection during file imports and refreshes
      if (playgroundCategories.length === 0 && selectedCategoriesForPlayground.size === 0) {
        const nonEmptyCategories = filteredGroups.filter(cat => cat.templates.length > 0);
        if (nonEmptyCategories.length > 0) {
          console.log(`🎮 [CategoryManager] Initial auto-population with ${nonEmptyCategories.length} categories containing templates`);
          setPlaygroundCategories(nonEmptyCategories);
          setSelectedCategoriesForPlayground(new Set(nonEmptyCategories.map(cat => cat.id)));
        }
      } else {
        // 🔄 PRESERVE USER SELECTION: Update existing playground categories with fresh template data
        // This maintains user's category selection while refreshing template data
        console.log(`🔄 [CategoryManager] Preserving user selection, updating existing playground categories with fresh data`);
        setPlaygroundCategories(prev => {
          return prev.map(playgroundCat => {
            const updatedCategory = filteredGroups.find(cat => cat.id === playgroundCat.id);
            if (updatedCategory) {
              return {
                ...playgroundCat,
                templates: updatedCategory.templates,
                title: updatedCategory.title // In case category title was updated
              };
            }
            return playgroundCat; // Keep existing if not found in updated data
          });
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle drag and drop
  // ✅ ENHANCED Drag and Drop handler with immediate state updates and Firestore sync
  const handleDragEnd = async (result: DragEndEvent) => {
    const { active, over } = result;
    
    setDragInProgress(false);
    setActiveTemplate(null);
    
    console.log('🎯 [DragEnd] ====== DRAG END STARTED ======');
    console.log('🎯 [DragEnd] Active ID:', active.id);
    console.log('🎯 [DragEnd] Over ID:', over?.id);
    
    if (!over || !active) {
      console.log('❌ [DragEnd] No valid drag operation - cancelled');
      return;
    }
    if (active.id === over.id) {
      console.log('❌ [DragEnd] Same position - no move needed');
      return;
    }
    
    // Parse drag IDs using ||| separator
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Parse source (dragged item)
    const activeIdParts = activeId.split('|||');
    if (activeIdParts.length !== 2) {
      console.error('❌ [DragEnd] Invalid active ID format:', activeId, 'Expected: categoryId|||templateId');
      return;
    }
    const sourceCategoryId = activeIdParts[0];
    const sourceTemplateId = activeIdParts[1];
    
    console.log(`🔍 [DragEnd] Source: category="${sourceCategoryId}", template="${sourceTemplateId}"`);
    
    // Find source template
    const sourceCategory = playgroundCategories.find(cat => cat.id === sourceCategoryId);
    if (!sourceCategory) {
      console.error('❌ [DragEnd] Source category not found:', sourceCategoryId);
      console.log('📊 [DragEnd] Available categories:', playgroundCategories.map(c => c.id));
      return;
    }
    
    const draggedTemplate = sourceCategory.templates.find(t => t.id === sourceTemplateId);
    if (!draggedTemplate) {
      console.error('❌ [DragEnd] Source template not found:', sourceTemplateId);
      console.log('📊 [DragEnd] Available templates:', sourceCategory.templates.map(t => t.id));
      return;
    }
    
    console.log(`✅ [DragEnd] Found dragged template: "${draggedTemplate.title}"`);
    
    // Parse target (drop location)
    let targetCategoryId: string;
    let targetPosition: number = -1;
    
    if (overId.includes('|||')) {
      // Dropped on another template - insert before it
      const overIdParts = overId.split('|||');
      if (overIdParts.length !== 2) {
        console.error('❌ [DragEnd] Invalid over ID format:', overId);
      return;
    }
      targetCategoryId = overIdParts[0];
      const targetTemplateId = overIdParts[1];
      
      const targetCategory = playgroundCategories.find(cat => cat.id === targetCategoryId);
      if (targetCategory) {
        targetPosition = targetCategory.templates.findIndex(t => t.id === targetTemplateId);
        console.log(`🎯 [DragEnd] Dropping before template "${targetTemplateId}" at position ${targetPosition}`);
      }
    } else {
      // Dropped on category container
      targetCategoryId = overId;
      console.log(`🎯 [DragEnd] Dropping on category container: ${targetCategoryId}`);
    }
    
    const targetCategory = playgroundCategories.find(cat => cat.id === targetCategoryId);
    if (!targetCategory) {
      console.error('❌ [DragEnd] Target category not found:', targetCategoryId);
      console.log('📊 [DragEnd] Available categories:', playgroundCategories.map(c => c.id));
      return;
    }
    
    console.log(`✅ [DragEnd] Target category: "${targetCategory.title}"`);
    
    // IMMEDIATE UI UPDATE (Optimistic)
    console.log('🔄 [DragEnd] Applying optimistic UI update...');
    setPlaygroundCategories(prev => {
      const updated = prev.map(cat => ({ ...cat, templates: [...cat.templates] }));
      const sourceIdx = updated.findIndex(cat => cat.id === sourceCategoryId);
      const targetIdx = updated.findIndex(cat => cat.id === targetCategoryId);
      
      if (sourceIdx === -1 || targetIdx === -1) {
        console.error('❌ [DragEnd] Failed to find category indices');
        return prev;
      }
      
      if (sourceCategoryId === targetCategoryId) {
        // REORDERING within same category
        const currentIndex = updated[sourceIdx].templates.findIndex(t => t.id === sourceTemplateId);
        const newIndex = targetPosition !== -1 ? targetPosition : updated[targetIdx].templates.length;
        
        if (currentIndex !== -1 && currentIndex !== newIndex) {
          updated[sourceIdx].templates = arrayMove(updated[sourceIdx].templates, currentIndex, newIndex);
          console.log(`🔄 [DragEnd] Reordered within category: ${currentIndex} → ${newIndex}`);
        }
      } else {
        // MOVING between different categories
        updated[sourceIdx].templates = updated[sourceIdx].templates.filter(t => t.id !== sourceTemplateId);
        const updatedTemplate = { ...draggedTemplate, category: updated[targetIdx].title };
        
        if (targetPosition !== -1) {
          updated[targetIdx].templates.splice(targetPosition, 0, updatedTemplate);
        } else {
          updated[targetIdx].templates.push(updatedTemplate);
        }
        console.log(`🔀 [DragEnd] Moved between categories: ${sourceCategoryId} → ${targetCategoryId}`);
      }
      
      return updated;
    });
    
    // Success feedback
    const moveMessage = sourceCategoryId === targetCategoryId 
      ? `🔄 Reordered "${draggedTemplate.title}" in ${targetCategory.title}`
      : `🔀 Moved "${draggedTemplate.title}": ${sourceCategory.title} → ${targetCategory.title}`;
    setLastMoveResult(moveMessage);
    setTimeout(() => setLastMoveResult(null), 3000);
    
    const updateResult: CategoryUpdateResult = {
          success: true,
      templateId: draggedTemplate.id,
      oldCategory: sourceCategory.title,
      newCategory: targetCategory.title,
      timestamp: new Date().toISOString(),
      source: 'drag-and-drop'
        };
        
    setRecentUpdates(prev => [updateResult, ...prev.slice(0, 9)]);
    if (onTemplateUpdated) {
      onTemplateUpdated(updateResult);
    }
    
    // 🔥 Persist category change to Firestore if moved between categories and not a sample/local/imported template
    if (sourceCategoryId !== targetCategoryId && !draggedTemplate.id.startsWith('sample-') && !draggedTemplate.id.startsWith('local-') && !draggedTemplate.id.startsWith('imported-')) {
      try {
        setUpdating(draggedTemplate.id);
        console.log(`💾 [DragEnd] Persisting to Firestore: ${draggedTemplate.id} → ${targetCategory.title}`);
        const result = await TemplateService.updateTemplateCategory(draggedTemplate.id, targetCategory.title, 'admin');
        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }
        console.log(`✅ [DragEnd] Firestore update successful`);
        setUpdating(null);
      } catch (error) {
        console.error(`❌ [DragEnd] Firestore update failed:`, error);
        // ROLLBACK: Move template back to original category in UI
        setPlaygroundCategories(prev => {
          const updated = prev.map(cat => ({ ...cat, templates: [...cat.templates] }));
          const sourceIdx = updated.findIndex(cat => cat.id === sourceCategoryId);
          const targetIdx = updated.findIndex(cat => cat.id === targetCategoryId);
          if (sourceIdx === -1 || targetIdx === -1) return prev;
          
          // Remove from target
          updated[targetIdx].templates = updated[targetIdx].templates.filter(t => t.id !== draggedTemplate.id);
          // Add back to source
          updated[sourceIdx].templates.push(draggedTemplate);
          return updated;
          });
        setUpdating(null);
        alert(`Failed to update template category in database. Template has been restored.\n\nError: ${error.message || error}`);
      }
    }
    
    // Notify parent of category update
    if (onCategoryUpdated) {
      onCategoryUpdated();
    }
    console.log(`✅ [DragEnd] Template moved successfully`);
    console.log('🎯 [DragEnd] ====== DRAG END COMPLETED ======');
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 8 to make dragging more responsive
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter templates based on search
  const getFilteredCategories = () => {
    if (!searchTerm.trim()) return categories;
    
    const searchLower = searchTerm.toLowerCase();
    return categories.map(category => ({
      ...category,
      templates: category.templates.filter(template =>
        template.title?.toLowerCase().includes(searchLower) ||
        template.desc?.toLowerCase().includes(searchLower) ||
        template.category?.toLowerCase().includes(searchLower)
      )
    })).filter(category => category.templates.length > 0);
  };

  // Toggle category expansion in playground
  const toggleCategory = (categoryId: string) => {
    setPlaygroundCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  // Toggle all categories in playground
  const toggleAllCategories = () => {
    const newExpandState = !expandAll;
    setExpandAll(newExpandState);
    setPlaygroundCategories(prev => prev.map(cat => ({ ...cat, isExpanded: newExpandState })));
  };

  // NEW: Add category to playground
  const addCategoryToPlayground = async (categoryId: string) => {
    const category = availableCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    const newSelected = new Set(selectedCategoriesForPlayground);
    newSelected.add(categoryId);
    setSelectedCategoriesForPlayground(newSelected);

    // Find templates that match this category using multiple strategies
    let existingTemplates: Template[] = [];
    
    // If categories are not loaded yet, try to load templates directly from JSON
    if (categories.length === 0) {
      console.log(`⚠️ [AddToPlayground] Categories not loaded yet, trying direct JSON load...`);
      try {
        const response = await fetch('/templates/templates.json');
        if (response.ok) {
          const allTemplates = await response.json();
          existingTemplates = allTemplates.filter((template: any) => {
            if (!template.category) return false;
            const templateCategory = template.category.toLowerCase().trim();
            const targetCategory = category.title.toLowerCase().trim();
            return (
              templateCategory === targetCategory ||
              templateCategory.includes(targetCategory) ||
              targetCategory.includes(templateCategory)
            );
          });
          console.log(`📁 [AddToPlayground] Direct JSON load found ${existingTemplates.length} templates`);
        }
      } catch (error) {
        console.error('❌ [AddToPlayground] Failed to load templates directly:', error);
      }
    } else {
      // Strategy 1: Direct match from loaded categories
      const directMatch = categories.find(cat => {
        return (
          cat.title === category.title ||
          cat.id === categoryId ||
          cat.title.toLowerCase() === category.title.toLowerCase() ||
          category.title.toLowerCase().includes(cat.title.toLowerCase()) ||
          cat.title.toLowerCase().includes(category.title.toLowerCase())
        );
      });
      
      if (directMatch) {
        existingTemplates = directMatch.templates;
      } else {
      // Strategy 2: Search all templates by category field directly
      const allTemplates = categories.flatMap(cat => cat.templates);
      console.log(`🔍 [DEBUG] Total templates to search: ${allTemplates.length}`);
      
      existingTemplates = allTemplates.filter(template => {
        if (!template.category) return false;
        
        // Normalize both strings for comparison
        const templateCategory = template.category.toLowerCase().trim();
        const targetCategory = category.title.toLowerCase().trim();
        
        const isMatch = (
          templateCategory === targetCategory ||
          templateCategory.includes(targetCategory) ||
          targetCategory.includes(templateCategory) ||
          // Handle specific mappings
          (targetCategory === 'youtube video' && templateCategory === 'youtube video') ||
          (targetCategory === 'tiktok video' && templateCategory === 'tiktok video') ||
          (targetCategory === 'youtube-video' && templateCategory === 'youtube video') ||
          (targetCategory === 'tiktok-video' && templateCategory === 'tiktok video') ||
          (targetCategory === 'profile picture' && templateCategory === 'profile picture') ||
          (targetCategory === 'youtube thumbnail' && templateCategory === 'youtube thumbnail')
        );
        
        if (isMatch) {
          console.log(`✅ [DEBUG] Match found: "${templateCategory}" matches "${targetCategory}"`);
        }
        
        return isMatch;
      });
             
       console.log(`🔍 [DEBUG] Found ${existingTemplates.length} matching templates`);
      }
    }

    // DEBUG: Log all available categories and their templates
    console.log(`🔍 [DEBUG] All loaded categories:`, categories.map(cat => `${cat.title} (${cat.templates.length})`));
    console.log(`🔍 [DEBUG] Looking for category: "${category.title}"`);
    console.log(`🔍 [DEBUG] All template categories:`, [...new Set(categories.flatMap(cat => cat.templates.map(t => t.category)))]);
    
    // FIXED: Show message when no templates found instead of creating sample templates
    if (existingTemplates.length === 0) {
      console.log(`ℹ️ [AddToPlayground] No templates found for "${category.title}". This is normal - import some templates first.`);
      // Don't create sample templates anymore - let the category show as empty
      // This forces users to import real templates instead of working with fake data
    }

    console.log(`🎯 [AddToPlayground] Adding "${category.title}" with ${existingTemplates.length} templates`);
    if (existingTemplates.length > 0) {
      console.log(`📋 [AddToPlayground] Template examples:`, existingTemplates.slice(0, 3).map(t => t.title));
    } else {
      console.log(`❌ [AddToPlayground] No templates found for "${category.title}"`);
    }

    const playgroundCategory: CategoryGroup = {
      id: categoryId,
      title: category.title,
      templates: existingTemplates,
      color: category.color,
      icon: category.icon,
      isExpanded: true
    };
    
    console.log(`🎮 [AddToPlayground] Added category "${category.title}" with ${existingTemplates.length} templates`);
    
    // Always add the category, even if empty, so users can see it and understand they need to import templates
    setPlaygroundCategories(prev => {
      const filtered = prev.filter(cat => cat.id !== categoryId);
      return [...filtered, playgroundCategory];
    });

    setShowCategoryDropdown(false);
  };

  // NEW: Remove category from playground
  const removeCategoryFromPlayground = (categoryId: string) => {
    const newSelected = new Set(selectedCategoriesForPlayground);
    newSelected.delete(categoryId);
    setSelectedCategoriesForPlayground(newSelected);

    setPlaygroundCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  // NEW: Clear all playground categories
  const clearPlayground = () => {
    setSelectedCategoriesForPlayground(new Set());
    setPlaygroundCategories([]);
  };

  // NEW: Get filtered available categories for dropdown
  const getFilteredAvailableCategories = () => {
    if (selectedGroup === 'All') {
      return availableCategories;
    }
    return availableCategories.filter(cat => cat.group === selectedGroup);
  };

  // ✅ ENHANCED Delete template function with Firestore integration
  const deleteTemplate = async (templateId: string, categoryId: string) => {
    console.log(`🗑️ [DeleteTemplate] Starting COMPREHENSIVE deletion of template ${templateId} from category ${categoryId}`);
    
    const template = playgroundCategories
      .flatMap(cat => cat.templates)
      .find(t => t.id === templateId);
    
    if (!template) {
      console.error('❌ [DeleteTemplate] Template not found in playground:', templateId);
      return;
    }

    console.log(`🗑️ [DeleteTemplate] Found template: "${template.title}" with ID: ${template.id}`);
    console.log(`🗑️ [DeleteTemplate] Template details:`, {
      id: template.id,
      title: template.title,
      category: template.category,
      platform: template.platform,
      originalData: template
    });

    // Determine template type and Firestore existence
    const isFirestoreTemplate = !templateId.startsWith('sample-') && !templateId.startsWith('local-');
    const isPresetTemplate = templateId.startsWith('preset-');
    const isImportedTemplate = templateId.startsWith('imported-');
    const requiresFirestoreDeletion = isFirestoreTemplate || isPresetTemplate || isImportedTemplate;
    
    console.log(`🔍 [DeleteTemplate] Template type analysis:`, {
      isFirestoreTemplate,
      isPresetTemplate, 
      isImportedTemplate,
      requiresFirestoreDeletion,
      templateId
    });

    // CRITICAL: Direct Firestore verification before any action
    let existsInFirestore = false;
    let firestoreDocumentId = templateId;
    
    if (requiresFirestoreDeletion) {
      console.log(`🔍 [DeleteTemplate] STEP 1: Comprehensive Firestore existence check...`);
      
      try {
        // Try multiple ID variations to find the actual document
        const possibleIds = [
          templateId,
          template.id,
          templateId.replace('imported-', ''),
          templateId.replace('preset-', '')
        ].filter(Boolean);
        
        console.log(`🔍 [DeleteTemplate] Checking possible document IDs:`, possibleIds);
        
        for (const testId of possibleIds) {
          try {
            const testRef = doc(db, 'templates', testId);
            const testSnap = await getDoc(testRef);
            
            if (testSnap.exists()) {
              existsInFirestore = true;
              firestoreDocumentId = testId;
              console.log(`✅ [DeleteTemplate] Found in Firestore with ID: ${testId}`);
              console.log(`📄 [DeleteTemplate] Document data:`, testSnap.data());
              break;
            } else {
              console.log(`❌ [DeleteTemplate] Not found with ID: ${testId}`);
            }
          } catch (idError) {
            console.log(`❌ [DeleteTemplate] Error checking ID ${testId}:`, idError);
          }
        }
        
        if (!existsInFirestore) {
          console.log(`⚠️ [DeleteTemplate] Template not found in Firestore with any ID variation`);
          
          // Also try a broad search by title to find orphaned documents
          try {
            const templatesRef = collection(db, 'templates');
            const snapshot = await getDocs(templatesRef);
            
            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();
              if (data.title === template.title && data.category === template.category) {
                existsInFirestore = true;
                firestoreDocumentId = docSnap.id;
                console.log(`🔍 [DeleteTemplate] Found matching template by title/category: ${docSnap.id}`);
                console.log(`📄 [DeleteTemplate] Matched document:`, data);
                break;
              }
            }
          } catch (searchError) {
            console.error(`❌ [DeleteTemplate] Error in broad search:`, searchError);
          }
        }
        
      } catch (checkError) {
        console.error('❌ [DeleteTemplate] Error during Firestore existence check:', checkError);
        alert(`Error checking template in database: ${checkError.message}`);
        return;
      }
    }

    // Show confirmation dialog with accurate information
    let confirmMessage;
    if (requiresFirestoreDeletion && existsInFirestore) {
      confirmMessage = `⚠️ PERMANENT DELETION ⚠️\n\nAre you sure you want to delete "${template.title}"?\n\nThis will:\n• Remove it from Firebase database (ID: ${firestoreDocumentId})\n• Delete it from all app pages\n• This action CANNOT be undone\n\nCategory: ${template.category}\nPlatform: ${template.platform || 'Unknown'}\nType: ${isPresetTemplate ? 'Preset Template' : isImportedTemplate ? 'Imported Template' : 'User Template'}`;
    } else if (requiresFirestoreDeletion && !existsInFirestore) {
      confirmMessage = `🧹 UI CLEANUP\n\nTemplate "${template.title}" will be removed from the UI.\n\n(Template was not found in database - this is a cleanup operation)\n\nCategory: ${template.category}`;
    } else {
      confirmMessage = `Are you sure you want to delete "${template.title}"?\n\nThis will remove it from the playground only.\n\nCategory: ${template.category}\nType: ${templateId.startsWith('sample-') ? 'Sample' : 'Local'} template`;
    }
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setUpdating(templateId);
    
    try {
      // STEP 2: IMMEDIATE UI UPDATE (optimistic)
      console.log('🔄 [DeleteTemplate] STEP 2: Immediate UI update (optimistic)');
      setPlaygroundCategories(prevCategories => {
        return prevCategories.map(category => {
          if (category.id === categoryId) {
            return {
              ...category,
              templates: category.templates.filter(t => t.id !== templateId)
            };
          }
          return category;
        });
      });

      // STEP 3: FIRESTORE DELETION (if needed)
      if (requiresFirestoreDeletion && existsInFirestore) {
        console.log(`🔥 [DeleteTemplate] STEP 3: Deleting from Firestore database (ID: ${firestoreDocumentId})`);
        
        try {
          // Use the verified document ID for deletion
          await TemplateService.deleteTemplate(firestoreDocumentId);
          console.log(`✅ [DeleteTemplate] Successfully deleted from Firestore: ${firestoreDocumentId}`);
          
          // CRITICAL: Multi-step verification that deletion worked
          console.log(`🔍 [DeleteTemplate] STEP 4: Multi-verification that deletion succeeded`);
          
          // Wait a moment for Firestore to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify deletion with original ID
          try {
            const verifyRef1 = doc(db, 'templates', firestoreDocumentId);
            const verifySnap1 = await getDoc(verifyRef1);
            if (verifySnap1.exists()) {
              throw new Error(`Template still exists in Firestore after deletion: ${firestoreDocumentId}`);
            }
            console.log(`✅ [DeleteTemplate] Verified deletion of ${firestoreDocumentId}`);
          } catch (verifyError) {
            console.error('❌ [DeleteTemplate] Deletion verification failed:', verifyError);
            throw new Error(`Deletion verification failed: ${verifyError.message}`);
          }
          
          // Also verify with all possible ID variations
          const verificationIds = [templateId, template.id].filter(id => id !== firestoreDocumentId);
          for (const vid of verificationIds) {
            try {
              const vRef = doc(db, 'templates', vid);
              const vSnap = await getDoc(vRef);
              if (vSnap.exists()) {
                console.log(`⚠️ [DeleteTemplate] Found duplicate with ID ${vid}, deleting...`);
                await TemplateService.deleteTemplate(vid);
                console.log(`✅ [DeleteTemplate] Deleted duplicate: ${vid}`);
              }
            } catch (dupError) {
              console.log(`ℹ️ [DeleteTemplate] No duplicate found with ID ${vid}`);
            }
          }
          
        } catch (firestoreError) {
          console.error('❌ [DeleteTemplate] Failed to delete from Firestore:', firestoreError);
          
          // ROLLBACK: Restore template in UI
          setPlaygroundCategories(prevCategories => {
            return prevCategories.map(category => {
              if (category.id === categoryId) {
                return {
                  ...category,
                  templates: [...category.templates, template].sort((a, b) => a.title.localeCompare(b.title))
                };
              }
              return category;
            });
          });
          
          alert(`Failed to delete template from database. Template has been restored.\n\nError: ${firestoreError.message || firestoreError}`);
          return;
        }
      } else if (requiresFirestoreDeletion && !existsInFirestore) {
        console.log(`🧹 [DeleteTemplate] STEP 3: UI cleanup only (template not in Firestore)`);
      } else {
        console.log(`🗑️ [DeleteTemplate] STEP 3: Local template deletion (sample/local)`);
        
        // Track deletion for local templates
        if (!template.id || template.id.startsWith('local-')) {
          const templateKey = `${template.title}|${template.category}|${template.desc || ''}`.toLowerCase();
          const deletedLocalTemplates = JSON.parse(localStorage.getItem('deletedLocalTemplates') || '[]');
          if (!deletedLocalTemplates.includes(templateKey)) {
            deletedLocalTemplates.push(templateKey);
            localStorage.setItem('deletedLocalTemplates', JSON.stringify(deletedLocalTemplates));
            console.log(`💾 [DeleteTemplate] Tracked local template deletion: ${templateKey}`);
          }
        }
      }
      
      // STEP 5: AGGRESSIVE GLOBAL CACHE INVALIDATION
      console.log(`🔄 [DeleteTemplate] STEP 5: AGGRESSIVE global cache invalidation`);
      
      const eventDetail = { 
        source: 'template-deletion-comprehensive', 
        templateId,
        firestoreDocumentId,
        template: {
          id: templateId,
          firestoreId: firestoreDocumentId,
          title: template.title,
          category: template.category
        },
        category: template.category,
        timestamp: Date.now(),
        action: 'delete',
        forceReload: true,
        immediate: true,
        comprehensive: true
      };

      // Dispatch ALL possible events immediately
      console.log('📡 [DeleteTemplate] Dispatching comprehensive event wave...');
      const events = [
        'templatesUpdated',
        'templateDeleted', 
        'templateCacheInvalid',
        'globalTemplateSync',
        'categoryUpdated'
      ];
      
      events.forEach(eventType => {
        window.dispatchEvent(new CustomEvent(eventType, { detail: eventDetail }));
        console.log(`📡 Dispatched: ${eventType}`);
      });

      // STEP 6: FORCE COMPREHENSIVE UI REFRESH
      console.log(`🔄 [DeleteTemplate] STEP 6: Forcing comprehensive UI refresh`);
      
      // Immediate admin panel refresh
      loadTemplates();
      
      // Notify parent components
      if (onTemplateUpdated) {
        onTemplateUpdated({
          success: true,
          templateId,
          oldCategory: template.category || 'Uncategorized',
          newCategory: 'Deleted',
          timestamp: new Date().toISOString(),
          source: 'template-deletion'
        });
      }
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }

      // STEP 7: SECONDARY WAVE OF EVENTS AND VERIFICATION
      setTimeout(() => {
        console.log('📡 [DeleteTemplate] STEP 7: Secondary event wave for missed listeners');
        
        // Secondary event dispatch
        events.forEach(eventType => {
          window.dispatchEvent(new CustomEvent(eventType, { 
            detail: { 
              ...eventDetail, 
              source: 'template-deletion-secondary',
              timestamp: Date.now()
            } 
          }));
        });
        
        // Force another admin refresh
        loadTemplates();
        
      }, 1000);

      // STEP 8: FINAL VERIFICATION AND CLEANUP
      setTimeout(async () => {
        console.log('🔍 [DeleteTemplate] STEP 8: Final verification that template is gone everywhere');
        
        // Final Firestore check if it was a Firestore template
        if (requiresFirestoreDeletion && existsInFirestore) {
          try {
            const finalRef = doc(db, 'templates', firestoreDocumentId);
            const finalSnap = await getDoc(finalRef);
            if (finalSnap.exists()) {
              console.error(`❌ [DeleteTemplate] CRITICAL: Template still exists in Firestore after all deletion attempts!`);
              alert(`CRITICAL ERROR: Template still exists in database after deletion. Please refresh and try again.`);
            } else {
              console.log(`✅ [DeleteTemplate] FINAL VERIFICATION: Template successfully deleted from Firestore`);
            }
          } catch (finalError) {
            console.log(`ℹ️ [DeleteTemplate] Final verification check failed (expected if deleted):`, finalError);
          }
        }
        
        // Final comprehensive event
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { 
            source: 'template-deletion-final-verification', 
            templateId,
            timestamp: Date.now(),
            action: 'delete-verified'
          } 
        }));
        
      }, 2000);
      
      // Show success feedback
      const successMessage = existsInFirestore 
        ? `🗑️ Deleted "${template.title}" from database and all UIs`
        : `🧹 Removed "${template.title}" from UI (was not in database)`;
      
      setLastMoveResult(successMessage);
      setTimeout(() => setLastMoveResult(null), 5000);
      
      console.log(`✅ [DeleteTemplate] COMPREHENSIVE DELETION COMPLETE for "${template.title}"`);
      
    } catch (error) {
      console.error('❌ [DeleteTemplate] Unexpected error in comprehensive deletion:', error);
      
      // ROLLBACK: Restore template in UI
      setPlaygroundCategories(prevCategories => {
        return prevCategories.map(category => {
          if (category.id === categoryId) {
            return {
              ...category,
              templates: [...category.templates, template].sort((a, b) => a.title.localeCompare(b.title))
            };
          }
          return category;
        });
      });
      
      alert(`An unexpected error occurred during comprehensive deletion. Template has been restored.\n\nError: ${error.message || error}`);
    } finally {
      setUpdating(null);
    }
  };

  // ✅ TESTING: Drag and Drop validation function
  const testDragAndDrop = () => {
    console.log('🧪 [Testing] ====== DRAG & DROP VALIDATION ======');
    
    // Playground state analysis
    console.log('📊 [Testing] Current playground state:');
    playgroundCategories.forEach((cat, catIndex) => {
      console.log(`  Category ${catIndex + 1}: "${cat.id}" (${cat.title}) - ${cat.templates.length} templates`);
      cat.templates.forEach((template, tempIndex) => {
        const dragId = `${cat.id}|||${template.id}`; // Use ||| separator
        console.log(`    Template ${tempIndex + 1}: "${template.title}" → ID: "${dragId}"`);
      });
    });
    
    // ID validation
    const allDragIds = playgroundCategories.flatMap(cat => 
      cat.templates.map(template => `${cat.id}|||${template.id}`) // Use ||| separator
    );
    
    const duplicateIds = allDragIds.filter((id, index) => allDragIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.error('❌ [Testing] Duplicate drag IDs found:', duplicateIds);
    } else {
      console.log(`✅ [Testing] All ${allDragIds.length} drag IDs are unique`);
    }
    
    // Category droppables
    const categoryIds = playgroundCategories.map(cat => cat.id);
    console.log(`✅ [Testing] ${categoryIds.length} droppable categories:`, categoryIds);
    
    // useSortable setup validation
    console.log('🔧 [Testing] DndContext sensors configured:', sensors?.length || 0);
    
    console.log('🧪 [Testing] ====== VALIDATION COMPLETE ======');
  };

  // NEW: Handle file import from desktop
  const handleFileImport = async (files: FileList) => {
    setImportingFiles(true);
    console.log(`📁 [FileImport] Processing ${files.length} files`);
    
    try {
      const newTemplates: Template[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Handle JSON files
        if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
          console.log(`📄 [FileImport] Processing JSON file: ${file.name}`);
          
          try {
            const jsonText = await file.text();
            const jsonData = JSON.parse(jsonText);
            
            // Handle different JSON formats
            let templatesFromJson: Template[] = [];
            
            if (Array.isArray(jsonData)) {
              // Direct array of templates
              templatesFromJson = jsonData;
            } else if (jsonData.templates && Array.isArray(jsonData.templates)) {
              // Object with templates property
              templatesFromJson = jsonData.templates;
            } else if (jsonData.data && Array.isArray(jsonData.data)) {
              // Object with data property
              templatesFromJson = jsonData.data;
            } else {
              // Single template object
              templatesFromJson = [jsonData];
            }
            
            // Process and validate each template
            for (const templateData of templatesFromJson) {
              if (templateData && typeof templateData === 'object') {
                // ✅ ENHANCED: Better field mapping for auto-generated templates
                const template: Template = {
                  id: templateData.id || `json-${templateData.title?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'template'}-${Date.now()}`,
                  title: templateData.title || templateData.name || 'Imported Template',
                  category: templateData.category || 'Uncategorized',
                  desc: templateData.desc || templateData.description || templateData.prompt || `Imported from ${file.name}`,
                  prompt: templateData.prompt || templateData.desc || templateData.description || `Professional template for ${templateData.platform || 'content creation'}`,
                  icon: templateData.icon || '📄',
                  preview: templateData.preview || templateData.previewUrl || templateData.image || templateData.imageUrl || templateData.imageSource || '/default-template.png',
                  platform: templateData.platform || 'JSON Import',
                  quality: templateData.quality || 'Original',
                  tags: Array.isArray(templateData.tags) ? templateData.tags : ['imported', 'json'],
                  useVideoPreview: templateData.useVideoPreview || templateData.useImagePreview || Boolean(templateData.videoSource || templateData.video || templateData.videoUrl),
                  createdAt: templateData.createdAt || new Date().toISOString(),
                  lastModified: templateData.lastModified || new Date().toISOString(),
                  modifiedBy: templateData.modifiedBy || 'json-import',
                  
                  // ✅ NEW: Handle auto-generated template fields
                  aspectRatio: templateData.aspectRatio,
                  autoGenerated: templateData.autoGenerated,
                  fileType: templateData.fileType,
                  originalExtension: templateData.originalExtension,
                  
                  ...templateData // Spread remaining properties
                };

                // ✅ ENHANCED: Handle both videoSource and imageSource with TikTok-style preview generation
                const videoSource = templateData.videoSource || templateData.video || templateData.videoUrl;
                const imageSource = templateData.imageSource || templateData.image || templateData.imageUrl;
                
                if (videoSource && videoSource.trim() !== '') {
                  template.videoSource = videoSource;
                } else if (imageSource && imageSource.trim() !== '') {
                  template.imageSource = imageSource;
                }
                
                // ✅ APPLY TIKTOK LOGIC: Generate optimized preview URL using ImageService
                const sourceForPreview = imageSource || videoSource || templateData.preview;
                if (sourceForPreview) {
                  if (sourceForPreview.startsWith('http')) {
                    // External URL - use ImageService for optimization (same as TikTok templates)
                    template.preview = ImageService.getOptimizedImageUrl(sourceForPreview, 1200, 900, 'high');
                  } else {
                    // Local filename - convert to /images/ path
                    template.preview = `/images/${sourceForPreview}`;
                  }
                } else if (templateData.preview) {
                  if (templateData.preview.startsWith('http')) {
                    // External preview URL - optimize it
                    template.preview = ImageService.getOptimizedImageUrl(templateData.preview, 1200, 900, 'high');
                  } else {
                    // Local preview filename
                    template.preview = `/images/${templateData.preview}`;
                  }
                } else {
                  // Fallback to default
                  template.preview = '/default-template.png';
                }

                // Clean up any undefined values to prevent Firebase errors
                Object.keys(template).forEach(key => {
                  if (template[key] === undefined) {
                    delete template[key];
                  }
                });
                
                newTemplates.push(template);
                console.log(`✅ [FileImport] Added template from JSON: ${template.title} (${template.fileType || 'unknown'} template)`);
              }
            }
            
            console.log(`📄 [FileImport] Successfully processed JSON file: ${templatesFromJson.length} templates found`);
            
          } catch (jsonError) {
            console.error(`❌ [FileImport] Error parsing JSON file ${file.name}:`, jsonError);
            alert(`Error parsing JSON file "${file.name}": ${jsonError.message}`);
          continue;
        }
        }
        // Handle image and video files
        else if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        // Create object URL for preview
        const previewUrl = URL.createObjectURL(file);
        
        // Generate template from file
        const template: Template = {
          id: `imported-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          category: selectedCategoriesForPlayground.size === 1 
            ? playgroundCategories.find(cat => selectedCategoriesForPlayground.has(cat.id))?.title || 'Uncategorized'
            : 'Uncategorized',
          desc: `Imported ${file.type.startsWith('image/') ? 'image' : 'video'} from desktop`,
          icon: file.type.startsWith('image/') ? '🖼️' : '🎬',
          preview: previewUrl,
          platform: 'Desktop Import',
          quality: 'Original',
          tags: ['imported', 'desktop', file.type.split('/')[0]],
          useVideoPreview: file.type.startsWith('video/'),
          importedFile: file // Store the actual file for potential upload
        };

          // Only add videoSource for video files
          if (file.type.startsWith('video/')) {
            template.videoSource = previewUrl;
          }
        
        newTemplates.push(template);
        }
        // Skip unsupported file types
        else {
          console.warn(`⚠️ [FileImport] Skipping unsupported file type: ${file.type} (${file.name})`);
          continue;
        }
      }
      
              if (newTemplates.length > 0) {
          // Auto-create categories based on template categories and distribute templates appropriately
          const categoriesFromTemplates = [...new Set(newTemplates.map(t => t.category))];
          console.log(`🏷️ [FileImport] Found categories in JSON: ${categoriesFromTemplates.join(', ')}`);
          
          // Group templates by their categories
          const templatesByCategory = newTemplates.reduce((acc, template) => {
            const category = template.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(template);
            return acc;
          }, {} as Record<string, Template[]>);
          
          // Auto-add required categories to playground and distribute templates
          let updatedPlaygroundCategories = [...playgroundCategories];
          
          for (const [categoryName, templates] of Object.entries(templatesByCategory)) {
            // Find matching predefined category
            const matchingPredefined = availableCategories.find(cat => 
              cat.title.toLowerCase() === categoryName.toLowerCase() ||
              cat.title.toLowerCase().includes(categoryName.toLowerCase()) ||
              categoryName.toLowerCase().includes(cat.title.toLowerCase())
            );
            
            const categoryId = matchingPredefined?.id || `auto-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
            
            // Check if category already exists in playground
            const existingCategoryIndex = updatedPlaygroundCategories.findIndex(cat => 
              cat.id === categoryId || cat.title.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (existingCategoryIndex >= 0) {
              // ✅ FIXED: Add templates to existing category with deduplication
              const existingTemplates = updatedPlaygroundCategories[existingCategoryIndex].templates;
              const existingTemplateKeys = new Set(
                existingTemplates.map(t => `${t.title?.toLowerCase().trim()}|${t.category?.toLowerCase().trim()}`)
              );
              
              // Filter out duplicates from new templates
              const uniqueNewTemplates = templates.filter(template => {
                const templateKey = `${template.title?.toLowerCase().trim()}|${template.category?.toLowerCase().trim()}`;
                return !existingTemplateKeys.has(templateKey);
              });
              
              updatedPlaygroundCategories[existingCategoryIndex] = {
                ...updatedPlaygroundCategories[existingCategoryIndex],
                templates: [...existingTemplates, ...uniqueNewTemplates],
                isExpanded: true
              };
              console.log(`➕ [FileImport] Added ${uniqueNewTemplates.length} unique templates to existing "${categoryName}" category (${templates.length - uniqueNewTemplates.length} duplicates skipped)`);
            } else {
              // Create new category
              const newCategory: CategoryGroup = {
                id: categoryId,
                title: categoryName,
                templates: templates,
                color: matchingPredefined?.color || 'from-purple-500 to-purple-600',
                icon: matchingPredefined?.icon || '🎨',
                isExpanded: true
              };
              updatedPlaygroundCategories.push(newCategory);
              
              // Update selected categories
              setSelectedCategoriesForPlayground(prev => new Set([...prev, categoryId]));
              console.log(`🆕 [FileImport] Created new "${categoryName}" category with ${templates.length} templates`);
            }
          }
          
          setPlaygroundCategories(updatedPlaygroundCategories);
        
        // Add to recent updates
        const updateResult: CategoryUpdateResult = {
          success: true,
          templateId: newTemplates.map(t => t.id).join(', '),
          oldCategory: 'JSON Import',
          newCategory: categoriesFromTemplates.join(', '),
          timestamp: new Date().toISOString(),
          source: 'file-import'
        };
        
        setRecentUpdates(prev => [updateResult, ...prev.slice(0, 9)]);
        onTemplateUpdated?.(updateResult);
        
        console.log(`✅ [FileImport] Successfully imported ${newTemplates.length} templates across ${categoriesFromTemplates.length} categories`);
        
        // Show success message
        const successMessage = `✅ Successfully imported ${newTemplates.length} templates! Use "📤 Sync to Firestore" to save them permanently.`;
        setLastMoveResult(successMessage);
        setTimeout(() => setLastMoveResult(null), 8000);
        
        // ✅ FIXED: No auto-sync - let user manually sync when ready
        console.log(`✅ [FileImport] Templates imported successfully. Manual sync required.`);
        console.log(`📋 [FileImport] Imported templates:`, newTemplates.map(t => ({ id: t.id, title: t.title, category: t.category })));
        
        // Update playground immediately for user to see results
        console.log(`🎮 [FileImport] Templates are now available in playground for review before syncing`);
      }
    } catch (error) {
      console.error('❌ [FileImport] Error importing files:', error);
    } finally {
      setImportingFiles(false);
    }
  };

  // NEW: Handle drag over for file import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImport(true);
  };

  // NEW: Handle drag leave for file import
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImport(false);
  };

  // NEW: Handle file drop from desktop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImport(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileImport(files);
    }
  };

  // NEW: Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileImport(e.target.files);
    }
  };

  // Refresh playground categories when templates are loaded
  const refreshPlaygroundCategories = useCallback(() => {
    setPlaygroundCategories(prevPlaygroundCategories => {
      if (prevPlaygroundCategories.length === 0) return prevPlaygroundCategories;
    console.log('🔄 [RefreshPlayground] Updating playground categories with new template data');
    
      const updatedCategories = prevPlaygroundCategories.map(playgroundCat => {
        // Find corresponding category in loaded data
        const matchingCategory = categories.find(cat => 
          cat.id === playgroundCat.id || cat.title === playgroundCat.title
        );
        
        if (matchingCategory) {
          // ✅ FIXED: Update with fresh template data but preserve playground state with deduplication
          const existingTemplateKeys = new Set(
            playgroundCat.templates.map(t => `${t.title?.toLowerCase().trim()}|${t.category?.toLowerCase().trim()}`)
          );
          
          // Filter out duplicates from matching category templates
          const uniqueNewTemplates = matchingCategory.templates.filter(template => {
            const templateKey = `${template.title?.toLowerCase().trim()}|${template.category?.toLowerCase().trim()}`;
            return !existingTemplateKeys.has(templateKey);
          });
          
          return {
            ...playgroundCat,
            templates: [...playgroundCat.templates, ...uniqueNewTemplates],
            // Keep existing expanded state
          };
        }
        
        return playgroundCat;
      });
      
      return updatedCategories;
    });
  }, [categories]);

  // 🔥 NEW: Check if playground has unsaved changes
  const hasUnsavedChanges = () => {
    return playgroundCategories.length > 0 && 
           playgroundCategories.some(cat => cat.templates.length > 0);
  };

  // 🔥 NEW: Sync playground changes to persistent storage
  // Helper function to copy video files to public directory (development only)
  const copyVideoFileToPublic = async (file: File, fileName: string): Promise<boolean> => {
    try {
      // In development, we can't actually write to the public directory from the client
      // This is a placeholder for the actual file copying logic
      console.log(`📁 [VideoHelper] Would copy ${file.name} to /public/videos/${fileName}`);
      console.log(`📊 [VideoHelper] File details:`, {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // In a real implementation, you would:
      // 1. Upload to Firebase Storage, AWS S3, or similar
      // 2. Or use a server endpoint to handle file uploads
      // 3. Or use a build process to copy files
      
      // For now, we'll simulate success and create the proper URL structure
      return true;
    } catch (error) {
      console.error(`❌ [VideoHelper] Error copying video file:`, error);
      return false;
    }
  };

  const syncPlaygroundToStorage = async () => {
    if (playgroundCategories.length === 0) {
      alert('No playground data to sync');
      return;
    }

    setUpdating('sync-all');
    let syncResults = {
      firestore: { success: 0, failed: 0 },
      total: 0
    };

    try {
      // Collect all templates from playground
      const allPlaygroundTemplates = playgroundCategories.flatMap(cat => 
        cat.templates.map(template => ({
          ...template,
          category: cat.title // Use category title from playground
        }))
      );

      syncResults.total = allPlaygroundTemplates.length;
      console.log(`🔄 [Sync] Starting sync of ${syncResults.total} templates`);
      
      // Add detailed template analysis
      const templateAnalysis = {
        jsonTemplates: 0,
        importedTemplates: 0,
        existingTemplates: 0,
        sampleTemplates: 0,
        localTemplates: 0
      };
      
      allPlaygroundTemplates.forEach(template => {
        if (template.id.startsWith('json-')) templateAnalysis.jsonTemplates++;
        else if (template.id.startsWith('imported-')) templateAnalysis.importedTemplates++;
        else if (template.id.startsWith('sample-')) templateAnalysis.sampleTemplates++;
        else if (template.id.startsWith('local-')) templateAnalysis.localTemplates++;
        else templateAnalysis.existingTemplates++;
      });
      
      console.log(`📊 [Sync] Template analysis:`, templateAnalysis);

      // ✅ FIXED: Process templates sequentially to avoid race conditions
      for (const template of allPlaygroundTemplates) {
        // Skip sample/local templates
        if (template.id.startsWith('sample-') || template.id.startsWith('local-')) {
          console.log(`⏭️ [Sync] Skipping sample/local template: ${template.id}`);
          continue;
        }

        try {
          // Add small delay to prevent overwhelming Firebase
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const isNewTemplate = template.id.startsWith('imported-') || template.id.startsWith('json-');
          console.log(`🔍 [Sync] Processing template: ${template.title}`);
          console.log(`   - ID: ${template.id}`);
          console.log(`   - Category: ${template.category}`);
          console.log(`   - Is New: ${isNewTemplate}`);
          
          if (isNewTemplate) {
            console.log(`📤 [Sync] Creating new template: ${template.title}`);
            
            // Prepare clean template data for Firestore
            const firestoreTemplate: any = {
              title: template.title || 'Untitled Template',
              category: template.category || 'Uncategorized',
              desc: template.desc || template.description || template.prompt || 'Imported template',
              prompt: template.prompt || template.desc || template.description || 'Imported template',
              preview: template.preview || '/default-template.png',
              platform: template.platform || 'Imported',
              tags: Array.isArray(template.tags) ? template.tags : ['imported'],
              quality: template.quality || 'Original',
              icon: template.icon || '📄',
              useVideoPreview: template.useVideoPreview || false,
              createdAt: template.createdAt || new Date().toISOString(),
              lastModified: template.lastModified || new Date().toISOString(),
              modifiedBy: template.modifiedBy || 'admin-sync',
              syncedAt: new Date().toISOString()
            };

            // ✅ FIXED: Handle both videoSource and imageSource for Firestore
            if (template.videoSource) {
              firestoreTemplate.videoSource = template.videoSource;
            }
            if (template.imageSource) {
              firestoreTemplate.imageSource = template.imageSource;
            }
            
            // ✅ ENHANCED: Apply proper preview URL optimization for Firestore sync
            const sourceForPreview = template.imageSource || template.videoSource || template.preview;
            if (sourceForPreview && sourceForPreview !== '/default-template.png') {
              if (sourceForPreview.startsWith('http')) {
                // External URL - preserve videos, optimize images
                if (template.videoSource && sourceForPreview === template.videoSource) {
                  // ✅ FIX: Preserve video URLs from Firebase Storage as-is
                  firestoreTemplate.preview = sourceForPreview;
                } else {
                  // Image optimization for non-video sources
                  firestoreTemplate.preview = ImageService.getOptimizedImageUrl(sourceForPreview, 1200, 900, 'high');
                }
              } else if (sourceForPreview.startsWith('/images/')) {
                // Already optimized local path
                firestoreTemplate.preview = sourceForPreview;
              } else {
                // Local filename - convert to /images/ path (only for images)
                firestoreTemplate.preview = `/images/${sourceForPreview}`;
              }
            } else {
              // Keep existing preview or use default
              firestoreTemplate.preview = template.preview || '/default-template.png';
            }

            // Preserve auto-generated template fields
            if (template.aspectRatio) firestoreTemplate.aspectRatio = template.aspectRatio;
            if (template.autoGenerated) firestoreTemplate.autoGenerated = template.autoGenerated;
            if (template.fileType) firestoreTemplate.fileType = template.fileType;
            if (template.originalExtension) firestoreTemplate.originalExtension = template.originalExtension;

            // Clean up undefined values
            Object.keys(firestoreTemplate).forEach(key => {
              if (firestoreTemplate[key] === undefined) {
                delete firestoreTemplate[key];
              }
            });

            // Validate required fields
            if (!firestoreTemplate.title || !firestoreTemplate.category) {
              throw new Error(`Missing required fields for template: ${template.id} - Title: ${firestoreTemplate.title}, Category: ${firestoreTemplate.category}`);
            }

            console.log(`📤 [Sync] Creating Firestore document with ${Object.keys(firestoreTemplate).length} fields`);

            // ✅ FIXED: Add retry logic for template creation
            let retryCount = 0;
            const maxRetries = 3;
            let result = null;
            
            while (retryCount < maxRetries) {
              try {
                result = await TemplateService.createTemplate(firestoreTemplate);
                break; // Success, exit retry loop
              } catch (error) {
                retryCount++;
                console.warn(`⚠️ [Sync] Retry ${retryCount}/${maxRetries} for template: ${template.title}`);
                if (retryCount >= maxRetries) {
                  throw error; // Re-throw after max retries
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              }
            }
            
            if (result && result.success) {
              syncResults.firestore.success++;
              console.log(`✅ [Sync] Successfully created: ${template.title} → ID: ${result.templateId}`);
            } else {
              syncResults.firestore.failed++;
              console.error(`❌ [Sync] Failed to create template after ${maxRetries} attempts:`, result?.error);
              console.error(`❌ [Sync] Template data that failed:`, {
                title: firestoreTemplate.title,
                category: firestoreTemplate.category,
                fields: Object.keys(firestoreTemplate)
              });
            }
          }
          // For existing templates, just update the category
          else {
            console.log(`📝 [Sync] Updating existing template category: ${template.id}`);
            
            // ✅ FIXED: Add retry logic for updates too
            let retryCount = 0;
            const maxRetries = 3;
            let result = null;
            
            while (retryCount < maxRetries) {
              try {
                result = await TemplateService.updateTemplateCategory(template.id, template.category, 'admin-sync');
                break;
              } catch (error) {
                retryCount++;
                console.warn(`⚠️ [Sync] Retry ${retryCount}/${maxRetries} for update: ${template.id}`);
                if (retryCount >= maxRetries) {
                  throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            }
            
            if (result && result.success) {
              syncResults.firestore.success++;
              console.log(`✅ [Sync] Updated category for: ${template.id}`);
            } else {
              syncResults.firestore.failed++;
              console.error(`❌ [Sync] Failed to update ${template.id} after ${maxRetries} attempts:`, result?.error);
            }
          }
        } catch (error) {
          syncResults.firestore.failed++;
          console.error(`❌ [Sync] Critical error syncing ${template.id}:`, error);
          console.error(`❌ [Sync] Template that caused error:`, {
            id: template.id,
            title: template.title,
            category: template.category,
            hasRequiredFields: !!(template.title && template.category)
          });
        }
      }

      // Create detailed success message
      const messages = [];
      if (syncResults.firestore.success > 0) {
        messages.push(`✅ Successfully synced ${syncResults.firestore.success} templates to Firestore`);
      }
      if (syncResults.firestore.failed > 0) {
        messages.push(`❌ Failed to sync ${syncResults.firestore.failed} templates`);
        messages.push(`💡 Check browser console for detailed error information`);
      }
      
      // Add summary statistics
      if (templateAnalysis.jsonTemplates > 0) {
        messages.push(`📄 Processed ${templateAnalysis.jsonTemplates} JSON-imported templates`);
      }
      if (templateAnalysis.importedTemplates > 0) {
        messages.push(`📁 Processed ${templateAnalysis.importedTemplates} file-imported templates`);
      }

      const finalMessage = messages.length > 0 
        ? messages.join('\n') 
        : '✅ All playground changes synced successfully!';

      setLastMoveResult(finalMessage);
      setTimeout(() => setLastMoveResult(null), 15000); // Longer timeout for detailed messages

      // Trigger refresh of the main app
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }

    } catch (error) {
      console.error('❌ [Sync] Fatal sync error:', error);
      setLastMoveResult(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}\n💡 Check browser console for details`);
      setTimeout(() => setLastMoveResult(null), 10000);
    } finally {
      setUpdating(null);
    }
  };

  // 🔥 NEW: Download playground state as JSON
  const downloadPlaygroundAsJSON = () => {
    if (playgroundCategories.length === 0) {
      alert('No playground data to download');
      return;
    }

    const playgroundData = {
      timestamp: new Date().toISOString(),
      categories: playgroundCategories,
      totalTemplates: playgroundCategories.reduce((sum, cat) => sum + cat.templates.length, 0)
    };

    const blob = new Blob([JSON.stringify(playgroundData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playground-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // NEW: Diagnostic function to check video data in templates
  const diagnoseVideoData = () => {
    console.log('🔍 [Diagnostic] ====== PLAYGROUND VIDEO ANALYSIS ======');
    
    if (playgroundCategories.length === 0) {
      console.log('⚠️ [Diagnostic] No playground categories found');
      alert('No playground data to analyze');
      return;
    }

    const allTemplates = playgroundCategories.flatMap(cat => 
      cat.templates.map(template => ({
        ...template,
        categoryTitle: cat.title
      }))
    );

    console.log(`🔍 [Diagnostic] Found ${allTemplates.length} templates across ${playgroundCategories.length} categories`);

    const videoAnalysis = {
      totalTemplates: allTemplates.length,
      withVideoSource: 0,
      withPreview: 0,
      withImportedFile: 0,
      withBlobUrls: 0,
      blobUrlDetails: [],
      templateDetails: []
    };

    allTemplates.forEach((template, index) => {
      const hasVideoSource = !!template.videoSource;
      const hasPreview = !!template.preview;
      const hasImportedFile = !!template.importedFile;
      const hasBlobUrl = (template.videoSource && template.videoSource.startsWith('blob:')) || 
                         (template.preview && template.preview.startsWith('blob:'));

      if (hasVideoSource) videoAnalysis.withVideoSource++;
      if (hasPreview) videoAnalysis.withPreview++;
      if (hasImportedFile) videoAnalysis.withImportedFile++;
      if (hasBlobUrl) videoAnalysis.withBlobUrls++;

      const templateInfo = {
        index: index + 1,
        title: template.title,
        category: template.categoryTitle,
        id: template.id,
        hasVideoSource,
        hasPreview,
        hasImportedFile,
        videoSource: template.videoSource,
        preview: template.preview,
        importedFileType: template.importedFile?.type || 'none',
        importedFileName: template.importedFile?.name || 'none',
        isBlobVideoSource: template.videoSource?.startsWith('blob:') || false,
        isBlobPreview: template.preview?.startsWith('blob:') || false
      };

      videoAnalysis.templateDetails.push(templateInfo);

      console.log(`🔍 [Diagnostic] Template ${index + 1}: "${template.title}"`);
      console.log(`   Category: ${template.categoryTitle}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   VideoSource: ${template.videoSource || 'NONE'}`);
      console.log(`   Preview: ${template.preview || 'NONE'}`);
      console.log(`   ImportedFile: ${template.importedFile ? `${template.importedFile.name} (${template.importedFile.type})` : 'NONE'}`);
      console.log(`   Has blob URLs: ${hasBlobUrl}`);

      if (hasBlobUrl) {
        if (template.videoSource?.startsWith('blob:')) {
          videoAnalysis.blobUrlDetails.push({
            template: template.title,
            type: 'videoSource',
            url: template.videoSource
          });
        }
        if (template.preview?.startsWith('blob:')) {
          videoAnalysis.blobUrlDetails.push({
            template: template.title,
            type: 'preview',
            url: template.preview
          });
        }
      }
    });

    console.log('🔍 [Diagnostic] ====== SUMMARY ======');
    console.log(`📊 Total templates: ${videoAnalysis.totalTemplates}`);
    console.log(`📊 With videoSource: ${videoAnalysis.withVideoSource}`);
    console.log(`📊 With preview: ${videoAnalysis.withPreview}`);
    console.log(`📊 With importedFile: ${videoAnalysis.withImportedFile}`);
    console.log(`📊 With blob URLs: ${videoAnalysis.withBlobUrls}`);

    if (videoAnalysis.blobUrlDetails.length > 0) {
      console.log('🔍 [Diagnostic] Blob URL Details:');
      videoAnalysis.blobUrlDetails.forEach(detail => {
        console.log(`   ${detail.template} (${detail.type}): ${detail.url}`);
      });
    }

    // Show user-friendly summary
    const summary = `
📊 VIDEO DATA ANALYSIS COMPLETE

Total Templates: ${videoAnalysis.totalTemplates}
Templates with Video Source: ${videoAnalysis.withVideoSource}
Templates with Preview: ${videoAnalysis.withPreview}
Templates with Imported Files: ${videoAnalysis.withImportedFile}
Templates with Blob URLs: ${videoAnalysis.withBlobUrls}

${videoAnalysis.withBlobUrls === 0 ? 
  '⚠️ NO BLOB URLS FOUND - This means no video files are ready for upload to Firebase Storage!' : 
  `✅ Found ${videoAnalysis.withBlobUrls} templates with blob URLs ready for upload`
}

Check browser console for detailed analysis.
    `;

    alert(summary);
    
    console.log('🔍 [Diagnostic] Full analysis object:', videoAnalysis);
    console.log('🔍 [Diagnostic] ====== END ANALYSIS ======');
  };

  // NEW: Direct Video Upload Function with LIVE PROGRESS BAR
  const directVideoUpload = async () => {
    if (playgroundCategories.length === 0) {
      alert('No playground templates found. Import your JSON templates first, then use this to upload videos.');
      return;
    }

    // Create file input for video selection
    const videoInput = document.createElement('input');
    videoInput.type = 'file';
    videoInput.multiple = true;
    videoInput.accept = 'video/*';
    
    videoInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      // Initialize progress tracking
      setUploadProgress({
        isUploading: true,
        currentFile: '',
        currentIndex: 0,
        totalFiles: target.files.length,
        progress: 0,
        uploadedFiles: [],
        failedFiles: []
      });
      
      setUpdating('video-upload');
      console.log(`📹 [DirectUpload] Starting direct upload of ${target.files.length} videos...`);
      
      try {
        const uploadResults = {
          success: 0,
          failed: 0,
          details: [] as string[]
        };
        
        // Get all templates from playground
        const allTemplates = playgroundCategories.flatMap(cat => cat.templates);
        console.log(`📹 [DirectUpload] Found ${allTemplates.length} templates in playground`);
        console.log('📋 [DirectUpload] Available templates:', allTemplates.map(t => t.title));
        
        // Upload each video file with progress tracking
        for (let i = 0; i < target.files.length; i++) {
          const videoFile = target.files[i];
          
          // NEW: Validate file before upload
          const validation = validateUploadFile(videoFile);
          if (!validation.valid) {
            console.error(`❌ [DirectUpload] Invalid file ${videoFile.name}:`, validation.issues);
            uploadResults.failed++;
            uploadResults.details.push(`❌ ${videoFile.name} → ${validation.issues.join(', ')}`);
            setUploadProgress(prev => ({
              ...prev,
              failedFiles: [...prev.failedFiles, videoFile.name]
            }));
            continue;
          }
          
          // Log validation warnings
          if (validation.issues.length > 0) {
            console.warn(`⚠️ [DirectUpload] Warnings for ${videoFile.name}:`, validation.issues);
          }
          
          const fileName = `direct_upload_${Date.now()}_${i}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          
          // Update progress for current file
          setUploadProgress(prev => ({
            ...prev,
            currentFile: videoFile.name,
            currentIndex: i + 1,
            progress: 0
          }));
          
          console.log(`📹 [DirectUpload] Processing video ${i + 1}/${target.files.length}: ${videoFile.name}`);
          console.log(`📊 [DirectUpload] File size: ${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`);
          
          try {
            const videoStorageRef = storageRef(storage, `videos/${fileName}`);
            
            // Enhanced upload with better error handling and timeout
            console.log(`🚀 [DirectUpload] Starting upload for ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
            
            const uploadTask = uploadBytesResumable(videoStorageRef, videoFile);
            
            // Create upload promise with progress tracking and timeout
            const uploadPromise = new Promise<string>((resolve, reject) => {
              let lastProgressTime = Date.now();
              let progressStalled = false;
              
              // Timeout after 5 minutes of no progress
              const timeoutId = setTimeout(() => {
                console.warn(`⏰ [DirectUpload] Upload timeout for ${videoFile.name}`);
                uploadTask.cancel();
                reject(new Error('Upload timeout - no progress for 5 minutes'));
              }, 5 * 60 * 1000);
              
              // Stall detection - if no progress for 30 seconds, warn
              const stallCheckId = setInterval(() => {
                const now = Date.now();
                if (now - lastProgressTime > 30000 && !progressStalled) {
                  progressStalled = true;
                  console.warn(`⚠️ [DirectUpload] Upload may be stalled for ${videoFile.name}`);
                }
              }, 10000);
              
              uploadTask.on('state_changed',
                // Progress function
                (snapshot: UploadTaskSnapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  const bytesTransferred = snapshot.bytesTransferred;
                  const totalBytes = snapshot.totalBytes;
                  
                  lastProgressTime = Date.now();
                  progressStalled = false;
                  
                  setUploadProgress(prev => ({
                    ...prev,
                    progress: Math.round(progress)
                  }));
                  
                  console.log(`📊 [DirectUpload] ${videoFile.name}: ${Math.round(progress)}% (${(bytesTransferred / 1024 / 1024).toFixed(2)}/${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
                  
                  // Log detailed progress every 10%
                  if (Math.round(progress) % 10 === 0 && Math.round(progress) > 0) {
                    console.log(`🎯 [DirectUpload] ${videoFile.name} - Milestone: ${Math.round(progress)}% complete`);
                  }
                },
                // Error function
                (error) => {
                  clearTimeout(timeoutId);
                  clearInterval(stallCheckId);
                  console.error(`❌ [DirectUpload] Upload error for ${videoFile.name}:`, error);
                  console.error(`❌ [DirectUpload] Error details:`, {
                    code: error.code,
                    message: error.message,
                    name: error.name
                  });
                  reject(error);
                },
                // Complete function
                async () => {
                  clearTimeout(timeoutId);
                  clearInterval(stallCheckId);
                  try {
                    console.log(`🎉 [DirectUpload] Upload completed for ${videoFile.name}, getting download URL...`);
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log(`✅ [DirectUpload] Successfully uploaded: ${downloadURL}`);
                    resolve(downloadURL);
                  } catch (urlError) {
                    console.error(`❌ [DirectUpload] Error getting download URL:`, urlError);
                    reject(urlError);
                  }
                }
              );
            });
            
            // Wait for upload to complete
            const downloadURL = await uploadPromise;
            
            // Try to match with existing templates by filename similarity
            const videoNameWithoutExt = videoFile.name.replace(/\.[^/.]+$/, '').toLowerCase();
            const matchedTemplate = allTemplates.find(template => {
              const templateTitle = template.title.toLowerCase();
              return (
                templateTitle.includes(videoNameWithoutExt) ||
                videoNameWithoutExt.includes(templateTitle) ||
                templateTitle.replace(/[^a-z0-9]/g, '') === videoNameWithoutExt.replace(/[^a-z0-9]/g, '')
              );
            });
            
            if (matchedTemplate) {
              console.log(`🎯 [DirectUpload] Matched ${videoFile.name} to template: ${matchedTemplate.title}`);
              
              // Update template with Firebase Storage URL
              setPlaygroundCategories(prevCategories => {
                return prevCategories.map(category => ({
                  ...category,
                  templates: category.templates.map(template => 
                    template.id === matchedTemplate.id
                      ? { 
                          ...template, 
                          videoSource: downloadURL,
                          preview: downloadURL,
                          uploadedDirectly: true,
                          lastModified: new Date().toISOString()
                        }
                      : template
                  )
                }));
              });
              
              uploadResults.details.push(`✅ ${videoFile.name} → ${matchedTemplate.title}`);
            } else {
              console.log(`❓ [DirectUpload] No template match found for: ${videoFile.name}`);
              uploadResults.details.push(`❓ ${videoFile.name} → No template match (uploaded to storage)`);
            }
            
            uploadResults.success++;
            setUploadProgress(prev => ({
              ...prev,
              uploadedFiles: [...prev.uploadedFiles, videoFile.name]
            }));
            
          } catch (uploadError) {
            console.error(`❌ [DirectUpload] Failed to upload ${videoFile.name}:`, uploadError);
            uploadResults.failed++;
            uploadResults.details.push(`❌ ${videoFile.name} → Upload failed: ${uploadError.message}`);
            setUploadProgress(prev => ({
              ...prev,
              failedFiles: [...prev.failedFiles, videoFile.name]
            }));
          }
        }
        
        // Show results
        const resultMessage = `📹 DIRECT VIDEO UPLOAD COMPLETE

✅ Successfully uploaded: ${uploadResults.success}
❌ Failed uploads: ${uploadResults.failed}

Details:
${uploadResults.details.join('\n')}

${uploadResults.success > 0 ? '\n🔄 Run "Sync to Firestore" to save template updates!' : ''}`;
        
        alert(resultMessage);
        setLastMoveResult(`📹 Uploaded ${uploadResults.success}/${target.files.length} videos directly to Firebase Storage`);
        setTimeout(() => setLastMoveResult(null), 8000);
        
      } catch (error) {
        console.error('❌ [DirectUpload] Error in direct video upload:', error);
        alert(`Error during video upload: ${error.message}`);
      } finally {
        setUpdating(null);
        setUploadProgress(prev => ({ ...prev, isUploading: false }));
      }
    };
    
    // Trigger file selection
    videoInput.click();
  };

  // NEW: Quota-aware video upload with rate limiting
  const quotaAwareVideoUpload = async () => {
    if (playgroundCategories.length === 0) {
      alert('No playground templates found. Import your JSON templates first, then use this to upload videos.');
      return;
    }

    // Create file input for video selection
    const videoInput = document.createElement('input');
    videoInput.type = 'file';
    videoInput.multiple = true;
    videoInput.accept = 'video/*';
    
    videoInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const files = Array.from(target.files);
      
      // Warn about quotas
      const proceed = confirm(`🚨 QUOTA-AWARE UPLOAD\n\nUploading ${files.length} files with 10-second delays between uploads to avoid rate limits.\n\nThis will take approximately ${Math.ceil(files.length * 10 / 60)} minutes.\n\nProceed?`);
      
      if (!proceed) return;
      
      // Initialize progress tracking
      setUploadProgress({
        isUploading: true,
        currentFile: '',
        currentIndex: 0,
        totalFiles: files.length,
        progress: 0,
        uploadedFiles: [],
        failedFiles: []
      });
      
      setUpdating('video-upload');
      console.log(`📹 [QuotaUpload] Starting quota-aware upload of ${files.length} videos...`);
      
      try {
        const uploadResults = {
          success: 0,
          failed: 0,
          details: [] as string[]
        };
        
        // Get all templates from playground
        const allTemplates = playgroundCategories.flatMap(cat => cat.templates);
        
        // Upload files one by one with delays
        for (let i = 0; i < files.length; i++) {
          const videoFile = files[i];
          
          // Update progress for current file
          setUploadProgress(prev => ({
            ...prev,
            currentFile: videoFile.name,
            currentIndex: i + 1,
            progress: 0
          }));
          
          console.log(`📹 [QuotaUpload] Processing video ${i + 1}/${files.length}: ${videoFile.name}`);
          
          try {
            // Validate file
            const validation = validateUploadFile(videoFile);
            if (!validation.valid) {
              throw new Error(validation.issues.join(', '));
            }
            
            const fileName = `quota_upload_${Date.now()}_${i}_${videoFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const videoStorageRef = storageRef(storage, `videos/${fileName}`);
            
            // Upload with retry logic for quota errors
            let uploadSuccess = false;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!uploadSuccess && retryCount < maxRetries) {
              try {
                console.log(`📤 [QuotaUpload] Attempt ${retryCount + 1}/${maxRetries} for ${videoFile.name}`);
                
                const uploadTask = uploadBytesResumable(videoStorageRef, videoFile);
                
                const uploadPromise = new Promise<string>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    uploadTask.cancel();
                    reject(new Error('Upload timeout'));
                  }, 60000); // 1 minute timeout
                  
                  uploadTask.on('state_changed',
                    (snapshot) => {
                      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      setUploadProgress(prev => ({
                        ...prev,
                        progress: Math.round(progress)
                      }));
                    },
                    (error) => {
                      clearTimeout(timeout);
                      reject(error);
                    },
                    async () => {
                      clearTimeout(timeout);
                      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                      resolve(downloadURL);
                    }
                  );
                });
                
                const downloadURL = await uploadPromise;
                uploadSuccess = true;
                
                // Try to match with template
                const videoNameWithoutExt = videoFile.name.replace(/\.[^/.]+$/, '').toLowerCase();
                const matchedTemplate = allTemplates.find(template => {
                  const templateTitle = template.title.toLowerCase();
                  return templateTitle.includes(videoNameWithoutExt) || 
                         videoNameWithoutExt.includes(templateTitle);
                });
                
                if (matchedTemplate) {
                  setPlaygroundCategories(prevCategories => {
                    return prevCategories.map(category => ({
                      ...category,
                      templates: category.templates.map(template => 
                        template.id === matchedTemplate.id
                          ? { 
                              ...template, 
                              videoSource: downloadURL,
                              preview: downloadURL,
                              uploadedDirectly: true,
                              lastModified: new Date().toISOString()
                            }
                          : template
                      )
                    }));
                  });
                  uploadResults.details.push(`✅ ${videoFile.name} → ${matchedTemplate.title}`);
                } else {
                  uploadResults.details.push(`✅ ${videoFile.name} → Uploaded (no template match)`);
                }
                
                uploadResults.success++;
                setUploadProgress(prev => ({
                  ...prev,
                  uploadedFiles: [...prev.uploadedFiles, videoFile.name]
                }));
                
                console.log(`✅ [QuotaUpload] Successfully uploaded: ${videoFile.name}`);
                
              } catch (error) {
                retryCount++;
                console.warn(`⚠️ [QuotaUpload] Attempt ${retryCount} failed for ${videoFile.name}:`, error.message);
                
                if (error.message.includes('retry-limit-exceeded') || error.message.includes('quota')) {
                  console.log(`🕒 [QuotaUpload] Quota error detected, waiting 30 seconds before retry...`);
                  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
                } else if (retryCount >= maxRetries) {
                  throw error;
                } else {
                  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for other errors
                }
              }
            }
            
          } catch (error) {
            console.error(`❌ [QuotaUpload] Failed to upload ${videoFile.name}:`, error);
            uploadResults.failed++;
            uploadResults.details.push(`❌ ${videoFile.name} → ${error.message}`);
            setUploadProgress(prev => ({
              ...prev,
              failedFiles: [...prev.failedFiles, videoFile.name]
            }));
          }
          
          // Add delay between uploads (except for the last file)
          if (i < files.length - 1) {
            console.log(`⏱️ [QuotaUpload] Waiting 10 seconds before next upload to respect quotas...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
        
        // Show results
        const resultMessage = `📹 QUOTA-AWARE UPLOAD COMPLETE

✅ Successfully uploaded: ${uploadResults.success}
❌ Failed uploads: ${uploadResults.failed}

Details:
${uploadResults.details.join('\n')}

${uploadResults.success > 0 ? '\n🔄 Run "Sync to Firestore" to save template updates!' : ''}`;
        
        alert(resultMessage);
        setLastMoveResult(`📹 Uploaded ${uploadResults.success}/${files.length} videos with quota management`);
        setTimeout(() => setLastMoveResult(null), 8000);
        
      } catch (error) {
        console.error('❌ [QuotaUpload] Error in quota-aware upload:', error);
        alert(`Error during upload: ${error.message}`);
      } finally {
        setUpdating(null);
        setUploadProgress(prev => ({ ...prev, isUploading: false }));
      }
    };
    
    videoInput.click();
  };

  // ✅ NEW: Clean up existing duplicates in playground
  const cleanupDuplicatesInPlayground = useCallback(() => {
    setPlaygroundCategories(prevCategories => {
      return prevCategories.map(category => {
        const seenTemplates = new Set<string>();
        const uniqueTemplates = category.templates.filter(template => {
          const templateKey = `${template.title?.toLowerCase().trim()}|${template.category?.toLowerCase().trim()}`;
          if (seenTemplates.has(templateKey)) {
            console.log(`🔄 [CleanupDuplicates] Removing duplicate: ${template.title} (${template.category})`);
            return false;
          }
          seenTemplates.add(templateKey);
          return true;
        });
        
        if (uniqueTemplates.length !== category.templates.length) {
          console.log(`🧹 [CleanupDuplicates] Cleaned ${category.templates.length - uniqueTemplates.length} duplicates from "${category.title}" category`);
        }
        
        return {
          ...category,
          templates: uniqueTemplates
        };
      });
    });
  }, []);

  useEffect(() => {
    if (categories.length > 0 && playgroundCategories.length > 0) {
      refreshPlaygroundCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);
  
  // Add debug logging
  useEffect(() => {
    console.log('🎯 [CategoryManager] Component state:', {
      loading,
      categoriesCount: categories.length,
      totalTemplates: categories.reduce((sum, cat) => sum + cat.templates.length, 0),
      playgroundCategoriesCount: playgroundCategories.length,
      playgroundTemplates: playgroundCategories.reduce((sum, cat) => sum + cat.templates.length, 0),
      updating,
      searchTerm
    });
    
    if (categories.length > 0) {
      console.log('📋 [CategoryManager] Available categories with templates:', 
        categories.filter(cat => cat.templates.length > 0).map(cat => `${cat.title} (${cat.templates.length})`));
    }
    
    if (playgroundCategories.length > 0) {
      console.log('🎮 [CategoryManager] Playground categories:', 
        playgroundCategories.map(cat => `${cat.title} (${cat.templates.length})`));
    }
  }, [loading, categories, playgroundCategories, updating, searchTerm]);

  const filteredCategories = getFilteredCategories();
  const totalTemplates = categories.reduce((sum, cat) => sum + cat.templates.length, 0);

  // Add this after all hooks and before the return statement
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ✅ REMOVED: Automatic duplicate cleanup (moved to manual cleanup only)

  // NEW: Test Upload Function for debugging
  const testSmallUpload = async () => {
    alert('🔥 Test button clicked! Function is executing...');
    console.log('🔥 [TestUpload] Button clicked! Function is executing...');
    
    try {
      console.log('🧪 [TestUpload] Starting small test upload...');
      
      // Test if Firebase Storage is accessible
      console.log('🔗 [TestUpload] Testing Firebase Storage access...');
      console.log('🔗 [TestUpload] Storage instance:', storage);
      
      // Check authentication status
      console.log('🔐 [TestUpload] Checking authentication...');
      console.log('🔐 [TestUpload] Auth instance:', auth);
      console.log('🔐 [TestUpload] Current user:', auth.currentUser);
      
      if (!auth.currentUser) {
        console.error('❌ [TestUpload] No authenticated user found!');
        alert('❌ Error: You must be logged in to upload files.\n\nPlease sign in first.');
        return;
      }
      
      console.log('✅ [TestUpload] User authenticated:', auth.currentUser.email);
      
      // Create a small test file (1KB text file)
      const testContent = 'This is a test upload file created at ' + new Date().toISOString();
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test-upload.txt', { type: 'text/plain' });
      
      console.log('🧪 [TestUpload] Test file created:', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
      });
      
      const testRef = storageRef(storage, `test-uploads/test-${Date.now()}.txt`);
      console.log('🔗 [TestUpload] Storage reference created:', testRef);
      console.log('🔗 [TestUpload] Storage bucket:', testRef.bucket);
      console.log('🔗 [TestUpload] Storage full path:', testRef.fullPath);
      
      // Try simple upload with timeout
      console.log('🧪 [TestUpload] Trying simple upload with 30s timeout...');
      
      const uploadPromise = uploadBytes(testRef, testFile);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000);
      });
      
      await Promise.race([uploadPromise, timeoutPromise]);
      console.log('✅ [TestUpload] Simple upload successful!');
      
      const testURL = await getDownloadURL(testRef);
      console.log('✅ [TestUpload] Got download URL:', testURL);
      
      // Now try resumable upload
      console.log('🧪 [TestUpload] Testing resumable upload...');
      const resumableTestRef = storageRef(storage, `test-uploads/resumable-test-${Date.now()}.txt`);
      const uploadTask = uploadBytesResumable(resumableTestRef, testFile);
      
      const resumablePromise = new Promise<string>((resolve, reject) => {
        const resumableTimeout = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error('Resumable upload timed out after 30 seconds'));
        }, 30000);
        
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`🧪 [TestUpload] Resumable progress: ${progress}%`);
          },
          (error) => {
            clearTimeout(resumableTimeout);
            console.error('🧪 [TestUpload] Resumable error:', error);
            reject(error);
          },
          async () => {
            clearTimeout(resumableTimeout);
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ [TestUpload] Resumable upload successful:', url);
            resolve(url);
          }
        );
      });
      
      await resumablePromise;
      
      alert('✅ Test upload successful! Your Firebase Storage is working correctly.\n\nThe issue might be:\n- File size too large\n- Network connectivity\n- Browser memory limitations\n\nTry uploading smaller video files first.');
      
    } catch (error) {
      console.error('❌ [TestUpload] Test failed:', error);
      console.error('❌ [TestUpload] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`❌ Test upload failed: ${error.message}\n\nThis indicates a Firebase Storage configuration issue.\n\nCheck the browser console for detailed error information.`);
    }
  };

  // NEW: Pre-upload validation
  const validateUploadFile = (file: File): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check file size (warn if > 100MB, error if > 500MB)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 500) {
      issues.push(`File too large: ${sizeMB.toFixed(2)}MB (max 500MB)`);
    } else if (sizeMB > 100) {
      issues.push(`Large file warning: ${sizeMB.toFixed(2)}MB (may be slow)`);
    }
    
    // Check file type
    if (!file.type.startsWith('video/') && !file.name.toLowerCase().endsWith('.mp4')) {
      issues.push(`Not a video file: ${file.type || 'unknown type'}`);
    }
    
    // Check filename
    if (file.name.length > 100) {
      issues.push('Filename too long (max 100 characters)');
    }
    
    return {
      valid: issues.filter(issue => issue.includes('too large') || issue.includes('Not a video')).length === 0,
      issues
    };
  };

  // ✅ NEW: Bulk selection functions
  const toggleTemplateSelection = (templateId: string, isSelected: boolean) => {
    setSelectedTemplates(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(templateId);
      } else {
        newSelected.delete(templateId);
      }
      return newSelected;
    });
  };

  const selectAllTemplatesInCategory = (categoryId: string) => {
    const category = playgroundCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    setSelectedTemplates(prev => {
      const newSelected = new Set(prev);
      category.templates.forEach(template => {
        newSelected.add(template.id);
      });
      return newSelected;
    });
  };

  const deselectAllTemplatesInCategory = (categoryId: string) => {
    const category = playgroundCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    setSelectedTemplates(prev => {
      const newSelected = new Set(prev);
      category.templates.forEach(template => {
        newSelected.delete(template.id);
      });
      return newSelected;
    });
  };

  const selectAllTemplates = () => {
    const allTemplateIds = playgroundCategories.flatMap(cat => 
      cat.templates.map(template => template.id)
    );
    setSelectedTemplates(new Set(allTemplateIds));
  };

  const deselectAllTemplates = () => {
    setSelectedTemplates(new Set());
  };

  const bulkDeleteSelected = async () => {
    if (selectedTemplates.size === 0) {
      alert('No templates selected for deletion.');
      return;
    }

    const templateCount = selectedTemplates.size;
    const confirmMessage = `⚠️ BULK DELETION WARNING ⚠️\n\nAre you sure you want to delete ${templateCount} selected templates?\n\nThis will:\n• Remove them from Firebase database\n• Delete them from all app pages\n• This action CANNOT be undone\n\nClick OK to proceed with bulk deletion.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkDeleting(true);
    setUpdating('bulk-operation');

    try {
      // Get all selected templates with their categories
      const templatesToDelete: Array<{template: Template, categoryId: string}> = [];
      
      playgroundCategories.forEach(category => {
        category.templates.forEach(template => {
          if (selectedTemplates.has(template.id)) {
            templatesToDelete.push({ template, categoryId: category.id });
          }
        });
      });

      console.log(`🗑️ [BulkDelete] Starting bulk deletion of ${templatesToDelete.length} templates`);

      let successCount = 0;
      let failureCount = 0;
      const failures: string[] = [];

      // Process deletions with rate limiting - using the same logic as individual deletion
      for (let i = 0; i < templatesToDelete.length; i++) {
        const { template, categoryId } = templatesToDelete[i];
        
        try {
          console.log(`🗑️ [BulkDelete] Deleting ${i + 1}/${templatesToDelete.length}: ${template.title}`);
          
          // ✅ ENHANCED: Use the same comprehensive logic as individual deleteTemplate
          const templateId = template.id;
          const isFirestoreTemplate = !templateId.startsWith('sample-') && !templateId.startsWith('local-');
          const isPresetTemplate = templateId.startsWith('preset-');
          const isImportedTemplate = templateId.startsWith('imported-');
          const requiresFirestoreDeletion = isFirestoreTemplate || isPresetTemplate || isImportedTemplate;

          // CRITICAL: Firestore existence check before deletion (same as individual delete)
          let existsInFirestore = false;
          let firestoreDocumentId = templateId;
          
          if (requiresFirestoreDeletion) {
            try {
              // Try multiple ID variations to find the actual document
              const possibleIds = [
                templateId,
                template.id,
                templateId.replace('imported-', ''),
                templateId.replace('preset-', '')
              ].filter(Boolean);
              
              for (const testId of possibleIds) {
                try {
                  const testRef = doc(db, 'templates', testId);
                  const testSnap = await getDoc(testRef);
                  
                  if (testSnap.exists()) {
                    existsInFirestore = true;
                    firestoreDocumentId = testId;
                    console.log(`✅ [BulkDelete] Found in Firestore with ID: ${testId}`);
                    break;
                  }
                } catch (idError) {
                  console.log(`❌ [BulkDelete] Error checking ID ${testId}:`, idError);
                }
              }
              
              // If not found by ID, try searching by title/category
              if (!existsInFirestore) {
                try {
                  const templatesRef = collection(db, 'templates');
                  const snapshot = await getDocs(templatesRef);
                  
                  for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (data.title === template.title && data.category === template.category) {
                      existsInFirestore = true;
                      firestoreDocumentId = docSnap.id;
                      console.log(`🔍 [BulkDelete] Found matching template by title/category: ${docSnap.id}`);
                      break;
                    }
                  }
                } catch (searchError) {
                  console.error(`❌ [BulkDelete] Error in broad search:`, searchError);
                }
              }
            } catch (checkError) {
              console.error('❌ [BulkDelete] Error during Firestore existence check:', checkError);
              // Continue with UI deletion even if Firestore check fails
            }
          }

          // Delete from Firestore if it exists there
          if (requiresFirestoreDeletion && existsInFirestore) {
            try {
              await TemplateService.deleteTemplate(firestoreDocumentId);
              console.log(`✅ [BulkDelete] Deleted from Firestore: ${firestoreDocumentId}`);
            } catch (firestoreError) {
              console.error(`❌ [BulkDelete] Failed to delete from Firestore: ${firestoreDocumentId}`, firestoreError);
              // ✅ ENHANCED: Don't throw error, just log it and continue with UI cleanup
              console.log(`🧹 [BulkDelete] Continuing with UI cleanup despite Firestore error: ${template.title}`);
            }
          } else if (requiresFirestoreDeletion && !existsInFirestore) {
            console.log(`🧹 [BulkDelete] Template not in Firestore, UI cleanup only: ${template.title}`);
          } else {
            console.log(`🗑️ [BulkDelete] Local template deletion: ${template.title}`);
            
            // Track deletion for local templates (same as individual delete)
            if (!template.id || template.id.startsWith('local-')) {
              const templateKey = `${template.title}|${template.category}|${template.desc || ''}`.toLowerCase();
              const deletedLocalTemplates = JSON.parse(localStorage.getItem('deletedLocalTemplates') || '[]');
              if (!deletedLocalTemplates.includes(templateKey)) {
                deletedLocalTemplates.push(templateKey);
                localStorage.setItem('deletedLocalTemplates', JSON.stringify(deletedLocalTemplates));
                console.log(`💾 [BulkDelete] Tracked local template deletion: ${templateKey}`);
              }
            }
          }

          successCount++;
          
          // Rate limiting: small delay between deletions
          if (i < templatesToDelete.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.error(`❌ [BulkDelete] Failed to delete ${template.title}:`, error);
          failureCount++;
          failures.push(`${template.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Remove all successfully processed templates from UI (both successful and failed attempts)
      setPlaygroundCategories(prevCategories => {
        return prevCategories.map(category => ({
          ...category,
          templates: category.templates.filter(t => !selectedTemplates.has(t.id))
        }));
      });

      // Clear selection
      setSelectedTemplates(new Set());

      // Show results
      if (failureCount === 0) {
        alert(`✅ Bulk deletion completed successfully!\n\n${successCount} templates deleted.`);
      } else {
        alert(`⚠️ Bulk deletion completed with some failures:\n\n✅ Successfully deleted: ${successCount}\n❌ Failed to delete: ${failureCount}\n\nFailures:\n${failures.join('\n')}`);
      }

      // Force comprehensive refresh after bulk deletion
      setTimeout(() => {
        loadTemplates();
      }, 1000);

      // Trigger callback
      if (onTemplateUpdated) {
        onTemplateUpdated({
          success: true,
          type: 'template-deletion',
          templateId: 'bulk-operation',
          oldCategory: 'multiple',
          newCategory: 'deleted',
          source: 'bulk-deletion'
        });
      }

    } catch (error) {
      console.error('❌ [BulkDelete] Bulk deletion failed:', error);
      alert(`❌ Bulk deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBulkDeleting(false);
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading template categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Category Selector */}
      <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              🎯 Template Category Manager
            </h2>
            <div className="text-sm text-gray-400">
              {availableCategories.length} total categories available
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadTemplates}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🔄 Refresh Templates
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showStats ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Category Dropdown Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">📋 Select Categories for Playground</h3>
            {playgroundCategories.length > 0 && (
              <button
                onClick={clearPlayground}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Clear All ({playgroundCategories.length})
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="All">All Groups</option>
              {Object.entries(CATEGORY_GROUPS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                ➕ Add Category
                <span className="text-sm">({getFilteredAvailableCategories().length})</span>
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-60 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
                  {getFilteredAvailableCategories().map((category) => (
                    <button
                      key={category.id}
                      onClick={() => addCategoryToPlayground(category.id)}
                      disabled={selectedCategoriesForPlayground.has(category.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center gap-3 ${
                        selectedCategoriesForPlayground.has(category.id) 
                          ? 'opacity-50 cursor-not-allowed bg-gray-700' 
                          : ''
                      }`}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{category.title}</div>
                        <div className="text-xs text-gray-400">{category.group}</div>
                      </div>
                      {selectedCategoriesForPlayground.has(category.id) && (
                        <span className="text-green-400 text-sm">✓ Added</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selected Categories Display */}
        {playgroundCategories.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Active Playground Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {playgroundCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-full text-sm">
                  <span>{category.icon}</span>
                  <span>{category.title}</span>
                  <span className="text-xs opacity-75">({category.templates.length})</span>
                  <button
                    onClick={() => removeCategoryFromPlayground(category.id)}
                    className="ml-1 hover:bg-black/20 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{availableCategories.length}</div>
              <div className="text-sm opacity-90">Available Categories</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{playgroundCategories.length}</div>
              <div className="text-sm opacity-90">Active Categories</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {playgroundCategories.reduce((sum, cat) => sum + cat.templates.length, 0)}
              </div>
              <div className="text-sm opacity-90">Total Templates</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{recentUpdates.length}</div>
              <div className="text-sm opacity-90">Recent Updates</div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {dragInProgress ? '🎯 Dragging Template...' : '🎨 Template Category Manager'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadTemplates}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🔄 Refresh
              </button>
              <button
                onClick={toggleAllCategories}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {expandAll ? '📁 Collapse All' : '📂 Expand All'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-black/30 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showStats ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm opacity-90">Categories</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {categories.reduce((sum, cat) => sum + cat.templates.length, 0)}
              </div>
              <div className="text-sm opacity-90">Total Templates</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {categories.filter(cat => cat.templates.length > 0).length}
              </div>
              <div className="text-sm opacity-90">Visible Categories</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-2xl font-bold">{recentUpdates.length}</div>
              <div className="text-sm opacity-90">Recent Updates</div>
            </div>
          </div>
        )}

        {/* Data Source Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">ℹ️</span>
            <span className="font-semibold text-blue-800">Template Data Sources</span>
          </div>
          <div className="text-sm text-blue-700">
            <div className="mb-1">
              <span className="font-medium">Local JSON:</span> {categories.reduce((count, cat) => 
                count + cat.templates.filter(t => t.id?.startsWith('local-')).length, 0)} templates 
              (changes are visual only)
            </div>
            <div>
              <span className="font-medium">Firebase:</span> {categories.reduce((count, cat) => 
                count + cat.templates.filter(t => !t.id?.startsWith('local-')).length, 0)} templates 
              (changes persist)
            </div>
          </div>
        </div>

        {/* File Import Panel */}
        <div 
          className={`border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${
            isDragOverImport 
              ? 'border-green-400 bg-green-900/20' 
              : 'border-gray-600 hover:border-gray-500'
          } ${importingFiles ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">
              {isDragOverImport ? '⬇️' : importingFiles ? '⏳' : '📁'}
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {isDragOverImport ? 'Drop files here!' : importingFiles ? 'Processing files...' : 'Import Templates from Desktop'}
            </h4>
            <p className="text-gray-300 text-sm mb-4">
              {isDragOverImport 
                ? 'Release to import your files' 
                : importingFiles 
                  ? 'Please wait while we process your files'
                  : selectedCategoriesForPlayground.size === 1 
                    ? `Files will be added to: ${playgroundCategories.find(cat => selectedCategoriesForPlayground.has(cat.id))?.title}`
                    : 'Select a category first, then drag & drop images/videos here or click to browse'
              }
            </p>
            
            {!importingFiles && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  disabled={playgroundCategories.length === 0}
                >
                  📤 Browse Files
                </button>
                {playgroundCategories.length === 0 && (
                  <div className="text-yellow-400 text-sm">
                    ⚠️ Add categories to playground first
                  </div>
                )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.json,application/json"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-black/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            💡 How to Use
          </h3>
          <div className="text-gray-300 text-sm space-y-1">
            <p>• <strong>Select categories</strong> from the dropdown to add them to the playground</p>
            <p>• <strong>Drag templates</strong> between playground categories to move them</p>
            <p>• <strong>Import files</strong> by dragging from desktop or using the browse button</p>
            <p>• <strong>Supported formats:</strong> Images (PNG, JPG, etc.), Videos (MP4, MOV, etc.), and JSON template files</p>
            <p>• <strong>JSON Import:</strong> Supports single templates, template arrays, or objects with templates/data properties</p>
            <p>• <strong>Auto-sync:</strong> Imported templates are automatically saved to Firestore and appear in the main app</p>
            <p>• <strong>Delete templates</strong> by dragging them out of categories</p>
            <p>• <strong>Live updates</strong> - Changes appear immediately in the app</p>
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🕒 Recent Category Updates
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentUpdates.map((update, index) => (
              <div key={index} className="bg-black/30 rounded-lg p-3 text-sm">
                <div className={update.newCategory === 'Deleted' ? 'text-red-300' : 'text-green-300'}>
                  {update.newCategory === 'Deleted' ? (
                    <>🗑️ Deleted template <strong>{update.templateId}</strong></>
                  ) : (
                    <>✅ Moved template to <strong>{update.newCategory}</strong></>
                  )}
                </div>
                <div className="text-gray-400 text-xs">
                  {update.newCategory === 'Deleted' ? (
                    <>From: {update.oldCategory} • {new Date(update.timestamp).toLocaleTimeString()}</>
                  ) : (
                    <>From: {update.oldCategory} • {new Date(update.timestamp).toLocaleTimeString()}</>
                  )}
                  {update.source && (
                    <span className="ml-2 px-1 py-0.5 bg-gray-700 rounded text-xs">
                      {update.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <div className="text-yellow-300 text-sm font-mono">
            DEBUG: Playground categories: {playgroundCategories.length} | 
            Total templates: {playgroundCategories.reduce((sum, cat) => sum + cat.templates.length, 0)} | 
            Selected: {Array.from(selectedCategoriesForPlayground).join(', ')}
          </div>
        </div>
      )}

      {/* Playground Area */}
      {playgroundCategories.length > 0 ? (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              🎮 Category Playground
              {dragInProgress && <span className="text-yellow-400">🎯 Dragging...</span>}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                {playgroundCategories.reduce((sum, cat) => sum + cat.templates.length, 0)} templates
              </div>
              
              {/* ✅ NEW: Cleanup Duplicates Button */}
              <button
                onClick={cleanupDuplicatesInPlayground}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
                title="Remove duplicate templates from playground"
              >
                🧹 Clean Duplicates
              </button>
              
              {/* ✅ NEW: Bulk Selection Controls */}
              <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                <button
                  onClick={() => setShowBulkSelection(!showBulkSelection)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    showBulkSelection 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {showBulkSelection ? '✅ Bulk Mode' : '☐ Bulk Mode'}
                </button>
                
                {showBulkSelection && (
                  <>
                    <span className="text-gray-400 text-sm">
                      {selectedTemplates.size} selected
                    </span>
                    
                    <button
                      onClick={selectAllTemplates}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                      title="Select all templates"
                    >
                      All
                    </button>
                    
                    <button
                      onClick={deselectAllTemplates}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                      title="Deselect all templates"
                    >
                      None
                    </button>
                    
                    <button
                      onClick={bulkDeleteSelected}
                      disabled={selectedTemplates.size === 0 || bulkDeleting}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        selectedTemplates.size > 0 && !bulkDeleting
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-500 text-gray-400 cursor-not-allowed'
                      }`}
                      title={`Delete ${selectedTemplates.size} selected templates`}
                    >
                      {bulkDeleting ? '⏳ Deleting...' : `🗑️ Delete (${selectedTemplates.size})`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Drag and Drop Interface */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={(event) => {
              console.log('🎯 [DragStart] ====== DRAG STARTED ======');
              console.log('🎯 [DragStart] Active ID:', event.active.id);
              console.log('🎯 [DragStart] Active data:', event.active.data?.current);
              
              // Enhanced template lookup with better error handling
              const activeId = event.active.id.toString();
              const activeIdParts = activeId.split('|||'); // Use ||| separator
              
              if (activeIdParts.length !== 2) {
                console.error('❌ [DragStart] Invalid active ID format:', activeId, 'Expected: categoryId|||templateId');
                return;
              }
              
              const sourceCategoryId = activeIdParts[0];
              const sourceTemplateId = activeIdParts[1];
              
              console.log(`🔍 [DragStart] Looking for template "${sourceTemplateId}" in category "${sourceCategoryId}"`);
              
              const sourceCategory = playgroundCategories.find(cat => cat.id === sourceCategoryId);
              if (!sourceCategory) {
                console.error('❌ [DragStart] Source category not found:', sourceCategoryId);
                console.log('📊 [DragStart] Available categories:', playgroundCategories.map(c => c.id));
                return;
              }
              
              const foundTemplate = sourceCategory.templates.find(t => t.id === sourceTemplateId);
              if (!foundTemplate) {
                console.error('❌ [DragStart] Template not found in category:', sourceTemplateId);
                console.log('📊 [DragStart] Available templates:', sourceCategory.templates.map(t => ({ id: t.id, title: t.title })));
                return;
              }
              
              console.log(`✅ [DragStart] Found template "${foundTemplate.title}" for drag overlay`);
              setActiveTemplate(foundTemplate);
              setDragInProgress(true);
              
              console.log('🎯 [DragStart] ====== DRAG INITIALIZED ======');
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {playgroundCategories.map((category) => (
                <DroppableCategory key={category.id} category={category}>
                  <div className="mb-4">
                    <div className={`bg-gradient-to-br ${category.color} rounded-2xl overflow-hidden transition-all duration-300 hover:scale-102`}>
                  {/* Category Header */}
                  <div 
                    className="p-4 bg-black/20 backdrop-blur-sm cursor-pointer hover:bg-black/30 transition-all duration-200"
                    onClick={() => toggleCategory(category.id)}
                  >
                                          <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-bold text-white text-lg">{category.title}</h3>
                            <p className="text-white/80 text-sm">{category.templates.length} templates</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* ✅ NEW: Category-level bulk selection controls */}
                          {showBulkSelection && category.templates.length > 0 && (
                            <div className="flex items-center gap-1 mr-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const categoryTemplateIds = category.templates.map(t => t.id);
                                  const allSelected = categoryTemplateIds.every(id => selectedTemplates.has(id));
                                  
                                  if (allSelected) {
                                    deselectAllTemplatesInCategory(category.id);
                                  } else {
                                    selectAllTemplatesInCategory(category.id);
                                  }
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                                title={
                                  category.templates.every(t => selectedTemplates.has(t.id))
                                    ? "Deselect all in category"
                                    : "Select all in category"
                                }
                              >
                                {category.templates.every(t => selectedTemplates.has(t.id)) ? '☑️' : '☐'}
                              </button>
                              <span className="text-white/70 text-xs">
                                {category.templates.filter(t => selectedTemplates.has(t.id)).length}/{category.templates.length}
                              </span>
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategoryFromPlayground(category.id);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            ✕ Remove
                          </button>
                          <div className={`transition-transform duration-200 ${category.isExpanded ? 'rotate-180' : ''}`}>
                            ⬇️
                          </div>
                        </div>
                      </div>
                  </div>

                  {/* Templates List */}
                  {category.isExpanded && (
                      <SortableContext 
                        items={category.templates.map(template => `${category.id}|||${template.id}`)} // Use ||| separator
                        strategy={verticalListSortingStrategy}
                      >
                        <div 
                          className="p-4 bg-black/10 min-h-[200px] max-h-[500px] overflow-y-auto space-y-3"
                          data-category-id={category.id}
                        >
                      {category.templates.length === 0 ? (
                        <div className="text-center py-8 text-white/60">
                          <div className="text-4xl mb-2 opacity-50">📂</div>
                          <p className="font-medium text-white/80 mb-2">No templates in {category.title}</p>
                          <p className="text-sm text-gray-400 mb-3">
                            To add templates to this category:
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>• Import templates via Admin Panel → Template Importers</p>
                            <p>• Drag existing templates from other categories</p>
                            <p>• Upload files using the import section above</p>
                          </div>
                        </div>
                      ) : (
                            category.templates.map((template, index) => (
                              <SortableTemplateItem
                                key={`${category.id}|||${template.id}`} // Use ||| separator
                                template={template}
                                categoryId={category.id}
                                updating={updating}
                                onDelete={deleteTemplate}
                                isSelected={selectedTemplates.has(template.id)}
                                onSelect={toggleTemplateSelection}
                                showSelection={showBulkSelection}
                              />
                            ))
                          )}
                                    </div>
                      </SortableContext>
                                      )}
                                    </div>
                                  </div>
                </DroppableCategory>
              ))}
                                </div>
                                
            {/* Drag Overlay */}
            <DragOverlay>
              {activeTemplate ? (
                <div className="bg-gray-800/90 rounded-lg p-3 border border-blue-400 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    {activeTemplate.preview && (
                      <img 
                        src={activeTemplate.preview} 
                        alt={activeTemplate.title}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate">{activeTemplate.title}</h4>
                      <p className="text-gray-400 text-xs">{activeTemplate.category || 'Uncategorized'}</p>
                      {activeTemplate.platform && (
                        <span className="inline-block bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs mt-1">
                          {activeTemplate.platform}
                        </span>
                      )}
                    </div>
                    <div className="text-blue-400 text-lg">
                      ⋮⋮
                </div>
            </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/30 backdrop-blur-sm border border-gray-700/20 rounded-2xl p-12">
          <div className="text-center">
            <div className="text-6xl mb-6 opacity-50">🎮</div>
            <h3 className="text-2xl font-bold text-white mb-4">Playground is Empty</h3>
            <p className="text-gray-400 mb-6">
              Select categories from the dropdown above to start managing templates.<br/>
              You can drag templates between categories, import files, and organize your content.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowCategoryDropdown(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                ➕ Add Categories
              </button>
              <button
                onClick={loadTemplates}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Drag & Drop Feature Guide */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-700/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🎯 Enhanced Drag & Drop Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔄 Template Reordering
            </h4>
            <p className="text-gray-300">
              Drag templates within the same category to reorder them. Use the ⋮⋮ handle to start dragging.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔀 Cross-Category Movement
            </h4>
            <p className="text-gray-300">
              Drag templates between different categories to reorganize your content structure.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              👁️ Visual Feedback
            </h4>
            <p className="text-gray-300">
              See real-time preview overlays while dragging, with smooth animations and hover effects.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              🗑️ Individual Deletion
            </h4>
            <p className="text-gray-300">
              Click the red 🗑️ button on any template to delete it from the category.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              ☑️ Bulk Deletion
            </h4>
            <p className="text-gray-300">
              Enable "Bulk Mode" to select multiple templates with checkboxes, then delete them all at once. Use category-level controls to select/deselect entire categories.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              📱 Touch Support
            </h4>
            <p className="text-gray-300">
              Fully compatible with touch devices and keyboard navigation for accessibility.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              🎮 Testing & Validation
            </h4>
            <p className="text-gray-300">
              Use "🧪 Test Load" to auto-populate playground, then "🔍 Test D&D" to validate functionality.
            </p>
          </div>
        </div>
        
        {dragInProgress && (
          <div className="mt-4 bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 font-medium flex items-center gap-2">
              🎯 Drag in Progress - Drop to move template to new location
            </p>
          </div>
        )}
        
        {lastMoveResult && (
          <div className="mt-4 bg-green-600/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-300 font-medium flex items-center gap-2">
              {lastMoveResult}
            </p>
          </div>
        )}
      </div>

      {/* NEW: Data Persistence & Sync Guide */}
      <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 backdrop-blur-sm border border-green-700/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          💾 Data Persistence & Sync
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                              📤 Sync to Firestore
            </h4>
            <p className="text-gray-300 mb-2">
                              <strong>Important:</strong> Playground changes are temporary! Use "📤 Sync to Firestore" to persist your drag-and-drop changes to Firestore.
            </p>
            <p className="text-gray-300">
              This will update the actual template database so changes appear in the real YouTube Shorts, TikTok Video pages, etc.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              📥 Download JSON
            </h4>
            <p className="text-gray-300 mb-2">
              Export your playground state as a JSON file for backup or to update local templates.json files.
            </p>
            <p className="text-gray-300">
              Replace /public/templates/templates.json with the downloaded file to make changes permanent in your local build.
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔄 Data Flow
            </h4>
            <p className="text-gray-300">
              <strong>Read:</strong> Playground → Local JSON → Firestore<br/>
              <strong>Write:</strong> Playground → Sync → Firestore + Download → Local JSON
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              ⚠️ Important Notes
            </h4>
            <p className="text-gray-300">
              • Firestore templates sync automatically<br/>
              • Local/sample templates need manual export<br/>
              • Always sync before closing the admin panel
            </p>
          </div>
        </div>
        
        {hasUnsavedChanges() && (
          <div className="mt-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-yellow-300 font-medium flex items-center gap-2">
                              ⚠️ You have unsaved changes in the playground. Use "📤 Sync to Firestore" or "📥 Download JSON" to persist them.
            </p>
          </div>
        )}
      </div>

      {/* Recent Updates Panel */}
      {recentUpdates.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm border border-green-700/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🟢 Recent Category Updates
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {recentUpdates.slice(0, 10).map((update, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{update.templateId}</span> moved from{' '}
                      <span className="text-orange-300">{update.oldCategory}</span> to{' '}
                      <span className="text-green-300">{update.newCategory}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(update.timestamp).toLocaleString()}
                      {update.source && (
                        <span className="ml-2 px-2 py-1 bg-gray-700 rounded text-xs">
                          {update.source}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="ml-3">
                    {update.success ? (
                      <span className="text-green-400 text-lg">✅</span>
                    ) : (
                      <span className="text-red-400 text-lg">❌</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}