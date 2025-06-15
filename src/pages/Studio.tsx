  import React, { useState } from "react";
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
    "Customize"
  ];

  // --- Social Media Category Sections ---
  const SOCIAL_MEDIA_SECTIONS = [
    { key: "video", label: "Video" },
    { key: "photo", label: "Photo" },
    { key: "shorts", label: "Shorts" },
    { key: "post", label: "Post" },
    { key: "story", label: "Story" },
    { key: "cover", label: "Cover" },
    { key: "ads", label: "Ads" },
    { key: "background", label: "Background" }
  ];

  // --- Video and Shorts templates as objects (multiple templates for each type) ---
  const SOCIAL_MEDIA_VIDEO_TEMPLATES: { [key: string]: any[] } = {
    "YouTube Video": [
      {
        icon: "🎬",
        title: "Vlog Style",
        desc: "Classic vlog with intro/outro, subscribe CTA.",
        preview: "/templates/vlog-style.webp"
      },
      { icon: "🕹️", title: "Gaming Stream", desc: "Stream overlay, facecam, chat highlight." },
      { icon: "🎓", title: "How-to/Educational", desc: "Step-by-step, split screen, captions." },
      { icon: "🎤", title: "Podcast/Interview", desc: "Side-by-side guest layout, waveform." },
      { icon: "🌟", title: "Trending Shorts", desc: "Super fast, bold subtitles, jump cuts." },
      { icon: "⚡", title: "Reaction", desc: "Big webcam, meme overlays, viral moments." }
    ],
    "YouTube Intro": [
      { icon: "⚡", title: "Animated Logo", desc: "Logo reveal with motion." },
      { icon: "💫", title: "Text Swipe", desc: "Animated text, swipe intro." }
    ],
    "Customize Video": [
      { icon: "🎞️", title: "Multi-Video Layout", desc: "Combine videos, transitions, overlays." },
      { icon: "💡", title: "Brand Kit", desc: "Upload your logo, brand colors." }
    ],
    "Video Landscape": [
      { icon: "🖥️", title: "Cinematic", desc: "Widescreen 16:9, cinematic overlays." },
      { icon: "🌄", title: "Photo Highlight", desc: "Photo/video grid landscape." }
    ],
    "Video Full HD (4K/8K)": [
      { icon: "🌌", title: "Ultra HD Clean", desc: "Super crisp, minimal design." },
      { icon: "✨", title: "Animated Overlay", desc: "Sparkle/highlight for UHD." }
    ],
    "Twitter Video": [
      { icon: "🐦", title: "Tweet Reaction", desc: "Bold border, tweet overlay." }
    ],
    "ViewsBoost Video": [
      { icon: "🚀", title: "Branded Template", desc: "Official ViewsBoost look." }
    ],
    "YouTube Thumbnail": [
      { icon: "🖼️", title: "Clickbait", desc: "Bright colors, big text." },
      { icon: "🔥", title: "Minimal", desc: "Clean, modern, focused." }
    ],
    "ViewsBoost Thumbnail": [
      { icon: "🟦", title: "Preview", desc: "Brand color, logo overlay." }
    ],
    "Multi-screen (Customizable)": [
      { icon: "🖥️", title: "Side by Side", desc: "Multiple screens, split view." },
      { icon: "🗂️", title: "Grid", desc: "Customizable multi-grid." }
    ]
  };

  const VIDEO_SELECTOR_LIST = Object.keys(SOCIAL_MEDIA_VIDEO_TEMPLATES);

  const SOCIAL_MEDIA_SHORTS_TEMPLATES: { [key: string]: any[] } = {
    "Facebook Shorts": [
      { icon: "📱", title: "FB Quick", desc: "Fast, fun vertical short." }
    ],
    "Instagram Reel": [
      { icon: "🎞️", title: "Classic Reel", desc: "IG reel with trendy music." },
      { icon: "🕺", title: "Dance Trend", desc: "Overlay, fast cuts." }
    ],
    "Snapchat Shorts": [
      { icon: "👻", title: "Snap Short", desc: "Snapchat-inspired overlays." }
    ],
    "TikTok Shorts": [
      { icon: "🎵", title: "TikTok Viral", desc: "Gen Z, meme, bold captions." }
    ],
    "Pinterest Video Pin": [
      { icon: "📌", title: "Animated Pin", desc: "Vertical, looping pin." }
    ],
    "Shorts Customize": [
      { icon: "⚡", title: "Custom Short", desc: "Build your own short." }
    ],
    "Linked Short": [
      { icon: "🔗", title: "Business Short", desc: "LinkedIn vertical video." }
    ],
    "LinkedIn Video": [
      { icon: "💼", title: "Professional", desc: "For business/pitch." }
    ],
    "ViewsBoost Short": [
      { icon: "🚀", title: "Official", desc: "Branded VB vertical short." }
    ],
    "YouTube Shorts": [
      { icon: "▶️", title: "YouTube Short", desc: "YT-optimized fast video." }
    ]
  };

  const SHORTS_SELECTOR_LIST = Object.keys(SOCIAL_MEDIA_SHORTS_TEMPLATES);

  const SOCIAL_MEDIA_OTHER_TEMPLATES: { [key: string]: any[] } = {
    photo: [
      { icon: "🖼️", title: "Instagram Photo", desc: "Optimized square photo post" },
      { icon: "📷", title: "Facebook Photo", desc: "Classic photo format for Facebook" },
      { icon: "🌄", title: "ViewsBoost Photo", desc: "Showcase with stylish border" }
    ],
    post: [
      { icon: "📝", title: "Twitter Post", desc: "Engaging tweet card" },
      { icon: "💬", title: "LinkedIn Post", desc: "Professional update design" },
      { icon: "🌟", title: "IG Carousel", desc: "Instagram swipeable post" }
    ],
    story: [
      { icon: "📱", title: "Instagram Story", desc: "Vertical animated story" },
      { icon: "🧑‍🎤", title: "TikTok Story", desc: "Gen Z, dynamic effects" },
      { icon: "🎉", title: "ViewsBoost Story", desc: "For your fans & followers" }
    ],
    cover: [
      { icon: "🖼️", title: "Facebook Cover", desc: "Cover photo template" },
      { icon: "💡", title: "LinkedIn Banner", desc: "Professional banner layout" },
      { icon: "📚", title: "YouTube Channel Art", desc: "Perfect fit for YouTube" }
    ],
    ads: [
      { icon: "💸", title: "Facebook Ad", desc: "High-CTR ad creative" },
      { icon: "📢", title: "Instagram Ad", desc: "IG promo with bold CTA" },
      { icon: "🛒", title: "Pinterest Ad", desc: "Ad for product pinning" }
    ],
    background: [
      { icon: "🎨", title: "Gradient Background", desc: "Trendy gradient for stories" },
      { icon: "🌌", title: "Animated BG", desc: "Moving backgrounds for posts" },
      { icon: "✨", title: "Pattern BG", desc: "Gen Z geometric patterns" }
    ]
  };

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
    Customize: {
      emoji: "\uD83C\uDFA8",
      border: "border-pink-300/20",
      shadow: "shadow-yellow-200/10",
      accent: "text-pink-300",
      templates: [
        { icon: "\uD83D\uDD8C\uFE0F", title: "Start Blank", desc: "Blank canvas for free creation." },
        { icon: "\uD83C\uDFDE\uFE0F", title: "Collage", desc: "Drag-and-drop collage builder." },
        { icon: "\uD83D\uDDBC\uFE0F", title: "Art Print", desc: "Print-ready art template." }
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
        className={`relative group rounded-2xl p-5 shadow-xl border-2 ${border} ${shadow}
          cursor-pointer transition-all bg-[#232438] backdrop-blur-md
          hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-yellow-300/40
          overflow-hidden`}
        style={{
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "rgba(24,25,28,0.98)",
        }}
        onClick={onClick}
        tabIndex={0}
        role="button"
      >
        {preview && (
          <img src={preview} alt={title} className="absolute top-0 left-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition pointer-events-none rounded-2xl" />
        )}
        <div className={`text-3xl mb-2 z-10 relative ${accent}`}>{icon}</div>
        <div className={`text-xl font-bold text-white drop-shadow-sm z-10 relative ${accent}`}>{title}</div>
        <div className="text-md text-yellow-200/60 mt-1 mb-2 z-10 relative">{desc}</div>
        <span className={`absolute bottom-3 right-4 text-2xl opacity-10 group-hover:opacity-25 transition ${accent}`}>{icon}</span>
      </div>
    );
  }

  // If the import fails, define a placeholder
  // @ts-ignore
  if (!TemplatePreviewModal) {
    // eslint-disable-next-line
    // @ts-ignore
    TemplatePreviewModal = ({ open, template, onClose }: any) => null;
  }

  function CreateModal({ visible, subTabs, selectedSubTab, onSelectSubTab, onPreview, onClose }: {
    visible: boolean;
    subTabs: string[];
    selectedSubTab: string;
    onSelectSubTab: (tab: string) => void;
    onPreview: (tpl: any) => void;
    onClose: () => void;
  }) {
    const [selectedSocialSection, setSelectedSocialSection] = useState<string>(SOCIAL_MEDIA_SECTIONS[0].key);
    const [selectedVideoType, setSelectedVideoType] = useState<string>(VIDEO_SELECTOR_LIST[0]);
    const [selectedShortsType, setSelectedShortsType] = useState<string>(SHORTS_SELECTOR_LIST[0]);

    // Dynamically set category for useTemplates
    let templatesCategory = selectedSubTab;
    if (selectedSubTab === "Social Media" && selectedSocialSection === "video") {
      templatesCategory = selectedVideoType;
    } else if (selectedSubTab === "Social Media" && selectedSocialSection === "shorts") {
      templatesCategory = selectedShortsType;
    }
    const { templates, loading }: { templates: any[]; loading: boolean } = useTemplates(templatesCategory);

    React.useEffect(() => {
      if (selectedSubTab === "Social Media") {
        setSelectedSocialSection(SOCIAL_MEDIA_SECTIONS[0].key);
        setSelectedVideoType(VIDEO_SELECTOR_LIST[0]);
        setSelectedShortsType(SHORTS_SELECTOR_LIST[0]);
      }
    }, [selectedSubTab]);

    if (!visible) return null;
    if (selectedSubTab === "Templates") {
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
            <h2 className="text-4xl font-extrabold mb-10 text-white flex items-center gap-2">
              <span className="text-yellow-300">🖼️</span>
              <span>Templates</span>
            </h2>
            <div className="flex items-center mb-12">
              <input
                type="text"
                placeholder="Search templates…"
                className="w-full px-7 py-5 rounded-2xl bg-[#232438]/80 text-2xl text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            {loading ? (
              <div className="text-yellow-400 text-2xl p-8">Loading templates…</div>
            ) : (
              <div className="grid grid-cols-3 gap-14">
                {templates.map((tpl: any) => (
                  <TemplateCard
                    key={tpl.id}
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
                {!templates.length && (
                  <div className="flex flex-col items-center mt-16 text-3xl text-yellow-300 opacity-60">
                    <span>😅</span>
                    <span>No templates found in Firestore.</span>
                  </div>
                )}
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

    if (selectedSubTab === "Social Media") {
      if (selectedSocialSection === "video") {
        selectorBar = (
          <div className="flex gap-3 mb-7">
            {VIDEO_SELECTOR_LIST.map((type: string) => (
              <button
                key={type}
                onClick={() => setSelectedVideoType(type)}
                className={`px-5 py-2 rounded-xl font-semibold transition ${selectedVideoType === type ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black scale-105" : "bg-[#232436] text-yellow-200 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-black"}`}
              >
                {type}
              </button>
            ))}
          </div>
        );
        // Use Firestore templates for the selected video type
        templatesList = templates;
      }
      else if (selectedSocialSection === "shorts") {
        selectorBar = (
          <div className="flex gap-3 mb-7">
            {SHORTS_SELECTOR_LIST.map((type: string) => (
              <button
                key={type}
                onClick={() => setSelectedShortsType(type)}
                className={`px-5 py-2 rounded-xl font-semibold transition ${selectedShortsType === type ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black scale-105" : "bg-[#232436] text-yellow-200 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-black"}`}
              >
                {type}
              </button>
            ))}
          </div>
        );
        // Use Firestore templates for the selected shorts type
        templatesList = templates;
      }
      else if (SOCIAL_MEDIA_OTHER_TEMPLATES[selectedSocialSection]) {
        templatesList = SOCIAL_MEDIA_OTHER_TEMPLATES[selectedSocialSection];
      } else {
        templatesList = [
          {
            icon: "📸",
            title:
              selectedSocialSection.charAt(0).toUpperCase() +
              selectedSocialSection.slice(1),
            desc: `${selectedSocialSection.charAt(0).toUpperCase() +
              selectedSocialSection.slice(1)} templates coming soon!`
          }
        ];
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
            <div className="flex items-center mb-12">
              <input
                type="text"
                placeholder={`Search ${selectedSubTab} templates...`}
                className="w-full px-7 py-5 rounded-2xl bg-[#232438]/80 text-2xl text-white border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-14">
                {templatesList.map((tpl: any, idx: number) => (
                  <TemplateCard
                    key={tpl.title + idx}
                    {...tpl}
                    border={config.border}
                    shadow={config.shadow}
                    accent={config.accent}
                    preview={tpl.preview}
                    onClick={() => onPreview(tpl)}
                  />
                ))}
                {!templatesList.length && (
                  <div className="flex flex-col items-center mt-16 text-3xl text-yellow-300 opacity-60">
                    <span>😅</span>
                    <span>No templates here... yet!</span>
                  </div>
                )}
              </div>
            </div>
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