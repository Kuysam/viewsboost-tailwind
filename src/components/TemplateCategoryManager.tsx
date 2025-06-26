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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

// ALL STUDIO CATEGORIES - Complete list from Studio.tsx
const ALL_STUDIO_CATEGORIES = [
  // Main Create Categories
  { id: 'business', title: 'Business', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Main' },
  { id: 'marketing', title: 'Marketing', color: 'from-green-600 to-green-700', icon: '📢', group: 'Main' },
  { id: 'social-media', title: 'Social Media', color: 'from-purple-600 to-purple-700', icon: '📱', group: 'Main' },
  { id: 'web-design', title: 'Web Design', color: 'from-cyan-600 to-cyan-700', icon: '🌐', group: 'Main' },
  { id: 'documents', title: 'Documents', color: 'from-gray-600 to-gray-700', icon: '📄', group: 'Main' },
  { id: 'education', title: 'Education', color: 'from-yellow-600 to-yellow-700', icon: '🎓', group: 'Main' },
  { id: 'events', title: 'Events', color: 'from-pink-600 to-pink-700', icon: '🎉', group: 'Main' },
  { id: 'personal', title: 'Personal', color: 'from-indigo-600 to-indigo-700', icon: '👤', group: 'Main' },

  // Video Categories
  { id: 'youtube-video', title: 'YouTube Video', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Video' },
  { id: 'facebook-video', title: 'Facebook Video', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Video' },
  { id: 'instagram-video', title: 'Instagram Video', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Video' },
  { id: 'tiktok-video', title: 'TikTok Video', color: 'from-pink-500 to-pink-600', icon: '🎵', group: 'Video' },
  { id: 'linkedin-video', title: 'LinkedIn Video', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Video' },
  { id: 'twitter-video', title: 'Twitter Video', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Video' },
  { id: 'viewsboost-video', title: 'ViewsBoost Video', color: 'from-violet-500 to-violet-600', icon: '⚡', group: 'Video' },
  { id: 'vimeo-video', title: 'Vimeo Video', color: 'from-teal-500 to-teal-600', icon: '🎥', group: 'Video' },
  { id: 'training-video', title: 'Training Video', color: 'from-orange-500 to-orange-600', icon: '📚', group: 'Video' },
  { id: 'product-demo', title: 'Product Demo', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Video' },
  { id: 'testimonial-video', title: 'Testimonial Video', color: 'from-amber-500 to-amber-600', icon: '💬', group: 'Video' },
  { id: 'tutorial-video', title: 'Tutorial Video', color: 'from-lime-500 to-lime-600', icon: '📖', group: 'Video' },
  { id: 'webinar-video', title: 'Webinar Video', color: 'from-rose-500 to-rose-600', icon: '🎙️', group: 'Video' },

  // Shorts Categories
  { id: 'youtube-shorts', title: 'YouTube Shorts', color: 'from-red-400 to-red-500', icon: '📱', group: 'Shorts' },
  { id: 'instagram-reels', title: 'Instagram Reels', color: 'from-purple-400 to-purple-500', icon: '🎭', group: 'Shorts' },
  { id: 'snapchat-story', title: 'Snapchat Story', color: 'from-yellow-400 to-yellow-500', icon: '👻', group: 'Shorts' },
  { id: 'facebook-story', title: 'Facebook Story', color: 'from-blue-400 to-blue-500', icon: '📖', group: 'Shorts' },
  { id: 'linkedin-story', title: 'LinkedIn Story', color: 'from-blue-500 to-blue-600', icon: '💼', group: 'Shorts' },
  { id: 'pinterest-idea-pin', title: 'Pinterest Idea Pin', color: 'from-red-400 to-red-500', icon: '📌', group: 'Shorts' },
  { id: 'viewsboost-shorts', title: 'ViewsBoost Shorts', color: 'from-violet-400 to-violet-500', icon: '⚡', group: 'Shorts' },

  // Photo Categories
  { id: 'instagram-post', title: 'Instagram Post', color: 'from-purple-500 to-purple-600', icon: '📷', group: 'Photo' },
  { id: 'facebook-post', title: 'Facebook Post', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Photo' },
  { id: 'linkedin-post', title: 'LinkedIn Post', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Photo' },
  { id: 'twitter-post', title: 'Twitter Post', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Photo' },
  { id: 'pinterest-pin', title: 'Pinterest Pin', color: 'from-red-500 to-red-600', icon: '📌', group: 'Photo' },
  { id: 'product-photo', title: 'Product Photo', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Photo' },
  { id: 'profile-picture', title: 'Profile Picture', color: 'from-indigo-500 to-indigo-600', icon: '👤', group: 'Photo' },

  // Post Categories
  { id: 'social-media-post', title: 'Social Media Post', color: 'from-purple-500 to-purple-600', icon: '📱', group: 'Post' },
  { id: 'blog-post', title: 'Blog Post', color: 'from-gray-500 to-gray-600', icon: '📝', group: 'Post' },
  { id: 'news-post', title: 'News Post', color: 'from-red-500 to-red-600', icon: '📰', group: 'Post' },
  { id: 'announcement', title: 'Announcement', color: 'from-orange-500 to-orange-600', icon: '📢', group: 'Post' },
  { id: 'quote-post', title: 'Quote Post', color: 'from-yellow-500 to-yellow-600', icon: '💭', group: 'Post' },
  { id: 'meme-post', title: 'Meme Post', color: 'from-pink-500 to-pink-600', icon: '😂', group: 'Post' },
  { id: 'infographic-post', title: 'Infographic Post', color: 'from-cyan-500 to-cyan-600', icon: '📊', group: 'Post' },
  { id: 'carousel-post', title: 'Carousel Post', color: 'from-indigo-500 to-indigo-600', icon: '🎠', group: 'Post' },

  // Carousel Categories
  { id: 'instagram-carousel', title: 'Instagram Carousel', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Carousel' },
  { id: 'facebook-carousel', title: 'Facebook Carousel', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Carousel' },
  { id: 'linkedin-carousel', title: 'LinkedIn Carousel', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Carousel' },
  { id: 'twitter-thread', title: 'Twitter Thread', color: 'from-sky-500 to-sky-600', icon: '🧵', group: 'Carousel' },
  { id: 'pinterest-story-pin', title: 'Pinterest Story Pin', color: 'from-red-500 to-red-600', icon: '📌', group: 'Carousel' },
  { id: 'product-showcase', title: 'Product Showcase', color: 'from-emerald-500 to-emerald-600', icon: '🛍️', group: 'Carousel' },

  // Thumbnail Categories
  { id: 'youtube-thumbnail', title: 'YouTube Thumbnail', color: 'from-red-500 to-red-600', icon: '🖼️', group: 'Thumbnail' },
  { id: 'video-thumbnail', title: 'Video Thumbnail', color: 'from-gray-500 to-gray-600', icon: '🎬', group: 'Thumbnail' },
  { id: 'blog-thumbnail', title: 'Blog Thumbnail', color: 'from-blue-500 to-blue-600', icon: '📝', group: 'Thumbnail' },
  { id: 'podcast-thumbnail', title: 'Podcast Thumbnail', color: 'from-purple-500 to-purple-600', icon: '🎙️', group: 'Thumbnail' },
  { id: 'course-thumbnail', title: 'Course Thumbnail', color: 'from-green-500 to-green-600', icon: '📚', group: 'Thumbnail' },
  { id: 'webinar-thumbnail', title: 'Webinar Thumbnail', color: 'from-orange-500 to-orange-600', icon: '🎥', group: 'Thumbnail' },
  { id: 'stream-thumbnail', title: 'Stream Thumbnail', color: 'from-pink-500 to-pink-600', icon: '📺', group: 'Thumbnail' },

  // Cover & Banner Categories
  { id: 'facebook-cover', title: 'Facebook Cover', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Cover' },
  { id: 'twitter-header', title: 'Twitter Header', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Cover' },
  { id: 'linkedin-banner', title: 'LinkedIn Banner', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Cover' },
  { id: 'youtube-banner', title: 'YouTube Banner', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Cover' },
  { id: 'instagram-story-highlight', title: 'Instagram Story Highlight', color: 'from-purple-500 to-purple-600', icon: '⭐', group: 'Cover' },
  { id: 'pinterest-board-cover', title: 'Pinterest Board Cover', color: 'from-red-500 to-red-600', icon: '📌', group: 'Cover' },
  { id: 'website-header', title: 'Website Header', color: 'from-gray-500 to-gray-600', icon: '🌐', group: 'Cover' },

  // Story Categories
  { id: 'instagram-story', title: 'Instagram Story', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Story' },
  { id: 'whatsapp-status', title: 'WhatsApp Status', color: 'from-green-500 to-green-600', icon: '💬', group: 'Story' },
  { id: 'youtube-community-post', title: 'YouTube Community Post', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Story' },

  // Ads Categories
  { id: 'facebook-ad', title: 'Facebook Ad', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Ads' },
  { id: 'instagram-ad', title: 'Instagram Ad', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Ads' },
  { id: 'google-ad', title: 'Google Ad', color: 'from-yellow-500 to-yellow-600', icon: '🔍', group: 'Ads' },
  { id: 'linkedin-ad', title: 'LinkedIn Ad', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Ads' },
  { id: 'twitter-ad', title: 'Twitter Ad', color: 'from-sky-500 to-sky-600', icon: '🐦', group: 'Ads' },
  { id: 'pinterest-ad', title: 'Pinterest Ad', color: 'from-red-500 to-red-600', icon: '📌', group: 'Ads' },
  { id: 'youtube-ad', title: 'YouTube Ad', color: 'from-red-500 to-red-600', icon: '🎬', group: 'Ads' },
  { id: 'display-ad', title: 'Display Ad', color: 'from-gray-500 to-gray-600', icon: '🖼️', group: 'Ads' },

  // Live Categories
  { id: 'live-stream-overlay', title: 'Live Stream Overlay', color: 'from-red-500 to-red-600', icon: '📺', group: 'Live' },
  { id: 'twitch-overlay', title: 'Twitch Overlay', color: 'from-purple-500 to-purple-600', icon: '🎮', group: 'Live' },
  { id: 'youtube-live', title: 'YouTube Live', color: 'from-red-500 to-red-600', icon: '🔴', group: 'Live' },
  { id: 'facebook-live', title: 'Facebook Live', color: 'from-blue-500 to-blue-600', icon: '📘', group: 'Live' },
  { id: 'instagram-live', title: 'Instagram Live', color: 'from-purple-500 to-purple-600', icon: '📸', group: 'Live' },
  { id: 'linkedin-live', title: 'LinkedIn Live', color: 'from-blue-600 to-blue-700', icon: '💼', group: 'Live' },
  { id: 'stream-alert', title: 'Stream Alert', color: 'from-orange-500 to-orange-600', icon: '🚨', group: 'Live' },
  { id: 'webcam-frame', title: 'Webcam Frame', color: 'from-gray-500 to-gray-600', icon: '📹', group: 'Live' },

  // Business Sections
  { id: 'presentation', title: 'Presentation', color: 'from-blue-500 to-blue-600', icon: '📊', group: 'Business' },
  { id: 'report', title: 'Report', color: 'from-gray-500 to-gray-600', icon: '📄', group: 'Business' },
  { id: 'proposal', title: 'Proposal', color: 'from-green-500 to-green-600', icon: '📋', group: 'Business' },
  { id: 'invoice', title: 'Invoice', color: 'from-yellow-500 to-yellow-600', icon: '🧾', group: 'Business' },
  { id: 'business-card', title: 'Business Card', color: 'from-purple-500 to-purple-600', icon: '💳', group: 'Business' },
  { id: 'letterhead', title: 'Letterhead', color: 'from-indigo-500 to-indigo-600', icon: '📝', group: 'Business' },
  { id: 'flyer', title: 'Flyer', color: 'from-pink-500 to-pink-600', icon: '📄', group: 'Business' },
  { id: 'brochure', title: 'Brochure', color: 'from-cyan-500 to-cyan-600', icon: '📖', group: 'Business' },
  { id: 'certificate', title: 'Certificate', color: 'from-amber-500 to-amber-600', icon: '🏆', group: 'Business' },

  // Other categories
  { id: 'uncategorized', title: 'Uncategorized', color: 'from-gray-500 to-gray-600', icon: '📄', group: 'Other' }
];

// Group categories by type for dropdown organization
const CATEGORY_GROUPS = {
  'Main': 'Main Categories',
  'Video': 'Video Content',
  'Shorts': 'Short-form Content',
  'Photo': 'Photo Content',
  'Post': 'Post Content',
  'Carousel': 'Carousel Content',
  'Thumbnail': 'Thumbnails',
  'Cover': 'Covers & Banners',
  'Story': 'Stories',
  'Ads': 'Advertisements',
  'Live': 'Live Streaming',
  'Business': 'Business Documents',
  'Other': 'Other'
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
}

function SortableTemplateItem({ template, categoryId, updating, onDelete }: SortableTemplateItemProps) {
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
      <div className={`
        bg-gray-800/50 rounded-lg p-3 border border-gray-700/50
        hover:bg-gray-700/50 transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}
        ${updating === template.id ? 'opacity-50 pointer-events-none' : ''}
      `}>
        <div className="flex items-center gap-3">
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
            <h4 className="text-white font-medium text-sm truncate">{template.title}</h4>
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

  // Load templates and organize by category
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let allTemplates: Template[] = [];
      
      // PRIORITY 1: Try to load from local JSON first (same as useTemplates logic)
      try {
        const response = await fetch('/templates/templates.json');
        if (response.ok) {
          const localData = await response.json();
          console.log(`📁 [CategoryManager] Found ${localData.length} local templates`);
          allTemplates = localData.map((template: any, index: number) => ({
            id: template.id || `local-${index}`,
            ...template
          }));
        }
      } catch (localError) {
        console.warn('📁 [CategoryManager] Local JSON fetch failed, trying Firestore:', localError);
      }
      
      // FALLBACK: Load from Firestore if local JSON failed or is empty
      if (allTemplates.length === 0) {
        console.log('📁 [CategoryManager] Loading from Firestore...');
        const templatesRef = collection(db, 'templates');
        const snapshot = await getDocs(templatesRef);
        allTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Template[];
      }
      
      console.log(`📁 [CategoryManager] Total templates loaded: ${allTemplates.length}`);
      
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
    console.log(`🗑️ [DeleteTemplate] Starting deletion of template ${templateId} from category ${categoryId}`);
    
    const template = playgroundCategories
      .flatMap(cat => cat.templates)
      .find(t => t.id === templateId);
    
    if (!template) {
      console.error('❌ [DeleteTemplate] Template not found:', templateId);
      return;
    }

    // Confirm deletion with detailed information
    const isFirestoreTemplate = !templateId.startsWith('sample-') && !templateId.startsWith('local-') && !templateId.startsWith('imported-');
    const confirmMessage = isFirestoreTemplate 
      ? `⚠️ PERMANENT DELETION ⚠️\n\nAre you sure you want to delete "${template.title}"?\n\nThis will:\n• Remove it from Firebase database\n• Delete it from all app pages\n• This action CANNOT be undone\n\nCategory: ${template.category}\nPlatform: ${template.platform || 'Unknown'}`
      : `Are you sure you want to delete "${template.title}"?\n\nThis will remove it from the playground only.\n\nCategory: ${template.category}\nType: ${templateId.startsWith('sample-') ? 'Sample' : templateId.startsWith('local-') ? 'Local' : 'Imported'} template`;
    
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setUpdating(templateId);
    
    try {
      // 1. IMMEDIATELY update UI (optimistic update)
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
        
      // 2. Determine template type and handle accordingly
      const isSampleTemplate = templateId.startsWith('sample-');
      const isLocalTemplate = templateId.startsWith('local-');
      const isImportedTemplate = templateId.startsWith('imported-');
      
      if (isSampleTemplate || isLocalTemplate || isImportedTemplate) {
        // For sample/local/imported templates, only UI removal is needed
        console.log(`🗑️ [DeleteTemplate] Removed ${isSampleTemplate ? 'sample' : isLocalTemplate ? 'local' : 'imported'} template "${template.title}" from UI`);
      } else {
        // 3. For Firestore templates, delete from database
        console.log(`🗑️ [DeleteTemplate] Deleting Firestore template "${template.title}"`);
        
        try {
          // Using TemplateService to delete from Firestore
          await TemplateService.deleteTemplate(templateId);
          console.log(`✅ [DeleteTemplate] Successfully deleted template from Firestore: ${templateId}`);
        } catch (firestoreError) {
          console.error('❌ [DeleteTemplate] Failed to delete from Firestore:', firestoreError);
          
          // ROLLBACK: Restore template in UI if Firestore deletion failed
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
      }
      
      // 4. Track successful deletion
        const deleteResult: CategoryUpdateResult = {
          success: true,
          templateId,
          oldCategory: template.category || 'Uncategorized',
          newCategory: 'Deleted',
          timestamp: new Date().toISOString(),
          source: 'template-deletion'
        };
        
        setRecentUpdates(prev => [deleteResult, ...prev.slice(0, 9)]);
      
      // 5. Show success feedback
      setLastMoveResult(`🗑️ Deleted "${template.title}" from ${categoryId}`);
      setTimeout(() => setLastMoveResult(null), 3000);
      
      console.log(`✅ [DeleteTemplate] Template "${template.title}" deleted successfully`);
      
      // 6. Notify parent component and trigger global UI refresh
      if (onTemplateUpdated) {
        onTemplateUpdated(deleteResult);
      }

      // 7. Trigger global cache invalidation to refresh main app UI
      console.log('🔄 [DeleteTemplate] Triggering global template cache refresh...');
      window.dispatchEvent(new CustomEvent('templatesUpdated', { 
        detail: { 
          source: 'template-deletion', 
          templateId,
          category: template.category,
          timestamp: Date.now(),
          action: 'delete'
        } 
      }));

      // 8. Also refresh the category manager itself to sync with latest Firestore state
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }

      // 9. Optionally reload templates to ensure UI sync (for non-sample templates)
      if (!isSampleTemplate && !isLocalTemplate && !isImportedTemplate) {
        setTimeout(() => {
          console.log('🔄 [DeleteTemplate] Reloading templates to ensure sync...');
          loadTemplates();
        }, 1000); // Small delay to allow Firestore to update
      }
      
    } catch (error) {
      console.error('❌ [DeleteTemplate] Unexpected error:', error);
      
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
      
      alert(`An unexpected error occurred while deleting the template. It has been restored.\n\nError: ${error.message || error}`);
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
                // Ensure required fields exist and clean up undefined values
                const template: Template = {
                  id: templateData.id || `imported-json-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: templateData.title || templateData.name || 'Imported Template',
                  category: templateData.category || (selectedCategoriesForPlayground.size === 1 
                    ? playgroundCategories.find(cat => selectedCategoriesForPlayground.has(cat.id))?.title || 'Uncategorized'
                    : 'Uncategorized'),
                  desc: templateData.desc || templateData.description || `Imported from ${file.name}`,
                  icon: templateData.icon || '📄',
                  preview: templateData.preview || templateData.previewUrl || templateData.image || '/default-template.png',
                  platform: templateData.platform || 'JSON Import',
                  quality: templateData.quality || 'Original',
                  tags: Array.isArray(templateData.tags) ? templateData.tags : ['imported', 'json'],
                  useVideoPreview: templateData.useVideoPreview || Boolean(templateData.videoSource || templateData.video || templateData.videoUrl),
                  ...templateData // Spread remaining properties
                };

                // Only include videoSource if it has a valid value
                const videoSource = templateData.videoSource || templateData.video || templateData.videoUrl;
                if (videoSource && videoSource.trim() !== '') {
                  template.videoSource = videoSource;
                }

                // Clean up any undefined values to prevent Firebase errors
                Object.keys(template).forEach(key => {
                  if (template[key] === undefined) {
                    delete template[key];
                  }
                });
                
                newTemplates.push(template);
                console.log(`✅ [FileImport] Added template from JSON: ${template.title}`);
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
          // Add templates to the appropriate playground category
          const targetCategoryId = selectedCategoriesForPlayground.size === 1 
            ? Array.from(selectedCategoriesForPlayground)[0]
            : 'uncategorized';
          
          const updatedPlaygroundCategories = playgroundCategories.map(category => {
            if (category.id === targetCategoryId) {
              return {
                ...category,
                templates: [...category.templates, ...newTemplates],
                isExpanded: true
              };
            }
            return category;
          });
          
          setPlaygroundCategories(updatedPlaygroundCategories);
        
        // Add to recent updates
        const updateResult: CategoryUpdateResult = {
          success: true,
          templateId: newTemplates.map(t => t.id).join(', '),
          oldCategory: 'Desktop',
          newCategory: playgroundCategories.find(cat => cat.id === targetCategoryId)?.title || 'Uncategorized',
          timestamp: new Date().toISOString(),
          source: 'file-import'
        };
        
        setRecentUpdates(prev => [updateResult, ...prev.slice(0, 9)]);
        onTemplateUpdated?.(updateResult);
        
        console.log(`✅ [FileImport] Successfully imported ${newTemplates.length} templates`);
        
        // Show success message
        const successMessage = `✅ Successfully imported ${newTemplates.length} templates! They will be automatically synced to Firestore in a moment.`;
        setLastMoveResult(successMessage);
        setTimeout(() => setLastMoveResult(null), 8000);
        
        // Auto-sync imported templates to Firestore for immediate availability in main app
        console.log(`🔄 [FileImport] Auto-syncing imported templates to Firestore...`);
        setTimeout(async () => {
          await syncPlaygroundToStorage();
          
          // After sync, verify templates are in Firestore
          console.log(`🔍 [FileImport] Verifying imported templates are in Firestore...`);
          try {
            const templatesRef = collection(db, 'templates');
            const snapshot = await getDocs(templatesRef);
            const firestoreTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const youtubeTemplates = firestoreTemplates.filter(t => t.category === 'YouTube Video');
            console.log(`🔍 [FileImport] Found ${youtubeTemplates.length} YouTube Video templates in Firestore:`, youtubeTemplates.map(t => t.title));
          } catch (error) {
            console.error(`❌ [FileImport] Error verifying Firestore:`, error);
          }
        }, 1000); // Small delay to ensure UI updates first
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
          // Update with fresh template data but preserve playground state
          return {
            ...playgroundCat,
            templates: matchingCategory.templates,
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
      console.log(`🔄 [Sync] Starting sync of ${syncResults.total} templates...`);

      // Sync to Firestore - handle existing templates and new imported templates differently
      for (const template of allPlaygroundTemplates) {
        // Skip only sample/local templates, but process imported templates
        if (template.id.startsWith('sample-') || template.id.startsWith('local-')) {
          console.log(`⏭️ [Sync] Skipping sample/local template: ${template.id}`);
          continue;
        }

        try {
          // For imported templates, create new Firestore documents
          if (template.id.startsWith('imported-')) {
            console.log(`📤 [Sync] Creating new Firestore document for imported template: ${template.title}`);
            
            // Prepare template data for Firestore (remove local-only properties)
            const firestoreTemplate: any = {
              ...template,
              // Convert object URLs to default values if they exist (they won't work after page reload anyway)
              preview: template.preview?.startsWith('blob:') ? '/default-template.png' : template.preview,
              // Add metadata
              lastModified: new Date().toISOString(),
              modifiedBy: 'admin-import',
              createdAt: new Date().toISOString(),
              importedFromFile: true
            };

            // Remove undefined values and local file references that Firebase doesn't accept
            delete firestoreTemplate.importedFile;
            
            // Handle videoSource - only include if it exists and isn't a blob URL
            if (template.videoSource && !template.videoSource.startsWith('blob:')) {
              firestoreTemplate.videoSource = template.videoSource;
            } else {
              // Don't include undefined videoSource field
              delete firestoreTemplate.videoSource;
            }

            // Clean up any other undefined values that could cause Firebase errors
            Object.keys(firestoreTemplate).forEach(key => {
              if (firestoreTemplate[key] === undefined) {
                delete firestoreTemplate[key];
              }
            });
          
            // Create new Firestore document
            console.log(`📤 [Sync] Attempting to create template with data:`, {
              id: template.id,
              title: template.title,
              category: template.category,
              hasVideoSource: Boolean(firestoreTemplate.videoSource),
              fieldCount: Object.keys(firestoreTemplate).length
            });

            const result = await TemplateService.createTemplate(firestoreTemplate);
            if (result.success) {
              syncResults.firestore.success++;
              console.log(`✅ [Sync] Successfully created Firestore template: ${template.title} (ID: ${result.templateId})`);
            } else {
              syncResults.firestore.failed++;
              console.error(`❌ [Sync] Failed to create imported template ${template.id}:`, result.error);
              console.error(`❌ [Sync] Template data that failed:`, {
                title: template.title,
                category: template.category,
                preview: template.preview,
                videoSource: template.videoSource,
                fieldKeys: Object.keys(firestoreTemplate)
              });
            }
          } 
          // For existing templates, update category only
          else {
            console.log(`📝 [Sync] Updating category for existing template: ${template.id}`);
            const result = await TemplateService.updateTemplateCategory(template.id, template.category, 'admin');
            if (result.success) {
              syncResults.firestore.success++;
            } else {
              syncResults.firestore.failed++;
              console.error(`❌ [Sync] Failed to sync ${template.id}:`, result.error);
            }
          }
        } catch (error) {
          syncResults.firestore.failed++;
          console.error(`❌ [Sync] Error syncing ${template.id}:`, error);
        }
      }

      // Create success message
      const messages = [];
      if (syncResults.firestore.success > 0) {
        messages.push(`✅ Synced ${syncResults.firestore.success} templates to Firestore`);
      }
      if (syncResults.firestore.failed > 0) {
        messages.push(`❌ Failed to sync ${syncResults.firestore.failed} templates`);
      }

      const finalMessage = messages.length > 0 
        ? messages.join('\n') 
        : '✅ All playground changes synced successfully!';

      setLastMoveResult(finalMessage);
      setTimeout(() => setLastMoveResult(null), 5000);

      // Trigger refresh of the actual category pages
      if (onCategoryUpdated) {
        onCategoryUpdated();
      }

      console.log(`✅ [Sync] Completed sync:`, syncResults);

      // 🔥 CRITICAL: Force cache invalidation to show changes immediately
      // The CategoryTemplates page loads from local JSON first, so we need to
      // force it to reload from Firestore to see our synced changes
      console.log('🔄 [Sync] Invalidating template cache to force Firestore reload...');
      
      // Dispatch a custom event to notify useTemplates hooks to bypass local JSON
      window.dispatchEvent(new CustomEvent('templatesUpdated', { 
        detail: { 
          source: 'admin-sync', 
          timestamp: Date.now(),
          categories: playgroundCategories.map(cat => cat.title)
        } 
      }));

    } catch (error) {
      console.error('❌ [Sync] Sync failed:', error);
      alert(`Sync failed: ${error.message || error}`);
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

    // Collect all templates from playground with updated categories
    const allPlaygroundTemplates = playgroundCategories.flatMap(cat => 
      cat.templates.map(template => ({
        ...template,
        category: cat.title, // Use category title from playground
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin-playground',
        playgroundUpdated: true
      }))
    );

    // Create downloadable JSON
    const jsonStr = JSON.stringify(allPlaygroundTemplates, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    
    const exportFileDefaultName = `templates-playground-export-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    setLastMoveResult(`📥 Downloaded ${allPlaygroundTemplates.length} templates as ${exportFileDefaultName}`);
    setTimeout(() => setLastMoveResult(null), 5000);

    console.log(`📥 [Download] Exported ${allPlaygroundTemplates.length} templates`);
  };

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
              <button
                onClick={toggleAllCategories}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
              >
                {expandAll ? '📁 Collapse All' : '📂 Expand All'}
              </button>
              <button
                onClick={refreshPlaygroundCategories}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                🔄 Refresh Templates
              </button>
              <button
                onClick={syncPlaygroundToStorage}
                className={`px-3 py-1 text-white rounded-lg text-sm transition-colors ${
                  hasUnsavedChanges() && updating !== 'sync-all'
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
                disabled={!hasUnsavedChanges() || updating === 'sync-all'}
                title="Sync playground changes to Firestore"
              >
                {updating === 'sync-all' ? '⏳ Syncing...' : '📤 Sync to Storage'}
              </button>
              <button
                onClick={downloadPlaygroundAsJSON}
                className={`px-3 py-1 text-white rounded-lg text-sm transition-colors ${
                  hasUnsavedChanges() 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
                disabled={!hasUnsavedChanges()}
                title="Download playground state as JSON file"
              >
                📥 Download JSON
              </button>
              {import.meta.env.DEV && (
                <>
                <button
                  onClick={() => {
                    // Auto-add some categories for testing
                    addCategoryToPlayground('tiktok-video');
                    addCategoryToPlayground('youtube-video');
                    addCategoryToPlayground('profile-picture');
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  🧪 Test Load
                </button>
                  <button
                    onClick={testDragAndDrop}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    🔍 Test D&D
                  </button>
                </>
              )}
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
              📤 Sync to Storage
            </h4>
            <p className="text-gray-300 mb-2">
              <strong>Important:</strong> Playground changes are temporary! Use "📤 Sync to Storage" to persist your drag-and-drop changes to Firestore.
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
              ⚠️ You have unsaved changes in the playground. Use "📤 Sync to Storage" or "📥 Download JSON" to persist them.
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