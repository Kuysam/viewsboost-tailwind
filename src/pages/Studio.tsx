import { addMediaLayer } from '../utils/canvasMedia';
import Row from '../components/studio/Row';
import { Card } from '../components/studio/Card';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fabric } from 'fabric';

// --- Local template manifest types ---
type TemplateMeta = {
  id: string;
  name: string;
  width: number;
  height: number;
  jsonPath: string;
  thumbnail?: string;
};


import {
  Plus, Upload, Video, Image, Music,
  LayoutTemplate, Shapes, Wrench, Type, Brush,
  Folder, ImagePlus, FileText, Globe2, Users, Sparkles, Download, Share, Search as SearchIcon, X,
  // Add new icons for enhanced functionality
  Camera, Mic, Palette, Settings, Grid, Star, Heart, Play, Pause, 
  MoreHorizontal, Filter, Crop, RotateCw, Zap, Volume2, Home, Eye,
  Monitor, Smartphone, Tablet, PenTool, Layers, AlignLeft, AlignCenter, AlignRight
} from "lucide-react";
import { useTemplates } from "../lib/useTemplates";
import ModernTemplateGrid from "../components/ModernTemplateGrid";
import ViewsBoostCanvaEditor from "../components/ViewsBoostCanvaEditor";
import { ProfessionalTimeline } from "../components/ProfessionalTimeline";
import TemplatePreviewModal from "../components/TemplatePreviewModal";
import ResponsiveTextPresetsPanel from "../components/ResponsiveTextPresetsPanel";
import TextEditorCanvas from "../components/TextEditorCanvas";
import FabricTextEditor from "../components/FabricTextEditor";
import { TextElement, TextPreset } from "../types/textPresets";

// Helper function to normalize category names for comparison
function normalizeCategory(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Helper function for category configuration
const CATEGORY_CONFIG: { [key: string]: { emoji: string; accent: string } } = {
  Business: { emoji: "💼", accent: "text-blue-400" },
  Marketing: { emoji: "📢", accent: "text-pink-400" },
  "Social Media": { emoji: "📱", accent: "text-purple-400" },
  "Web Design": { emoji: "🌐", accent: "text-green-400" },
  Documents: { emoji: "📄", accent: "text-indigo-400" },
  Education: { emoji: "🎓", accent: "text-yellow-400" },
  Events: { emoji: "🎉", accent: "text-red-400" },
  Personal: { emoji: "👤", accent: "text-gray-400" },
  Templates: { emoji: "🎨", accent: "text-purple-400" }
};

// --- Sidebar Tabs ---
const TABS = [
  { key: "create", label: "Create", icon: <Plus size={20} /> },
  { key: "uploads", label: "My Uploads", icon: <Upload size={20} /> },
  { key: "video", label: "Video", icon: <Video size={20} /> },
  { key: "photos", label: "Photos", icon: <Image size={20} /> },
  { key: "musics", label: "Musics", icon: <Music size={20} /> },
  { key: "templates", label: "Templates", icon: <LayoutTemplate size={20} /> },
  { key: "elements", label: "Elements", icon: <Shapes size={20} /> },
  { key: "tools", label: "Tools", icon: <Wrench size={20} /> },
  { key: "texte", label: "Texte", icon: <Type size={20} /> },
  { key: "styles", label: "Styles", icon: <Brush size={20} /> }
];

const CREATE_SUBTABS = [
  "Business",
  "Marketing",
  "Social Media",
  "Web Design",
  "Documents",
  "Education",
  "Events",
  "Personal"
];

// --- Business Category Sections ---
const BUSINESS_SECTIONS = [
  { key: "presentation", label: "Presentation" },
  { key: "report", label: "Report" },
  { key: "proposal", label: "Proposal" },
  { key: "invoice", label: "Invoice" },
  { key: "business-card", label: "Business Card" },
  { key: "letterhead", label: "Letterhead" },
  { key: "flyer", label: "Flyer" },
  { key: "brochure", label: "Brochure" },
  { key: "certificate", label: "Certificate" }
];

// --- Marketing Category Sections ---
const MARKETING_SECTIONS = [
  { key: "campaign", label: "Campaign" },
  { key: "email", label: "Email" },
  { key: "banner", label: "Banner" },
  { key: "infographic", label: "Infographic" },
  { key: "landing-page", label: "Landing Page" },
  { key: "ad-creative", label: "Ad Creative" },
  { key: "newsletter", label: "Newsletter" },
  { key: "lead-magnet", label: "Lead Magnet" }
];

// --- Web Design Category Sections ---
const WEB_DESIGN_SECTIONS = [
  { key: "website", label: "Website" },
  { key: "landing-page", label: "Landing Page" },
  { key: "ui-elements", label: "UI Elements" },
  { key: "app-design", label: "App Design" },
  { key: "email-template", label: "Email Template" },
  { key: "blog", label: "Blog" },
  { key: "e-commerce", label: "E-commerce" },
  { key: "portfolio", label: "Portfolio" }
];

// --- Documents Category Sections ---
const DOCUMENTS_SECTIONS = [
  { key: "resume", label: "Resume" },
  { key: "contract", label: "Contract" },
  { key: "report", label: "Report" },
  { key: "proposal", label: "Proposal" },
  { key: "certificate", label: "Certificate" },
  { key: "form", label: "Form" },
  { key: "guide", label: "Guide" },
  { key: "checklist", label: "Checklist" },
  { key: "ebook", label: "eBook" }
];

// --- Education Category Sections ---
const EDUCATION_SECTIONS = [
  { key: "course", label: "Course" },
  { key: "lesson", label: "Lesson" },
  { key: "workshop", label: "Workshop" },
  { key: "tutorial", label: "Tutorial" },
  { key: "quiz", label: "Quiz" },
  { key: "certificate", label: "Certificate" },
  { key: "infographic", label: "Infographic" },
  { key: "study-guide", label: "Study Guide" },
  { key: "webinar", label: "Webinar" }
];

// --- Events Category Sections ---
const EVENTS_SECTIONS = [
  { key: "invitation", label: "Invitation" },
  { key: "poster", label: "Poster" },
  { key: "ticket", label: "Ticket" },
  { key: "program", label: "Program" },
  { key: "badge", label: "Badge" },
  { key: "banner", label: "Banner" },
  { key: "schedule", label: "Schedule" },
  { key: "social-media", label: "Social Media" },
  { key: "certificate", label: "Certificate" }
];

// --- Social Media Category Sections ---
const SOCIAL_MEDIA_SECTIONS = [
  { key: "video", label: "Video" },
  { key: "photo", label: "Photo" },
  { key: "shorts", label: "Shorts" },
  { key: "post", label: "Post" },
  { key: "carousel", label: "Carousel" },
  { key: "story", label: "Story" },
  { key: "thumbnail", label: "Thumbnail" },
  { key: "cover", label: "Cover & Banner" },
  { key: "profile", label: "Profile" },
  { key: "ads", label: "Ads" },
  { key: "live", label: "Live" }
];

// Helper for logo icons
const logoIcon = (platform: string, alt: string) => <img src={`/icons/${platform}.svg`} alt={alt} className="inline w-7 h-7 align-middle mr-2" />;

// Video categories (fixed the constant declaration)
const VIDEO_SELECTOR_LIST = [
  "YouTube Video",
  "YouTube Intro", 
  "Customize Video",
  "Video Landscape",
  "Video Full HD (4K/8K)",
  "Twitter Video",
  "ViewsBoost Video",
  "YouTube Thumbnail",
  "ViewsBoost Thumbnail",
  "Multi-screen (Customizable)"
];

const TOPBAR_SECTIONS = [
  { key: "projects", label: "My Projects", icon: <Folder size={18} /> },
  { key: "assets", label: "Creative Asset", icon: <ImagePlus size={18} /> },
  { key: "docs", label: "Documents", icon: <FileText size={18} /> },
  { key: "web", label: "Webpage", icon: <Globe2 size={18} /> },
  { key: "social", label: "Social Media", icon: <Users size={18} /> },
  { key: "ai", label: "Generative AI", icon: <Sparkles size={18} /> }
];

function TopNavBar() {
  const [activeTopSection, setActiveTopSection] = useState<string | null>(null);

  return (
    <div className="w-full flex items-center px-6 py-3 bg-black z-50 border-b border-[#222] relative">
      <div className="flex items-center gap-2 mr-8 flex-shrink-0">
        <span className="text-4xl text-yellow-400 font-bold select-none">🎨</span>
        <span className="text-2xl font-extrabold text-yellow-400">ViewsBoost Studio</span>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
        {TOPBAR_SECTIONS.map((section: any) => (
          <button
            key={section.key}
            onClick={() => setActiveTopSection(activeTopSection === section.key ? null : section.key)}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition ${
              activeTopSection === section.key 
                ? "bg-yellow-400 text-black" 
                : "text-yellow-300 bg-[#16171c] hover:bg-[#232436]"
            }`}
          >
            {section.icon}
            {section.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex items-center mr-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-3 py-2 rounded-xl bg-[#16171c] text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-300"
            style={{ minWidth: 180 }}
          />
          <SearchIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-300 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ icon, title, desc, border, shadow, accent, preview, onClick }: {
  icon: string;
  title: string;
  desc: string;
  border: string;
  shadow: string;
  accent: string;
  preview?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative group rounded-2xl p-5 cursor-pointer transition-all overflow-hidden shadow-lg bg-gray-200 border border-transparent hover:border-yellow-400 hover:shadow-[0_4px_32px_0_rgba(255,214,10,0.15)]`}
      style={{
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        position: "relative",
        background: preview ? `url('${preview}') center center/cover no-repeat` : '#f5f5f5',
      }}
      onClick={onClick}
      tabIndex={0}
      role="button"
    >
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 rounded-2xl" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.10) 100%)'}} />
      <div className={`text-3xl mb-2 z-10 relative ${accent} drop-shadow-[0_2px_8px_#000a]`}>{icon}</div>
      <div className="text-xl font-bold text-white z-10 relative drop-shadow-lg">{title}</div>
      <div className="text-md text-white mt-1 mb-2 z-10 relative font-medium drop-shadow-md">{desc}</div>
      <span className={`absolute bottom-3 right-4 text-2xl opacity-10 group-hover:opacity-25 transition ${accent}`}>{icon}</span>
    </div>
  );
}

// --- Developer Note ---
// All templates are now fetched from Firestore. No hardcoded arrays are used.
// All real templates are displayed without any limits or dummy templates.
// Template categories (fixed, not dynamic from removed arrays)
const SHORTS_SELECTOR_LIST = [
  "Facebook Reel",
  "Instagram Reel",
  "Snapchat Shorts",
  "TikTok Shorts",
  "Pinterest Video Pin",
  "Linked Short",
  "LinkedIn Video",
  "ViewsBoost Shorts",
  "YouTube Shorts"
];

// Photo categories
const PHOTO_SELECTOR_LIST = [
  "Social Media Posts",
  "Marketing/Promotional",
  "Restaurant",
  "Quote/Motivational",
  "Business/Professional",
  "E-commerce",
  "Event/Announcement",
  "Infographic",
  "Seasonal/Holiday",
  "Personal Branding"
];

// Post categories
const POST_SELECTOR_LIST = [
  "Marketing",
  "Promotions",
  "Educational & Informative",
  "Personal & Lifestyle",
  "Entertainment",
  "Humorous",
  "Inspirational",
  "Motivational",
  "Events & Seasonal",
  "Interactive & Engagement",
  "Creative & Artistic"
];

// Carousel categories
const CAROUSEL_SELECTOR_LIST = [
  "Educational",
  "Business",
  "E-commerce",
  "Storytelling",
  "Tips & Lists",
  "Portfolio",
  "Before & After",
  "Creative"
];

// Thumbnail categories
const THUMBNAIL_SELECTOR_LIST = [
  "YouTube",
  "IGTV",
  "Facebook Video",
  "Course/Webinar",
  "Gaming",
  "Vlog",
  "Tutorial",
  "Entertainment",
  "Business",
  "Text Style",
  "Arrow/Pointer",
  "Minimalist",
  "Text Focus",
  "Split Screen",
  "Face Reaction"
];

// Cover & Banner categories
const COVER_SELECTOR_LIST = [
  "Social Media General (Universal Appeal)",
  "YouTube Channel Art (Video-focused engagement)",
  "Facebook Covers (Community-focused)",
  "LinkedIn Banners (Professional Networking)",
  "Event & Promotions (Timely Engagement)",
  "Business & Corporate (Brand Authority)",
  "Music & Entertainment (Broad Audience Appeal)",
  "Health & Fitness (Wellness Engagement)",
  "Creative & Artistic (Visual Inspiration)"
];

// Profile categories
const PROFILE_SELECTOR_LIST = [
  "Professional/Business",
  "Personal/Lifestyle",
  "Creative & Artistic",
  "Minimal & Clean",
  "Colorful & Bold",
  "Brand/Logo",
  "Gaming & Tech",
  "Music & Entertainment",
  "Health & Fitness"
];

// Story categories
const STORY_SELECTOR_LIST = [
  "Instagram Story",
  "Facebook Story",
  "Snapchat Story",
  "LinkedIn Story",
  "Behind the Scenes",
  "Product Showcase",
  "Event Coverage",
  "Tutorials",
  "Quotes & Inspiration"
];

// Live categories
const LIVE_SELECTOR_LIST = [
  "Live Streaming",
  "Webinar",
  "Product Launch",
  "Q&A Session",
  "Behind the Scenes",
  "Tutorial",
  "Gaming Stream",
  "Music Performance",
  "Event Coverage"
];

// Ads categories
const ADS_SELECTOR_LIST = [
  "Facebook Ads",
  "Instagram Ads", 
  "Google Ads",
  "LinkedIn Ads",
  "Twitter Ads",
  "TikTok Ads",
  "YouTube Ads",
  "Display Ads",
  "Banner Ads"
];

function CreateModal({ visible, subTabs, selectedSubTab, onSelectSubTab, onPreview, onClose, onTemplateEdit }: {
    visible: boolean;
    subTabs: string[];
    selectedSubTab: string;
    onSelectSubTab: (tab: string) => void;
    onPreview: (tpl: any) => void;
    onClose: () => void;
    onTemplateEdit?: (template: any) => void;
  }) {
  const navigate = useNavigate();
  const [selectedBusinessSection, setSelectedBusinessSection] = useState<string>(BUSINESS_SECTIONS[0].key);
  const [selectedMarketingSection, setSelectedMarketingSection] = useState<string>(MARKETING_SECTIONS[0].key);
  const [selectedWebDesignSection, setSelectedWebDesignSection] = useState<string>(WEB_DESIGN_SECTIONS[0].key);
  const [selectedDocumentsSection, setSelectedDocumentsSection] = useState<string>(DOCUMENTS_SECTIONS[0].key);
  const [selectedEducationSection, setSelectedEducationSection] = useState<string>(EDUCATION_SECTIONS[0].key);
  const [selectedEventsSection, setSelectedEventsSection] = useState<string>(EVENTS_SECTIONS[0].key);
  const [selectedSocialSection, setSelectedSocialSection] = useState<string>(SOCIAL_MEDIA_SECTIONS[0].key);
  const [selectedVideoType, setSelectedVideoType] = useState<string>(VIDEO_SELECTOR_LIST[0]);
  const [selectedShortsType, setSelectedShortsType] = useState<string>(SHORTS_SELECTOR_LIST[0]);
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>(PHOTO_SELECTOR_LIST[0]);
  const [selectedPostType, setSelectedPostType] = useState<string>(POST_SELECTOR_LIST[0]);
  const [selectedCarouselType, setSelectedCarouselType] = useState<string>(CAROUSEL_SELECTOR_LIST[0]);
  const [selectedThumbnailType, setSelectedThumbnailType] = useState<string>(THUMBNAIL_SELECTOR_LIST[0]);
  const [selectedCoverType, setSelectedCoverType] = useState<string>(COVER_SELECTOR_LIST[0]);
  const [selectedProfileType, setSelectedProfileType] = useState<string>(PROFILE_SELECTOR_LIST[0]);
  const [selectedStoryType, setSelectedStoryType] = useState<string>(STORY_SELECTOR_LIST[0]);
  const [selectedLiveType, setSelectedLiveType] = useState<string>(LIVE_SELECTOR_LIST[0]);
  const [selectedAdsType, setSelectedAdsType] = useState<string>(ADS_SELECTOR_LIST[0]);
  
  // State for showing template counts
  const [showTemplateCounts, setShowTemplateCounts] = useState<{[key: string]: number}>({});

  // Function to navigate to category page
  function navigateToCategory(category: string) {
    const encodedCategory = encodeURIComponent(category);
    navigate(`/category/${encodedCategory}`);
  }

  // Function to count templates for a specific category (using ALL templates)
  const getTemplateCount = (category: string): number => {
    if (!allTemplates || allTemplates.length === 0) return 0;
    return allTemplates.filter(tpl => normalizeCategory(tpl.category) === normalizeCategory(category)).length;
  };

  // Function to handle category button click (show count)
  const handleCategoryClick = (category: string, setter: Function) => {
    const count = getTemplateCount(category);
    setShowTemplateCounts(prev => ({
      ...prev,
      [category]: count
    }));
    setter(category);
  };

  // Dynamically set category for useTemplates
  let templatesCategory: string | null = selectedSubTab;
  if (selectedSubTab === "Business") {
    templatesCategory = selectedBusinessSection;
  } else if (selectedSubTab === "Marketing") {
    templatesCategory = selectedMarketingSection;
  } else if (selectedSubTab === "Web Design") {
    templatesCategory = selectedWebDesignSection;
  } else if (selectedSubTab === "Documents") {
    templatesCategory = selectedDocumentsSection;
  } else if (selectedSubTab === "Education") {
    templatesCategory = selectedEducationSection;
  } else if (selectedSubTab === "Events") {
    templatesCategory = selectedEventsSection;
  } else if (selectedSubTab === "Personal") {
    templatesCategory = selectedSubTab; // Personal uses the main tab name
  } else if (selectedSubTab === "Social Media") {
    if (selectedSocialSection === "video") {
      templatesCategory = selectedVideoType;
    } else if (selectedSocialSection === "shorts") {
      templatesCategory = selectedShortsType;
    } else if (selectedSocialSection === "photo") {
      templatesCategory = selectedPhotoType;
    } else if (selectedSocialSection === "post") {
      templatesCategory = selectedPostType;
    } else if (selectedSocialSection === "carousel") {
      templatesCategory = selectedCarouselType;
    } else if (selectedSocialSection === "thumbnail") {
      templatesCategory = selectedThumbnailType;
    } else if (selectedSocialSection === "cover") {
      templatesCategory = selectedCoverType;
    } else if (selectedSocialSection === "profile") {
      templatesCategory = selectedProfileType;
    } else if (selectedSocialSection === "story") {
      templatesCategory = selectedStoryType;
    } else if (selectedSocialSection === "live") {
      templatesCategory = selectedLiveType;
    } else if (selectedSocialSection === "ads") {
      templatesCategory = selectedAdsType;
    } else {
      // For all other social media sections
      // Use the section name directly as the category to fetch from Firestore
      templatesCategory = selectedSocialSection;
    }
  } else if (selectedSubTab === "Templates") {
    // For Templates tab, we want to fetch ALL templates, so pass null to get all
    templatesCategory = null;
  }
  const { templates, loading }: { templates: any[]; loading: boolean } = useTemplates(templatesCategory);

  // Fetch ALL templates for counting purposes (always fetch all regardless of selected category)
  const { templates: allTemplates }: { templates: any[]; loading: boolean } = useTemplates(null);

  React.useEffect(() => {
    if (selectedSubTab === "Business") {
      setSelectedBusinessSection(BUSINESS_SECTIONS[0].key);
    } else if (selectedSubTab === "Marketing") {
      setSelectedMarketingSection(MARKETING_SECTIONS[0].key);
    } else if (selectedSubTab === "Web Design") {
      setSelectedWebDesignSection(WEB_DESIGN_SECTIONS[0].key);
    } else if (selectedSubTab === "Documents") {
      setSelectedDocumentsSection(DOCUMENTS_SECTIONS[0].key);
    } else if (selectedSubTab === "Education") {
      setSelectedEducationSection(EDUCATION_SECTIONS[0].key);
    } else if (selectedSubTab === "Events") {
      setSelectedEventsSection(EVENTS_SECTIONS[0].key);
    } else if (selectedSubTab === "Social Media") {
      setSelectedSocialSection(SOCIAL_MEDIA_SECTIONS[0].key);
      setSelectedVideoType(VIDEO_SELECTOR_LIST[0]);
      setSelectedShortsType(SHORTS_SELECTOR_LIST[0]);
      setSelectedPhotoType(PHOTO_SELECTOR_LIST[0]);
      setSelectedPostType(POST_SELECTOR_LIST[0]);
      setSelectedCarouselType(CAROUSEL_SELECTOR_LIST[0]);
      setSelectedThumbnailType(THUMBNAIL_SELECTOR_LIST[0]);
      setSelectedCoverType(COVER_SELECTOR_LIST[0]);
      setSelectedProfileType(PROFILE_SELECTOR_LIST[0]);
      setSelectedStoryType(STORY_SELECTOR_LIST[0]);
      setSelectedLiveType(LIVE_SELECTOR_LIST[0]);
      setSelectedAdsType(ADS_SELECTOR_LIST[0]);
    }
  }, [selectedSubTab]);

   const getTemplateEditorRoute = (template: any) => {
    // Debug log
    console.log('[ROUTE DEBUG][Studio]', { template });

    if (!template || !template.category) {
      const route = `/editor/video?template=${encodeURIComponent(template.id || template.title)}`;
      console.log('[ROUTE DEBUG][Studio] No category, using video route:', route);
      return route;
    }

    // Image template check FIRST
    const isImageTemplate = template.fileType === 'image' || template.detectedPlatform === 'General';
    if (isImageTemplate) {
      const route = `/editor/original?template=${encodeURIComponent(template.id || template.title)}`;
      console.log('[ROUTE DEBUG][Studio] Detected image template, using original route:', route);
      return route;
    }

    const category = template.category.toLowerCase();
    const shortsCategories = ['instagram reel', 'instagram reels', 'tiktok short', 'tiktok shorts', 'tiktok video', 'facebook reel', 'facebook reels', 'youtube short', 'youtube shorts', 'snapchat story', 'pinterest story'];
    const isShorts = shortsCategories.some(shortsCat => category.includes(shortsCat.replace(' ', '')) || category.includes(shortsCat));
    if (isShorts) return `/editor/shorts?template=${encodeURIComponent(template.id || template.title)}`;
    const storyCategories = ['story', 'instagram story', 'facebook story'];
    const isStory = storyCategories.some(storyCat => category.includes(storyCat));
    if (isStory) return `/editor/story?template=${encodeURIComponent(template.id || template.title)}`;
    const squareCategories = ['instagram post', 'facebook post', 'post', 'square'];
    const isSquare = squareCategories.some(sqCat => category.includes(sqCat));
    if (isSquare) return `/editor/square?template=${encodeURIComponent(template.id || template.title)}`;
    const thumbnailCategories = ['thumbnail', 'youtube thumbnail'];
    const isThumbnail = thumbnailCategories.some(thumbCat => category.includes(thumbCat));
    if (isThumbnail) return `/editor/thumbnail?template=${encodeURIComponent(template.id || template.title)}`;

    const route = `/editor/video?template=${encodeURIComponent(template.id || template.title)}`;
    console.log('[ROUTE DEBUG][Studio] Default video route:', route);
    return route;
  };


  // Helper function to open template in editor
const openTemplateInEditor = (tpl: any) => {
    if (onTemplateEdit) {
      onTemplateEdit(tpl);
    }
  };

  if (!visible) return null;
  if (selectedSubTab === "Templates") {
    // --- Group templates by category ---
    const groupedTemplates: { [category: string]: any[] } = {};
    templates.forEach((tpl: any) => {
      const cat = tpl.category || 'Uncategorized';
      if (!groupedTemplates[cat]) groupedTemplates[cat] = [];
      groupedTemplates[cat].push(tpl);
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        />
        <div
          className="relative z-10 flex flex-col rounded-2xl shadow-2xl mx-4 bg-[#191a21]/90 p-8"
          style={{
            width: '95vw',
            minWidth: '1200px',
            maxWidth: '1900px',
            maxHeight: '95vh',
            border: '1.5px solid #292a34'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="text-yellow-300">🖼️</span>
              <span>All Templates</span>
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                {templates.length} Total Templates
              </span>
              <span className="text-lg bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                {Object.keys(groupedTemplates).length} Categories
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ModernTemplateGrid
              templates={templates.map(template => ({
                id: template.id || `${template.title}-${template.category}`,
                title: template.title,
                category: template.category || 'Uncategorized',
                desc: template.desc || template.description,
                preview: template.preview,
                videoSource: template.videoSource,
                icon: template.icon,
                platform: template.platform,
                quality: template.quality,
                tags: template.tags || [],
                isPremium: template.isPremium || false,
                isNew: template.isNew || Math.random() > 0.7,
                isTrending: template.isTrending || Math.random() > 0.8,
                likes: template.likes || Math.floor(Math.random() * 1000),
                views: template.views || Math.floor(Math.random() * 10000),
                duration: template.duration || '0:30',
                aspectRatio: template.aspectRatio || (template.category?.toLowerCase().includes('short') ? '9:16' : '16:9'),
                creator: template.creator || { name: 'ViewsBoost', avatar: '/images/viewsboost-logo.png' }
              }))}
              onTemplateSelect={(template) => {
                const originalTemplate = templates.find(t => t.id === template.id || t.title === template.title);
                if (originalTemplate) {
                  openTemplateInEditor(originalTemplate);
                }
              }}
              onTemplatePreview={(template) => {
                const originalTemplate = templates.find(t => t.id === template.id || t.title === template.title);
                if (originalTemplate) {
                  onPreview(originalTemplate);
                }
              }}
              loading={loading}
              category={undefined} // Show all categories
              viewMode="grid"
              showFilters={true}
            />
          </div>

          <button
            className="absolute top-6 right-6 p-3 rounded-full bg-black/50 text-gray-200 hover:bg-black/80 transition z-10"
            onClick={onClose}
          >
            <X size={28} />
          </button>
        </div>
      </div>
    );
  }

      const config = CATEGORY_CONFIG[selectedSubTab] || CATEGORY_CONFIG.Business;
    let templatesList = templates; // Use templates from Firestore instead of hardcoded config
    let selectorBar = null;
    let warning = null;

  if (selectedSubTab === "Social Media") {
    if (selectedSocialSection === "video") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🖥️</span>
            Video Categories
            <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">Desktop & TV</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {VIDEO_SELECTOR_LIST.map((type: string) => (
              <button
                key={type}
                onClick={() => handleCategoryClick(type, setSelectedVideoType)}
                onDoubleClick={() => navigateToCategory(type)}
                className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                  selectedVideoType === type 
                    ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-[0_8px_32px_rgba(255,193,7,0.4)] scale-105 border-2 border-yellow-300" 
                    : "bg-gradient-to-br from-[#2a2b37] to-[#3a3b47] hover:from-[#3a3b47] hover:to-[#4a4b57] border border-gray-600/50 hover:border-yellow-400/50 hover:scale-102"
                }`}
                style={{height: '152px'}}
                title="Click to see template count • Double-click to view all templates in this category"
              >
                {/* Clean white screen content - no dark frame */}
                <div className="absolute inset-1 rounded-lg bg-white flex items-center justify-center shadow-lg border border-gray-200"
                     style={{height: '95px'}}>
                  {/* Platform logo in screen - 2.4x bigger */}
                  {type.includes("YouTube") && (
                    <img src="/platform-logos/youtube.svg" alt="YouTube" className="w-20 h-20 object-contain" />
                  )}
                  {type.includes("Facebook") && (
                    <img src="/platform-logos/facebook.svg" alt="Facebook" className="w-20 h-20 object-contain" />
                  )}
                  {type.includes("Twitter") && (
                    <img src="/platform-logos/twitter.svg" alt="Twitter" className="w-20 h-20 object-contain" />
                  )}
                  {type.includes("LinkedIn") && (
                    <img src="/platform-logos/linkedin.svg" alt="LinkedIn" className="w-20 h-20 object-contain" />
                  )}
                  {type.includes("ViewsBoost") && (
                    <img src="/images/viewsboost-logo.png" alt="ViewsBoost" className="w-20 h-20 object-contain" />
                  )}

                </div>
                
                {/* Category label with background */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 rounded-b-2xl py-3 px-2">
                  <div className={`text-2xl font-bold text-center transition-colors ${
                    selectedVideoType === type ? "text-yellow-400" : "text-yellow-400"
                  }`}>
                    {type.replace(" Video", "").replace("Video ", "")}
                  </div>
                  {showTemplateCounts[type] !== undefined && (
                    <div className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1 mx-auto w-fit">
                      {showTemplateCounts[type]} templates
                    </div>
                  )}
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/10 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </button>
            ))}
          </div>
        </div>
      );
      // Use Firestore templates for the selected video type
      templatesList = templates;
    }
    else if (selectedSocialSection === "shorts") {
      // Platform selector config (for Shorts only)
      const PLATFORM_LOGOS: { [key: string]: string | null } = {
        "Facebook Reel": "/platform-logos/facebook.svg",
        "Instagram Reel": "/platform-logos/instagram.svg",
        "Snapchat Shorts": "/platform-logos/snapchat.svg",
        "TikTok Shorts": "/platform-logos/tiktok.svg",
        "Pinterest Video Pin": "/platform-logos/pinterest.svg",
        "Linked Short": "/platform-logos/linkedin.svg",
        "LinkedIn Video": "/platform-logos/linkedin.svg",
        "ViewsBoost Shorts": "/images/viewsboost-logo.png",
        "YouTube Shorts": "/platform-logos/youtube.svg",
      };
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📱</span>
            Shorts Categories
            <span className="text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full">Mobile & Vertical</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {SHORTS_SELECTOR_LIST.map((type: string) => (
              <button
                key={type}
                onClick={() => handleCategoryClick(type, setSelectedShortsType)}
                onDoubleClick={() => navigateToCategory(type)}
                className="group relative p-8 transition-all duration-300 hover:scale-105"
                title="Click to see template count • Double-click to view all templates in this category"
              >
                {/* Phone mockup - 3x bigger */}
                <div className="relative w-72 mx-auto" style={{height: '576px'}}>
                  {/* Phone frame */}
                  <div className="absolute inset-0 rounded-[60px] bg-gradient-to-b from-gray-300 to-gray-400 shadow-lg border-6 border-gray-200">
                    {/* Screen area */}
                    <div className="absolute inset-[9px] rounded-[51px] overflow-hidden"
                         style={{
                           background: `linear-gradient(to bottom, #ffffff 85%, #262a28 15%)`
                         }}>
                      
                      {/* Top notch area */}
                      <div className="w-24 h-3 mx-auto mt-3 rounded-full bg-black/20" />
                      
                      {/* Platform logo in screen - 3x bigger */}
                      <div className="flex-1 flex items-center justify-center px-6 py-12">
                        {PLATFORM_LOGOS[type] && (
                          <img
                            src={PLATFORM_LOGOS[type] as string}
                            alt={type}
                            className="w-24 h-24 object-contain"
                            style={{ 
                              filter: 'none',
                              opacity: 0.8
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Bottom home indicator */}
                      <div className="w-18 h-1.5 mx-auto mb-3 rounded-full bg-black/30" />
                    </div>
                    
                    {/* Black area with category name */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/90 rounded-b-[51px] flex flex-col items-center justify-center">
                      <div className={`text-lg font-bold text-center transition-colors ${
                        selectedShortsType === type ? "text-yellow-400" : "text-blue-400"
                      }`}>
                        {type}
                      </div>
                      {showTemplateCounts[type] !== undefined && (
                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1">
                          {showTemplateCounts[type]} templates
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Selected state glow */}
                  {selectedShortsType === type && (
                    <div className="absolute -inset-6 rounded-[72px] bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-red-500/30 animate-pulse -z-10" />
                  )}
                </div>
              </button>
            ))}
            </div>
          </div>
        </div>
      );
      // Filter templates for exact category match (case and whitespace insensitive)
      let realTemplates = templates.filter(
        tpl => normalizeCategory(tpl.category) === normalizeCategory(selectedShortsType)
      );
      // Find possible near-matches for warning
      const allCategories = Array.from(new Set(templates.map(tpl => tpl.category)));
      const nearMatches = allCategories.filter(cat =>
        normalizeCategory(cat).includes(normalizeCategory(selectedShortsType)) ||
        normalizeCategory(selectedShortsType).includes(normalizeCategory(cat))
      );
      if (realTemplates.length === 0 && nearMatches.length > 0) {
        warning = `Warning: No templates found for category '${selectedShortsType}', but found similar categories: ${nearMatches.join(', ')}. Check for typos or mismatches in your import file.`;
      }
      templatesList = realTemplates;
    }
    else if (selectedSocialSection === "photo") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📸</span>
            Photo Categories
            <span className="text-sm bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full">Image & Graphics</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {PHOTO_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedPhotoType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedPhotoType === type 
                      ? "bg-gradient-to-r from-green-400 to-blue-500 text-white scale-105 border-2 border-green-300 shadow-[0_8px_32px_rgba(34,197,94,0.4)]" 
                      : "bg-[#232436] text-green-300 hover:bg-gradient-to-r hover:from-green-400 hover:to-blue-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected photo type
      templatesList = templates;
    }
    else if (selectedSocialSection === "post") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">��</span>
            Post Categories
            <span className="text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-3 py-1 rounded-full">Content & Messaging</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {POST_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedPostType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedPostType === type 
                      ? "bg-gradient-to-r from-purple-400 to-indigo-500 text-white scale-105 border-2 border-purple-300 shadow-[0_8px_32px_rgba(147,51,234,0.4)]" 
                      : "bg-[#232436] text-purple-300 hover:bg-gradient-to-r hover:from-purple-400 hover:to-indigo-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected post type
      templatesList = templates;
    }
    else if (selectedSocialSection === "carousel") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🎠</span>
            Carousel Categories
            <span className="text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full">Multi-slide Content</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {CAROUSEL_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedCarouselType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedCarouselType === type 
                      ? "bg-gradient-to-r from-orange-400 to-red-500 text-white scale-105 border-2 border-orange-300 shadow-[0_8px_32px_rgba(251,146,60,0.4)]" 
                      : "bg-[#232436] text-orange-300 hover:bg-gradient-to-r hover:from-orange-400 hover:to-red-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected carousel type
      templatesList = templates;
    }
    else if (selectedSocialSection === "thumbnail") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🖼️</span>
            Thumbnail Categories
            <span className="text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-full">Video Preview Images</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {THUMBNAIL_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedThumbnailType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedThumbnailType === type 
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white scale-105 border-2 border-cyan-300 shadow-[0_8px_32px_rgba(34,211,238,0.4)]" 
                      : "bg-[#232436] text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-blue-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected thumbnail type
      templatesList = templates;
    }
    else if (selectedSocialSection === "cover") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            Cover & Banner Categories
            <span className="text-sm bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full">Header & Profile Images</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {COVER_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedCoverType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedCoverType === type 
                      ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white scale-105 border-2 border-rose-300 shadow-[0_8px_32px_rgba(244,63,94,0.4)]" 
                      : "bg-[#232436] text-rose-300 hover:bg-gradient-to-r hover:from-rose-400 hover:to-pink-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected cover type
      templatesList = templates;
    }
    else if (selectedSocialSection === "profile") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">👤</span>
            Profile Categories
            <span className="text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full">Personal & Brand Identity</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {PROFILE_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedProfileType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedProfileType === type 
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white scale-105 border-2 border-emerald-300 shadow-[0_8px_32px_rgba(16,185,129,0.4)]" 
                      : "bg-[#232436] text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-400 hover:to-teal-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected profile type
      templatesList = templates;
    }
    else if (selectedSocialSection === "story") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📖</span>
            Story Categories
            <span className="text-sm bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 py-1 rounded-full">Story Content</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {STORY_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedStoryType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedStoryType === type 
                      ? "bg-gradient-to-r from-violet-400 to-purple-500 text-white scale-105 border-2 border-violet-300 shadow-[0_8px_32px_rgba(139,69,233,0.4)]" 
                      : "bg-[#232436] text-violet-300 hover:bg-gradient-to-r hover:from-violet-400 hover:to-purple-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected story type
      templatesList = templates;
    }
    else if (selectedSocialSection === "live") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🔴</span>
            Live Categories
            <span className="text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full">Live Streaming</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {LIVE_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedLiveType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedLiveType === type 
                      ? "bg-gradient-to-r from-red-400 to-pink-500 text-white scale-105 border-2 border-red-300 shadow-[0_8px_32px_rgba(239,68,68,0.4)]" 
                      : "bg-[#232436] text-red-300 hover:bg-gradient-to-r hover:from-red-400 hover:to-pink-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected live type
      templatesList = templates;
    }
    else if (selectedSocialSection === "ads") {
      selectorBar = (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">📢</span>
            Ads Categories
            <span className="text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full">Advertising & Marketing</span>
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-8 min-w-max">
              {ADS_SELECTOR_LIST.map((type: string) => (
                <button
                  key={type}
                  onClick={() => handleCategoryClick(type, setSelectedAdsType)}
                  onDoubleClick={() => navigateToCategory(type)}
                  className={`group relative p-8 transition-all duration-300 hover:scale-105 whitespace-nowrap flex-shrink-0 px-6 py-3 rounded-xl font-semibold ${
                    selectedAdsType === type 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white scale-105 border-2 border-amber-300 shadow-[0_8px_32px_rgba(245,158,11,0.4)]" 
                      : "bg-[#232436] text-amber-300 hover:bg-gradient-to-r hover:from-amber-400 hover:to-orange-500 hover:text-white border border-gray-600/50"
                  }`}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{type}</span>
                    {showTemplateCounts[type] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[type]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
      // Use Firestore templates for the selected ads type
      templatesList = templates;
    }
    else {
      // For all other social media sections
      // Use templates fetched from Firestore
      let realTemplates = templates.filter(
        tpl => normalizeCategory(tpl.category) === normalizeCategory(selectedSocialSection)
      );
      
      // Find possible near-matches for warning
      const allCategories = Array.from(new Set(templates.map(tpl => tpl.category)));
      const nearMatches = allCategories.filter(cat =>
        normalizeCategory(cat).includes(normalizeCategory(selectedSocialSection)) ||
        normalizeCategory(selectedSocialSection).includes(normalizeCategory(cat))
      );
      
      if (realTemplates.length === 0 && nearMatches.length > 0) {
        warning = `Warning: No templates found for category '${selectedSocialSection}', but found similar categories: ${nearMatches.join(', ')}. Check for typos or mismatches in your import file.`;
      }
      
      templatesList = realTemplates;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex flex-row rounded-2xl shadow-2xl mx-4 bg-[#191a21]/90"
        style={{
          width: '90vw',
          height: '80vh',
          minWidth: '1200px',
          minHeight: '900px',
          maxWidth: '1800px',
          maxHeight: '1100px',
          border: '1.5px solid #292a34'
        }}
      >
        <div className="flex flex-col w-80 p-14 border-r border-[#232436] bg-[#18191c]/90">
          <h2 className="text-4xl font-extrabold mb-10 text-white flex items-center gap-2">
            <span className={config.accent}>{config.emoji}</span>
            <span>{selectedSubTab}</span>
          </h2>
          {subTabs.map((subtab: string) => (
            <button
              key={subtab}
              className={`mb-5 text-2xl px-7 py-4 rounded-xl text-left font-semibold transition ${selectedSubTab === subtab ? "bg-gradient-to-r from-yellow-400 to-red-500 text-black" : "bg-[#232436] text-yellow-300"} hover:bg-gradient-to-r hover:from-yellow-400 hover:to-red-500 hover:text-black hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
              style={{
                boxShadow: selectedSubTab === subtab ? '0 6px 32px 0 rgba(255,193,7,0.12)' : undefined,
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => onSelectSubTab(subtab)}
            >
              {subtab}
              <span
                className={`absolute left-0 bottom-0 w-full h-0.5 bg-yellow-400 transition-all duration-200 ${selectedSubTab === subtab ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col p-14 overflow-y-auto">
          {selectedSubTab === "Business" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {BUSINESS_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedBusinessSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedBusinessSection === section.key ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105" : "bg-[#232436] text-blue-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white"}`}
                  style={{
                    border: selectedBusinessSection === section.key ? "2px solid #2563eb" : "2px solid transparent",
                    boxShadow: selectedBusinessSection === section.key ? "0 2px 14px 0 #2563eb40" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Marketing" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {MARKETING_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedMarketingSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedMarketingSection === section.key ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105" : "bg-[#232436] text-pink-300 hover:bg-gradient-to-r hover:from-pink-600 hover:to-rose-600 hover:text-white"}`}
                  style={{
                    border: selectedMarketingSection === section.key ? "2px solid #db2777" : "2px solid transparent",
                    boxShadow: selectedMarketingSection === section.key ? "0 2px 14px 0 #db277740" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Web Design" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {WEB_DESIGN_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedWebDesignSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedWebDesignSection === section.key ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105" : "bg-[#232436] text-green-300 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 hover:text-white"}`}
                  style={{
                    border: selectedWebDesignSection === section.key ? "2px solid #059669" : "2px solid transparent",
                    boxShadow: selectedWebDesignSection === section.key ? "0 2px 14px 0 #05966940" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Documents" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {DOCUMENTS_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedDocumentsSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedDocumentsSection === section.key ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-105" : "bg-[#232436] text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white"}`}
                  style={{
                    border: selectedDocumentsSection === section.key ? "2px solid #9333ea" : "2px solid transparent",
                    boxShadow: selectedDocumentsSection === section.key ? "0 2px 14px 0 #9333ea40" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Education" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {EDUCATION_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedEducationSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedEducationSection === section.key ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg scale-105" : "bg-[#232436] text-amber-300 hover:bg-gradient-to-r hover:from-amber-600 hover:to-yellow-600 hover:text-white"}`}
                  style={{
                    border: selectedEducationSection === section.key ? "2px solid #d97706" : "2px solid transparent",
                    boxShadow: selectedEducationSection === section.key ? "0 2px 14px 0 #d9770640" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Events" && (
            <div className="flex gap-4 mb-8 flex-wrap">
              {EVENTS_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => handleCategoryClick(section.key, setSelectedEventsSection)}
                  onDoubleClick={() => navigateToCategory(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedEventsSection === section.key ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg scale-105" : "bg-[#232436] text-red-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-pink-600 hover:text-white"}`}
                  style={{
                    border: selectedEventsSection === section.key ? "2px solid #dc2626" : "2px solid transparent",
                    boxShadow: selectedEventsSection === section.key ? "0 2px 14px 0 #dc262640" : undefined
                  }}
                  title="Click to see template count • Double-click to view all templates in this category"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{section.label}</span>
                    {showTemplateCounts[section.key] !== undefined && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {showTemplateCounts[section.key]} templates
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedSubTab === "Social Media" && (
            <div className="flex gap-4 mb-8">
              {SOCIAL_MEDIA_SECTIONS.map((section: any) => (
                <button
                  key={section.key}
                  onClick={() => setSelectedSocialSection(section.key)}
                  className={`px-6 py-3 rounded-full font-bold text-lg transition ${selectedSocialSection === section.key ? "bg-gradient-to-r from-fuchsia-600 to-blue-600 text-white shadow-lg scale-105" : "bg-[#232436] text-fuchsia-300 hover:bg-gradient-to-r hover:from-fuchsia-600 hover:to-blue-600 hover:text-white"}`}
                  style={{
                    border: selectedSocialSection === section.key ? "2px solid #a21caf" : "2px solid transparent",
                    boxShadow: selectedSocialSection === section.key ? "0 2px 14px 0 #a21caf40" : undefined
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}
          {selectorBar}
          
          {/* Business Templates Display */}
          {selectedSubTab === "Business" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "📄"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Business template"}
                    border="border-blue-400/30"
                    shadow="shadow-blue-300/10"
                    accent="text-blue-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedBusinessSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedBusinessSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Marketing Templates Display */}
          {selectedSubTab === "Marketing" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "📈"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Marketing template"}
                    border="border-pink-400/30"
                    shadow="shadow-pink-300/10"
                    accent="text-pink-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedMarketingSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedMarketingSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Web Design Templates Display */}
          {selectedSubTab === "Web Design" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "🖥️"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Web design template"}
                    border="border-green-400/30"
                    shadow="shadow-green-300/10"
                    accent="text-green-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🖥️</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedWebDesignSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedWebDesignSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Documents Templates Display */}
          {selectedSubTab === "Documents" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "📄"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Document template"}
                    border="border-purple-400/30"
                    shadow="shadow-purple-300/10"
                    accent="text-purple-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedDocumentsSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedDocumentsSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Education Templates Display */}
          {selectedSubTab === "Education" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "🎓"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Education template"}
                    border="border-amber-400/30"
                    shadow="shadow-amber-300/10"
                    accent="text-amber-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🎓</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedEducationSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedEducationSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Events Templates Display */}
          {selectedSubTab === "Events" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "🎉"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Event template"}
                    border="border-red-400/30"
                    shadow="shadow-red-300/10"
                    accent="text-red-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No {selectedEventsSection.replace('-', ' ')} templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Templates for "{selectedEventsSection.replace('-', ' ')}" are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Personal Templates Display */}
          {selectedSubTab === "Personal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.length > 0 ? (
                templates.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.id || tpl.title + idx}
                    icon={tpl.icon || "👤"}
                    title={tpl.title}
                    desc={tpl.desc || tpl.description || "Personal template"}
                    border="border-teal-400/30"
                    shadow="shadow-teal-300/10"
                    accent="text-teal-300"
                    preview={tpl.preview}
                    onClick={() => openTemplateInEditor(tpl)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    No personal templates found
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Personal templates are being loaded. 
                    Check back soon or try importing templates from the Admin Panel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="absolute top-7 right-7 p-3 rounded-full bg-black/50 text-gray-200 hover:bg-black/80 transition"
          onClick={onClose}
        >
          <X size={36} />
        </button>
      </div>
    </div>
  );
}

// Component for My Uploads tab
function MyUploadsPanel() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target?.result,
          uploadDate: new Date()
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
          dragOver ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload size={48} className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">Upload Your Files</h3>
        <p className="text-gray-400 mb-4">Drag and drop files here or click to browse</p>
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-yellow-400 text-black px-6 py-2 rounded-lg cursor-pointer hover:bg-yellow-500 transition"
        >
          Browse Files
        </label>
      </div>

      {/* Uploaded Files Grid */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-white text-lg font-semibold mb-4">Your Uploads ({uploadedFiles.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer">
              <div className="aspect-square bg-gray-700 rounded mb-2 flex items-center justify-center overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type.startsWith('video/') ? (
                  <Video size={32} className="text-gray-400" />
                ) : (
                  <FileText size={32} className="text-gray-400" />
                )}
              </div>
              <p className="text-white text-sm truncate">{file.name}</p>
              <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ))}
        </div>
        {uploadedFiles.length === 0 && (
          <div className="text-center py-12">
            <Folder size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No uploads yet. Start by uploading some files!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for Video tab
function VideoPanel({ videoList, canvas }: { videoList: any[], canvas?: fabric.Canvas }) {
  const videoCategories = [
    { name: "YouTube Videos", icon: <Video size={20} />, color: "bg-red-500", count: "12 templates" },
    { name: "Instagram Reels", icon: <Camera size={20} />, color: "bg-purple-500", count: "8 templates" },
    { name: "TikTok Videos", icon: <Smartphone size={20} />, color: "bg-black", count: "15 templates" },
    { name: "Short Form Content", icon: <Monitor size={20} />, color: "bg-blue-500", count: "6 templates" },
  ];

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Video Creator Studio</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {videoCategories.map((category) => (
          <div key={category.name} className={`${category.color} rounded-lg p-4 cursor-pointer hover:opacity-80 transition group`}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {category.icon}
                <div>
                  <span className="font-semibold block">{category.name}</span>
                  <span className="text-sm opacity-80">{category.count}</span>
                </div>
              </div>
              <MoreHorizontal size={20} className="opacity-60 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Video List from manifest */}
      {videoList.length > 0 && (
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4">Available Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videoList.map((v) => (
              <button
                key={v.id}
                onClick={() => canvas && addMediaLayer(canvas, { type: 'video', url: v.url, w: 600 })}
                className="group relative w-full aspect-video rounded-md overflow-hidden bg-transparent p-0 border border-white/10"
              >
                {v.thumbnail && (
                  <img
                    src={v.thumbnail}
                    alt={v.title || v.id}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play size={24} className="text-white" />
                </div>
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                  {v.duration || 'Video'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-white font-semibold">Quick Actions</h3>
        <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2">
          <Play size={20} />
          Create New Video
        </button>
        <button className="w-full bg-gray-700 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2">
          <Upload size={20} />
          Upload Video
        </button>
        <button className="w-full bg-gray-700 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2">
          <Eye size={20} />
          Browse Templates
        </button>
      </div>
    </div>
  );
}

// Component for Photos tab
function PhotosPanel() {
  const photoCategories = [
    "Stock Photos", "Your Photos", "Instagram Posts", "Facebook Posts", 
    "Pinterest Pins", "Backgrounds", "Textures", "Icons"
  ];

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Photo Library</h2>
      
      <div className="mb-6">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-yellow-400 outline-none"
          />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-white font-semibold">Categories</h3>
        {photoCategories.map((category) => (
          <button
            key={category}
            className="w-full text-left p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-3"
          >
            <Image size={16} className="text-yellow-400" />
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition cursor-pointer">
            <Image size={24} className="text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for Music tab
function MusicPanel() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  
  const musicTracks = [
    { name: "Upbeat Corporate", duration: "2:30", genre: "Corporate", mood: "Energetic" },
    { name: "Chill Vibes", duration: "3:15", genre: "Ambient", mood: "Relaxed" },
    { name: "Epic Cinematic", duration: "4:00", genre: "Cinematic", mood: "Dramatic" },
    { name: "Happy Pop", duration: "2:45", genre: "Pop", mood: "Uplifting" },
  ];

  const togglePlay = (index: number) => {
    if (currentTrack === index && isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTrack(index);
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Music & Audio</h2>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
            <Music size={16} />
            Music
          </button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2">
            <Mic size={16} />
            Sound Effects
          </button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2">
            <Volume2 size={16} />
            Voice Over
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-semibold">Featured Tracks</h3>
        {musicTracks.map((track, index) => (
          <div key={index} className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-semibold">{track.name}</p>
                <p className="text-gray-400 text-sm">{track.genre} • {track.duration} • {track.mood}</p>
              </div>
              <button 
                onClick={() => togglePlay(index)}
                className={`p-2 rounded-full transition ${
                  currentTrack === index && isPlaying 
                    ? 'bg-yellow-400 text-black' 
                    : 'bg-yellow-400 text-black hover:bg-yellow-500'
                }`}
              >
                {currentTrack === index && isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for Elements tab
function ElementsPanel() {
  const elementCategories = [
    { name: "Shapes", icon: <Shapes size={20} />, items: ["Circle", "Rectangle", "Triangle", "Star", "Arrow", "Heart"] },
    { name: "Icons", icon: <Star size={20} />, items: ["Social Media", "Business", "Technology", "Nature", "Food", "Travel"] },
    { name: "Lines", icon: <PenTool size={20} />, items: ["Straight", "Curved", "Decorative", "Arrows", "Dividers", "Borders"] },
    { name: "Frames", icon: <Grid size={20} />, items: ["Photo Frames", "Borders", "Decorative", "Vintage", "Modern", "Minimal"] },
  ];

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Design Elements</h2>
      
      <div className="space-y-4">
        {elementCategories.map((category) => (
          <div key={category.name} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-yellow-400">{category.icon}</div>
              <h3 className="text-white font-semibold">{category.name}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {category.items.map((item) => (
                <button
                  key={item}
                  className="bg-gray-700 text-white p-2 rounded text-sm hover:bg-gray-600 transition hover:text-yellow-400"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for Tools tab
function ToolsPanel() {
  const tools = [
    { name: "Crop", icon: <Crop size={20} />, description: "Crop and resize images", category: "Image" },
    { name: "Rotate", icon: <RotateCw size={20} />, description: "Rotate elements", category: "Transform" },
    { name: "Filter", icon: <Filter size={20} />, description: "Apply image filters", category: "Image" },
    { name: "Effects", icon: <Zap size={20} />, description: "Add special effects", category: "Effects" },
    { name: "Background Remover", icon: <Layers size={20} />, description: "Remove backgrounds automatically", category: "AI" },
    { name: "Color Picker", icon: <Palette size={20} />, description: "Pick colors from images", category: "Color" },
    { name: "Resize", icon: <Monitor size={20} />, description: "Resize for different platforms", category: "Transform" },
    { name: "Blur", icon: <Eye size={20} />, description: "Apply blur effects", category: "Effects" },
  ];

  const categories = ["All", "Image", "Transform", "Effects", "AI", "Color"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTools = selectedCategory === "All" 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Design Tools</h2>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredTools.map((tool) => (
          <button
            key={tool.name}
            className="w-full bg-gray-800 p-4 rounded-lg text-left hover:bg-gray-700 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 group-hover:text-yellow-300">
                {tool.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{tool.name}</h3>
                <p className="text-gray-400 text-sm">{tool.description}</p>
              </div>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                {tool.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Component for Text Tools (legacy mini editor) – disabled placeholder to avoid mini-canvas bug
function TextToolsPanel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTextObject, setSelectedTextObject] = useState<fabric.IText | null>(null);

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      });

      // Handle text selection
      fabricCanvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0] instanceof fabric.IText) {
          setSelectedTextObject(e.selected[0] as fabric.IText);
        }
      });

      fabricCanvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0] instanceof fabric.IText) {
          setSelectedTextObject(e.selected[0] as fabric.IText);
        }
      });

      fabricCanvas.on('selection:cleared', () => {
        setSelectedTextObject(null);
      });

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  // Template loading is handled by the main editor; no loader here

  // Add text function (like CanvaEditorFixed)
  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: '#000000',
      selectable: true,
      editable: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  // Apply text style function
  const applyTextStyle = (property: keyof fabric.IText, value: any) => {
    if (!selectedTextObject || !canvas) return;
    
    selectedTextObject.set(property, value as any);
    canvas.renderAll();
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Text Controls */}
      <div className="w-80 bg-gray-900 p-6 border-r border-gray-700 overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-6">Text Tools</h2>
        
        {/* Add Text Button */}
        <button
          onClick={addText}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 mb-6"
        >
          <Type size={20} />
          Add Text
        </button>

        {/* Text Presets */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-3">Text Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => addText()}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
            >
              Heading
            </button>
            <button 
              onClick={() => addText()}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
            >
              Subheading
            </button>
            <button 
              onClick={() => addText()}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
            >
              Body Text
            </button>
            <button 
              onClick={() => addText()}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition"
            >
              Caption
            </button>
          </div>
        </div>

        {/* Text Formatting (when text is selected) */}
        {selectedTextObject && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            <h4 className="text-white font-semibold">Text Formatting</h4>
            
            {/* Font Size */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Font Size</label>
              <input
                type="range"
                min="8"
                max="200"
                value={selectedTextObject.fontSize || 24}
                onChange={(e) => applyTextStyle('fontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-sm">{selectedTextObject.fontSize || 24}px</span>
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Text Color</label>
              <input
                type="color"
                value={selectedTextObject.fill as string || '#000000'}
                onChange={(e) => applyTextStyle('fill', e.target.value)}
                className="w-full h-10 rounded"
              />
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Alignment</label>
              <div className="flex gap-2">
                <button
                  onClick={() => applyTextStyle('textAlign', 'left')}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => applyTextStyle('textAlign', 'center')}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => applyTextStyle('textAlign', 'right')}
                  className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Canvas */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}

// Component for Styles tab
function StylesPanel() {
  const styleCategories = [
    { name: "Modern", color: "bg-gradient-to-r from-blue-500 to-purple-500", count: "24 styles" },
    { name: "Vintage", color: "bg-gradient-to-r from-yellow-600 to-red-600", count: "18 styles" },
    { name: "Minimalist", color: "bg-gradient-to-r from-gray-400 to-gray-600", count: "31 styles" },
    { name: "Bold", color: "bg-gradient-to-r from-red-500 to-pink-500", count: "15 styles" },
    { name: "Elegant", color: "bg-gradient-to-r from-purple-500 to-indigo-500", count: "22 styles" },
    { name: "Playful", color: "bg-gradient-to-r from-green-400 to-blue-400", count: "27 styles" },
  ];

  const colorPalettes = [
    { name: "Sunset", colors: ['#FF6B6B', '#FF8E53', '#FF6B9D', '#C44569'] },
    { name: "Ocean", colors: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] },
    { name: "Forest", colors: ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'] },
    { name: "Monochrome", colors: ['#2D3436', '#636E72', '#B2BEC3', '#DDD'] },
  ];

  return (
    <div className="h-full p-6">
      <h2 className="text-white text-xl font-bold mb-6">Style Presets</h2>
      
      <div className="mb-8">
        <h3 className="text-white font-semibold mb-4">Style Categories</h3>
        <div className="grid grid-cols-2 gap-4">
          {styleCategories.map((style) => (
            <button
              key={style.name}
              className={`${style.color} p-4 rounded-lg text-white font-semibold hover:opacity-90 transition relative overflow-hidden group`}
            >
              <div className="relative z-10">
                <div className="font-bold">{style.name}</div>
                <div className="text-sm opacity-80">{style.count}</div>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-white font-semibold mb-4">Color Palettes</h3>
          <div className="space-y-3">
            {colorPalettes.map((palette) => (
              <div key={palette.name} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{palette.name}</span>
                  <button className="text-yellow-400 hover:text-yellow-300 transition">
                    <Heart size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  {palette.colors.map((color, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition cursor-pointer hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Studio() {
  const [selectedTab, setSelectedTab] = useState(TABS[0].key);
  const [selectedSubTab, setSelectedSubTab] = useState(CREATE_SUBTABS[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showTextPresetsPanel, setShowTextPresetsPanel] = useState(false);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [templateList, setTemplateList] = useState<TemplateMeta[]>([]);
  const [quickStart] = useState([
    { id: 'ig-post', w: 1080, h: 1080, label: 'IG Post', thumb: '/react.svg' },
    { id: 'story', w: 1080, h: 1920, label: 'IG Story', thumb: '/react.svg' },
    { id: 'yt-thumb', w: 1280, h: 720, label: 'YT Thumb', thumb: '/react.svg' },
    { id: 'poster', w: 1080, h: 1350, label: 'Poster', thumb: '/react.svg' },
  ]);
  const [recent, setRecent] = useState<any[]>([]);
  const [photoList, setPhotoList] = useState<any[]>([]);
  const [videoList, setVideoList] = useState<any[]>([]);

  React.useEffect(() => {
    // Do not auto-open the categories modal; keep dashboard grid visible
    setShowCreateModal(false);
    // Show text presets panel when "texte" tab is selected
    setShowTextPresetsPanel(selectedTab === "texte");
  }, [selectedTab]);

  // Load local manifest once
  useEffect(() => {
    fetch('/assets/templates/manifest.json')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: TemplateMeta[]) => setTemplateList(Array.isArray(rows) ? rows : []))
      .catch(() => setTemplateList([]));
  }, []);

  useEffect(() => {
    fetch('/assets/manifest.json').then(r => r.json()).then(setPhotoList).catch(() => setPhotoList([]));
    fetch('/assets/videos/manifest.json').then(r => r.json()).then(setVideoList).catch(() => setVideoList([]));
    // TODO: setRecent from storage if available
  }, []);

  // Handle saving text elements
  const handleSaveTextElements = (elements: TextElement[]) => {
    setTextElements(elements);
    console.log('Text elements saved:', elements);
  };

  // Handle exporting text elements
  const handleExportTextElements = (elements: TextElement[]) => {
    console.log('Exporting text elements:', elements);
    // Here you could implement export functionality (PDF, PNG, etc.)
  };

  // Helpers to open editor with content
  // Waits for the editor's Fabric canvas to be mounted and globally registered
  function withEditorCanvas(action: (canvas: fabric.Canvas) => void, timeoutMs = 3000) {
    const start = Date.now();
    const tryRun = () => {
      const editorCanvas = (window as any).__viewsboost_main_canvas as fabric.Canvas | undefined;
      if (editorCanvas) {
        if (import.meta.env.DEV) {
          console.log('[Studio] Editor canvas ready. Injecting media...');
        }
        action(editorCanvas);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        console.warn('[Studio] Editor canvas not ready in time; aborting quick insert');
        return;
      }
      requestAnimationFrame(tryRun);
    };
    tryRun();
  }

  function newBlank(s: { w: number; h: number }) {
    setSelectedTemplateForEdit({ id: 'blank', name: 'Blank', width: s.w, height: s.h, jsonPath: '', thumbnail: '' } as any);
    setShowEditor(true);
  }
  function openImage(url: string) {
    // Prefer passing a lightweight template so the editor loads it deterministically
    setSelectedTemplateForEdit({
      id: 'image-import',
      title: 'Imported Image',
      width: 1080,
      height: 1080,
      studioEditor: {
        canvasType: 'image',
        dimensions: { width: 1080, height: 1080 },
        layers: [
          { type: 'image', url, w: 800 }
        ]
      }
    } as any);
    setShowEditor(true);
  }
  function openVideo(video: any) {
    const url = typeof video === 'string' ? video : video?.url;
    const mediaW = typeof video?.width === 'number' ? video.width : 1080;
    const mediaH = typeof video?.height === 'number' ? video.height : 1080;
    if (import.meta.env.DEV) {
      console.log('[Studio] Stock video clicked:', url, 'size:', mediaW, 'x', mediaH);
    }
    // Pass as template to the editor so it loads via its own effect
    setSelectedTemplateForEdit({
      id: 'video-import',
      title: 'Imported Video',
      width: mediaW,
      height: mediaH,
      studioEditor: {
        canvasType: 'video',
        dimensions: { width: mediaW, height: mediaH },
        layers: [
          { type: 'video', url, w: Math.min(600, mediaW), autoplay: true, muted: true, loop: true, poster: video?.thumbnail }
        ]
      }
    } as any);
    setShowEditor(true);
  }

  // Function to render content based on selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case "uploads":
        return <MyUploadsPanel />;
      case "video":
        return <VideoPanel videoList={videoList} />;
      case "photos":
        return <PhotosPanel />;
      case "musics":
        return <MusicPanel />;
      case "elements":
        return <ElementsPanel />;
      case "tools":
        return <ToolsPanel />;
      case "styles":
        return <StylesPanel />;
      case "texte":
        return (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-3">✍️</div>
              <div className="text-lg">Text tools are available inside the main editor.</div>
            </div>
          </div>
        );
      case "templates":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Templates</h3>
              <button
                onClick={() => {
                  setSelectedSubTab('Business');
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold hover:opacity-90 transition"
              >
                Browse Category Templates
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {templateList.map((t) => (
                <Card
                  key={t.id}
                  thumb={t.thumbnail || '/default-template.png'}
                  label={`${t.width}x${t.height}`}
                  onClick={() => {
                    setSelectedTemplateForEdit({ id: t.id, name: t.name, jsonPath: t.jsonPath, width: t.width, height: t.height } as any);
                    setShowEditor(true);
                  }}
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-[#17171c] to-[#232438] relative">
      <TopNavBar />
      <CreateModal
        visible={showCreateModal}
        subTabs={CREATE_SUBTABS}
        selectedSubTab={selectedSubTab}
        onSelectSubTab={setSelectedSubTab}
        onPreview={setPreviewTemplate}
        onClose={() => setShowCreateModal(false)}
        onTemplateEdit={(template) => {
          setSelectedTemplateForEdit(template);
          setShowEditor(true);
          setShowCreateModal(false);
        }}
      />
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
      <div className={showCreateModal ? "flex flex-1 min-h-0 pointer-events-none select-none filter blur-sm" : "flex flex-1 min-h-0"}>
        <aside className="bg-[#18191c] h-full w-56 flex flex-col py-6 px-2 shadow-xl z-10">
          <nav className="flex flex-col gap-2">
             {TABS.map((tab: any) => (
               <button
                 key={tab.key}
                 className={`flex items-center gap-3 px-5 py-3 rounded-xl text-base font-bold transition hover:bg-[#232436] ${selectedTab === tab.key ? "bg-gradient-to-r from-yellow-400 to-red-500 text-black shadow-lg" : "text-yellow-400"}`}
                 onClick={() => {
                   setSelectedTab(tab.key);
                   if (tab.key === "create") {
                     setSelectedTemplateForEdit(null);
                     setShowEditor(true);
                     setShowCreateModal(false);
                   }
                 }}
                 tabIndex={showCreateModal ? -1 : 0}
                 disabled={showCreateModal}
               >
                 {tab.icon}
                 {tab.label}
               </button>
             ))}
          </nav>
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
          <div className="w-full px-8 py-3 bg-gradient-to-r from-[#17171c] to-[#232438] border-b border-[#232436] shadow-lg"></div>
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {selectedTab === "create" ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">Studio Dashboard</h3>
                  <button
                    onClick={() => {
                      setSelectedSubTab('Business');
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold hover:opacity-90 transition"
                  >
                    Browse Category Templates
                  </button>
                </div>

                <Row title="Quick start">
                  {quickStart.map((s) => (
                    <Card key={s.id} thumb={s.thumb} label={`${s.w}x${s.h}`} onClick={() => newBlank(s)} />
                  ))}
                </Row>

                {recent.length > 0 && (
                  <Row title="Recent projects">
                    {recent.map((r) => (
                      <Card key={r.id} thumb={r.thumb} label={r.title} onClick={() => setShowEditor(true)} />
                    ))}
                  </Row>
                )}

                <Row title="Templates">
                  {templateList.map((t) => (
                    <Card
                      key={t.id}
                      thumb={t.thumbnail || '/default-template.png'}
                      label={`${t.width}x${t.height}`}
                      onClick={() => {
                        setSelectedTemplateForEdit({ id: t.id, name: t.name, jsonPath: t.jsonPath, width: t.width, height: t.height } as any);
                        setShowEditor(true);
                      }}
                    />
                  ))}
                </Row>

                <Row title="Stock Photos">
                  {photoList.map((p) => (
                    <Card key={p.id} thumb={p.url} onClick={() => openImage(p.url)} />
                  ))}
                </Row>

                <Row title="Stock Videos">
                  {videoList.map((v) => (
                    <Card key={v.id} thumb={v.thumbnail || v.url} onClick={() => openVideo(v)} />
                  ))}
                </Row>
              </div>
            ) : renderTabContent() ? (
              renderTabContent()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {TABS.find(tab => tab.key === selectedTab)?.label} Studio
                </h2>
                <p className="text-gray-400 max-w-md">
                  Welcome to your creative workspace. Start building amazing designs!
                </p>
              </div>
            )}
          </div>
        </main>
        {/* Canva Editor Modal with integrated timeline */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
          <div className="flex-1 min-h-0">
            <ViewsBoostCanvaEditor
               template={selectedTemplateForEdit ?? undefined}
              onClose={() => setShowEditor(false)}
              onSave={(canvasData) => {
                console.log('Saving template:', canvasData);
              }}
            />
          </div>
          <div className="h-[420px] border-t border-gray-800 bg-[#0f1115]">
            <ProfessionalTimeline className="h-full" />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}


