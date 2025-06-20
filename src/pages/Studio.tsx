  import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Upload, Video, Image, Music,
  LayoutTemplate, Shapes, Wrench, Type, Brush,
  Folder, ImagePlus, FileText, Globe2, Users, Sparkles, Download, Share, Search as SearchIcon, X
} from "lucide-react";
import { useTemplates } from "../lib/useTemplates";
// @ts-ignore
import TemplatePreviewModal from "../components/TemplatePreviewModal";

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

  // --- Video templates as objects (multiple templates for each type) ---
  const SOCIAL_MEDIA_VIDEO_TEMPLATES: { [key: string]: any[] } = {
    "YouTube Video": [
      {
        icon: logoIcon("youtube", "YouTube"),
        title: "Vlog Style",
        desc: "Classic vlog with intro/outro, subscribe CTA.",
        preview: "/templates/vlog-style.webp"
      },
      { icon: logoIcon("youtube", "YouTube"), title: "Gaming Stream", desc: "Stream overlay, facecam, chat highlight." },
      { icon: logoIcon("youtube", "YouTube"), title: "How-to/Educational", desc: "Step-by-step, split screen, captions." },
      { icon: logoIcon("youtube", "YouTube"), title: "Podcast/Interview", desc: "Side-by-side guest layout, waveform." },
      { icon: logoIcon("youtube", "YouTube"), title: "Trending Content", desc: "Engaging thumbnails, dynamic overlays." },
      { icon: logoIcon("youtube", "YouTube"), title: "Review/Unboxing", desc: "Product showcase, comparison layouts." }
    ],
    "Facebook Video": [
      { icon: logoIcon("facebook", "Facebook"), title: "Square Feed Video", desc: "1:1 ratio for Facebook feed posts." },
      { icon: logoIcon("facebook", "Facebook"), title: "Vertical Story Video", desc: "9:16 ratio for Facebook stories/reels." },
      { icon: logoIcon("facebook", "Facebook"), title: "Landscape Video", desc: "16:9 ratio for regular Facebook videos." },
      { icon: logoIcon("facebook", "Facebook"), title: "Live Stream", desc: "Facebook Live overlay templates." },
      { icon: logoIcon("facebook", "Facebook"), title: "Event Promo", desc: "Facebook event video templates." },
      { icon: logoIcon("facebook", "Facebook"), title: "Business Ad", desc: "Professional Facebook video ads." }
    ],
    "Video Landscape": [
      { icon: "🌄", title: "Cinematic 16:9", desc: "Widescreen cinematic overlays." },
      { icon: "🖥️", title: "Desktop Presentation", desc: "Professional presentation layout." },
      { icon: "📺", title: "TV Format", desc: "Traditional TV broadcast style." },
      { icon: "🎬", title: "Movie Style", desc: "Film-style title cards and overlays." }
    ],
    "Video Ads": [
      { icon: "📢", title: "Product Showcase", desc: "E-commerce product video ads." },
      { icon: "🎯", title: "Brand Awareness", desc: "Brand-focused advertising templates." },
      { icon: "💼", title: "Service Promotion", desc: "Service-based business ads." },
      { icon: "🛍️", title: "Shopping Ad", desc: "Retail and shopping video ads." }
    ],
    "Twitter Video": [
      { icon: logoIcon("twitter", "Twitter"), title: "Tweet Reply", desc: "Video response to tweets." },
      { icon: logoIcon("twitter", "Twitter"), title: "News Update", desc: "Breaking news video format." },
      { icon: logoIcon("twitter", "Twitter"), title: "Thread Video", desc: "Video for Twitter threads." }
    ],
    "ViewsBoost Video": [
      { icon: logoIcon("viewsboost", "ViewsBoost"), title: "Branded Template", desc: "Official ViewsBoost styling." },
      { icon: logoIcon("viewsboost", "ViewsBoost"), title: "Platform Demo", desc: "ViewsBoost feature showcase." }
    ],
    "Intro/Outro": [
      { icon: "🎭", title: "Animated Logo Intro", desc: "Logo reveal with motion graphics." },
      { icon: "🎪", title: "Channel Intro", desc: "Channel branding introduction." },
      { icon: "👋", title: "Subscribe Outro", desc: "Call-to-action ending template." },
      { icon: "🔔", title: "Bell Notification", desc: "Subscribe bell animation outro." }
    ],
    "Square Video": [
      { icon: "⬜", title: "1:1 Instagram Feed", desc: "Perfect square for Instagram posts." },
      { icon: "📱", title: "Mobile Square", desc: "Mobile-optimized square videos." },
      { icon: "🎨", title: "Creative Square", desc: "Artistic square video layouts." }
    ],
    "Vertical Video": [
      { icon: "📱", title: "9:16 Stories", desc: "Perfect for Instagram/Facebook stories." },
      { icon: "🎵", title: "TikTok Style", desc: "Vertical video for TikTok format." },
      { icon: "📲", title: "Mobile First", desc: "Mobile-optimized vertical videos." }
    ],
    "Podcast": [
      { icon: "🎙️", title: "Audio Waveform", desc: "Animated waveform visualization." },
      { icon: "🎧", title: "Interview Setup", desc: "Two-person podcast layout." },
      { icon: "🗣️", title: "Solo Podcast", desc: "Single speaker podcast template." },
      { icon: "📻", title: "Radio Style", desc: "Classic radio show format." }
    ],
    "Multi-screen": [
      { icon: "🖥️", title: "Split Screen", desc: "Two-video side-by-side layout." },
      { icon: "📺", title: "Picture-in-Picture", desc: "PIP overlay configurations." },
      { icon: "🗂️", title: "Grid Layout", desc: "Multiple video grid arrangements." },
      { icon: "🔄", title: "Dynamic Multi", desc: "Switching multi-screen layouts." }
    ],
    "HD Video": [
      { icon: "🌌", title: "4K Ultra HD", desc: "Ultra-high definition templates." },
      { icon: "✨", title: "HD Professional", desc: "Professional HD video layouts." },
      { icon: "🎬", title: "Cinema Quality", desc: "Film-quality HD templates." }
    ],
    "LinkedIn Videos": [
      { icon: logoIcon("linkedin", "LinkedIn"), title: "Professional Update", desc: "Business-focused video posts." },
      { icon: logoIcon("linkedin", "LinkedIn"), title: "Company News", desc: "Corporate announcement videos." },
      { icon: logoIcon("linkedin", "LinkedIn"), title: "Industry Insights", desc: "Thought leadership content." },
      { icon: logoIcon("linkedin", "LinkedIn"), title: "Career Tips", desc: "Professional development videos." }
    ]
  };

  // Updated Video Selector Categories
  const VIDEO_SELECTOR_LIST = [
    "YouTube Video",
    "Facebook Video", 
    "Video Landscape",
    "Video Ads",
    "Twitter Video",
    "ViewsBoost Video",
    "Intro/Outro",
    "Square Video",
    "Vertical Video",
    "Podcast",
    "Multi-screen",
    "HD Video",
    "LinkedIn Videos"
  ];

  const CATEGORY_CONFIG: {
    [key: string]: {
      emoji: string;
      border: string;
      shadow: string;
      accent: string;
      templates: { icon: string; title: string; desc: string }[];
    };
  } = {
    Business: {
      emoji: "\uD83D\uDCBC",
      border: "border-blue-400/20",
      shadow: "shadow-yellow-400/10",
      accent: "text-yellow-300",
      templates: [
        { icon: "\uD83D\uDCC8", title: "Presentation", desc: "Business Pitch, Investor Deck" },
        { icon: "\uD83D\uDCB3", title: "Business Cards", desc: "Gen Z style card layouts" },
        { icon: "\uD83D\uDCC4", title: "Resumes / CV", desc: "Creative resume/CV templates" },
        { icon: "\uD83D\uDCC1", title: "Reports", desc: "Glassmorphic business reports" },
        { icon: "\uD83E\uDDFE", title: "Invoices", desc: "Stylish, branded invoices" },
        { icon: "\uD83D\uDCDA", title: "Brochures", desc: "Trifold & company profile designs" },
        { icon: "\uD83D\uDCDC", title: "Proposal Templates", desc: "Client proposal templates" },
        { icon: "\uD83D\uDCEC", title: "Business Letterhead", desc: "Modern letterhead styles" },
      ]
    },
    Marketing: {
      emoji: "\uD83D\uDCC8",
      border: "border-pink-400/20",
      shadow: "shadow-green-200/10",
      accent: "text-pink-400",
      templates: [
        { icon: "\uD83C\uDF7F", title: "Flyer", desc: "Trendy event flyer with stickers." },
        { icon: "\uD83D\uDD25", title: "Promo Banner", desc: "Sale banner, call-to-action highlights." },
        { icon: "\uD83C\uDF89", title: "Announcement", desc: "Loud Gen Z announcement post." }
      ]
    },
    "Social Media": {
      emoji: "\uD83D\uDCF1",
      border: "border-blue-500/20",
      shadow: "shadow-purple-300/10",
      accent: "text-blue-400",
      templates: [
        { icon: "\uD83D\uDCF8", title: "IG Story", desc: "Animated Instagram story." },
        { icon: "\uD83C\uDFAC", title: "TikTok", desc: "Vertical TikTok video post." },
        { icon: "\uD83D\uDDBC\uFE0F", title: "YouTube Thumb", desc: "Neon YT thumbnail." }
      ]
    },
    "Web Design": {
      emoji: "\uD83D\uDDA5\uFE0F",
      border: "border-green-300/20",
      shadow: "shadow-emerald-200/10",
      accent: "text-green-300",
      templates: [
        { icon: "\uD83C\uDF10", title: "Homepage", desc: "Trendy cyber homepage UI." },
        { icon: "\uD83D\uDC64", title: "Portfolio", desc: "Minimal portfolio grid." },
        { icon: "\uD83E\uDDE9", title: "UI Kit", desc: "Drag & drop UI kit starter." }
      ]
    },
    Documents: {
      emoji: "\uD83D\uDCC4",
      border: "border-purple-300/20",
      shadow: "shadow-mint-200/10",
      accent: "text-purple-300",
      templates: [
        { icon: "\uD83D\uDCC1", title: "Report", desc: "Glassmorphic report doc." },
        { icon: "\uD83D\uDCDA", title: "Ebook", desc: "Aesthetic ebook layout." },
        { icon: "\uD83D\uDCDD", title: "Worksheet", desc: "Editable student worksheet." }
      ]
    },
    Education: {
      emoji: "\uD83C\uDF93",
      border: "border-amber-400/20",
      shadow: "shadow-amber-300/10",
      accent: "text-amber-300",
      templates: [
        { icon: "\uD83D\uDCDA", title: "Course", desc: "Online course design templates." },
        { icon: "\uD83D\uDCDD", title: "Lesson", desc: "Educational lesson layouts." },
        { icon: "\uD83C\uDFAD", title: "Workshop", desc: "Interactive workshop materials." }
      ]
    },
    Events: {
      emoji: "\uD83C\uDF89",
      border: "border-red-400/20",
      shadow: "shadow-red-300/10",
      accent: "text-red-300",
      templates: [
        { icon: "\uD83D\uDC8C", title: "Invitation", desc: "Event invitation designs." },
        { icon: "\uD83C\uDFA8", title: "Poster", desc: "Event poster templates." },
        { icon: "\uD83C\uDFAB", title: "Ticket", desc: "Event ticket designs." }
      ]
    },
    Personal: {
      emoji: "\uD83D\uDC64",
      border: "border-teal-400/20",
      shadow: "shadow-teal-300/10",
      accent: "text-teal-300",
      templates: [
        { icon: "\uD83D\uDCF7", title: "Photo Album", desc: "Personal photo collections." },
        { icon: "\uD83C\uDF82", title: "Birthday", desc: "Birthday celebration designs." },
        { icon: "\uD83D\uDC8D", title: "Wedding", desc: "Wedding invitation templates." }
      ]
    }
  };

  const TOPBAR_SECTIONS = [
    { key: "projects", label: "My Projects", icon: <Folder size={18} /> },
    { key: "assets", label: "Creative Asset", icon: <ImagePlus size={18} /> },
    { key: "docs", label: "Documents", icon: <FileText size={18} /> },
    { key: "web", label: "Webpage", icon: <Globe2 size={18} /> },
    { key: "social", label: "Social Media", icon: <Users size={18} /> },
    { key: "ai", label: "Generative AI", icon: <Sparkles size={18} /> }
  ];

  function TopNavBar() {
    return (
      <div className="w-full flex items-center px-6 py-3 bg-black z-50 border-b border-[#222] relative">
        <div className="flex items-center gap-2 mr-8 flex-shrink-0">
          <span className="text-4xl text-yellow-400 font-bold select-none"></span>
          <span className="text-2xl font-extrabold text-yellow-400"></span>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
          {TOPBAR_SECTIONS.map((section: any) => (
            <button
              key={section.key}
              className="flex items-center gap-2 px-4 py-2 font-semibold text-yellow-300 bg-[#16171c] hover:bg-[#232436] rounded-lg transition"
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
        <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow hover:scale-105 transition">
          <Download size={18} /> Download
        </button>
        <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-red-400 to-pink-500 rounded-xl shadow hover:scale-105 transition ml-2">
          <Share size={18} /> Export
        </button>
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
    "Personal Branding",
    "Business & Corporate",
    "Influencer & Creator",
    "Creative & Artistic",
    "Educational & Academic",
    "Beauty & Fashion",
    "Health & Fitness",
    "Music & Entertainment",
    "Real Estate"
  ];

  // Story categories
  const STORY_SELECTOR_LIST = [
    "Promotional",
    "Educational",
    "Engagement",
    "Business",
    "Personal",
    "Seasonal",
    "Quote/Motivational",
    "Announcement",
    "User-Generated Content",
    "Call-to-Action",
    "Youtube story",
    "Instagram story",
    "Twitter story",
    "Facebook story"
  ];

  // Live categories
  const LIVE_SELECTOR_LIST = [
    "Live Event Promotion",
    "Q&A and Interviews",
    "Gaming",
    "Esports",
    "Music",
    "Performance",
    "Educational & Informative",
    "Beauty & Fashion",
    "Health & Fitness",
    "Interactive Engagement",
    "Behind-the-Scenes"
  ];

  // Ads categories
  const ADS_SELECTOR_LIST = [
    "Sales & Promotions",
    "Lead Generation",
    "Brand Awareness",
    "Product Showcase",
    "Event",
    "Webinar Promotions",
    "Fashion & Beauty",
    "Tech",
    "Digital Products",
    "Educational & In"
  ];

  // Utility to normalize category names for comparison
  function normalizeCategory(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function CreateModal({ visible, subTabs, selectedSubTab, onSelectSubTab, onPreview, onClose }: {
    visible: boolean;
    subTabs: string[];
    selectedSubTab: string;
    onSelectSubTab: (tab: string) => void;
    onPreview: (tpl: any) => void;
    onClose: () => void;
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
            className="relative z-10 flex flex-col rounded-2xl shadow-2xl mx-4 bg-[#191a21]/90 p-14"
            style={{
              width: '90vw',
              minWidth: '1200px',
              maxWidth: '1800px',
              maxHeight: '90vh',
              border: '1.5px solid #292a34'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <span className="text-yellow-300">🖼️</span>
                <span>Templates</span>
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
            <div className="flex items-center mb-5">
              <input
                type="text"
                placeholder="Search templates…"
                className="w-full px-4 py-3 rounded-xl bg-[#232438]/80 text-lg text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            {loading ? (
              <div className="text-yellow-400 text-2xl p-8">Loading templates…</div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 48px 0 #ffe08222' }}>
                  {Object.keys(groupedTemplates).length === 0 && (
                    <div className="flex flex-col items-center mt-16 text-3xl text-yellow-300 opacity-60">
                      <span>😅</span>
                      <span>No templates found in Firestore.</span>
                    </div>
                  )}
                  {Object.entries(groupedTemplates).map(([cat, tpls]) => (
                    <div key={cat} className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-yellow-700 flex items-center gap-3">
                          {cat}
                          <span className="text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full font-semibold shadow-lg">
                            {tpls.length} template{tpls.length !== 1 ? 's' : ''}
                          </span>
                        </h3>
                        <div className="text-sm text-yellow-600 font-medium">
                          {tpls.length === 0 ? 'No templates available' : 
                           tpls.length === 1 ? '1 template available' :
                           `${tpls.length} templates available`}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-14">
                        {tpls.map((tpl: any, idx: number) => (
                          <TemplateCard
                            key={tpl.id || tpl.title + idx}
                            icon={tpl.icon}
                            title={tpl.title}
                            desc={tpl.desc}
                            border="border-yellow-400/30"
                            shadow="shadow-yellow-300/10"
                            accent="text-yellow-300"
                            preview={tpl.preview}
                            onClick={() => onPreview(tpl)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

    const config = CATEGORY_CONFIG[selectedSubTab] || CATEGORY_CONFIG.Business;
    let templatesList = config.templates;
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
              <span className="text-3xl">📝</span>
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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
                      onClick={() => onPreview(tpl)}
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

  export default function Studio() {
    const [selectedTab, setSelectedTab] = useState(TABS[0].key);
    const [selectedSubTab, setSelectedSubTab] = useState(CREATE_SUBTABS[0]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    React.useEffect(() => {
      setShowCreateModal(selectedTab === "create" || selectedTab === "templates");
    }, [selectedTab]);

    return (
      <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-[#17171c] to-[#232438] relative">
        <TopNavBar />
        <CreateModal
          visible={showCreateModal}
          subTabs={CREATE_SUBTABS}
          selectedSubTab={selectedTab === "templates" ? "Templates" : selectedSubTab}
          onSelectSubTab={setSelectedSubTab}
          onPreview={setPreviewTemplate}
          onClose={() => setShowCreateModal(false)}
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
                  onClick={() => setSelectedTab(tab.key)}
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
            <div className="flex-1 flex flex-col items-center justify-center min-w-0"></div>
          </main>
        </div>
      </div>
    );
  }