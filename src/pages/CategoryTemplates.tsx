import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Download, Share, X } from "lucide-react";
import { useTemplates } from "../lib/useTemplates";
// @ts-ignore
import TemplatePreviewModal from "../components/TemplatePreviewModal";

interface Template {
  id?: string;
  title: string;
  desc?: string;
  description?: string;
  category: string;
  preview?: string;
  imageUrl?: string;
  [key: string]: any;
}

function CategoryTemplates() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Decode the category parameter (in case it has special characters)
  const decodedCategory = category ? decodeURIComponent(category) : "";
  
  // Fetch templates for this specific category
  const { loading } = useTemplates(decodedCategory);

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template => 
    template.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function goBack() {
    navigate(-1); // Go back to previous page
  }

  function getCategoryIcon(category: string) {
    // Return appropriate emoji based on category
    const categoryLower = category.toLowerCase();
    
    // Video categories
    if (categoryLower.includes("youtube")) return "🎬";
    if (categoryLower.includes("facebook")) return "📘";
    if (categoryLower.includes("twitter")) return "🐦";
    if (categoryLower.includes("linkedin")) return "💼";
    if (categoryLower.includes("viewsboost")) return "⚡";
    if (categoryLower.includes("video")) return "🎥";
    if (categoryLower.includes("intro") || categoryLower.includes("outro")) return "🎭";
    if (categoryLower.includes("podcast")) return "🎙️";
    if (categoryLower.includes("gaming")) return "🎮";
    
    // Shorts categories
    if (categoryLower.includes("reel") || categoryLower.includes("shorts")) return "📱";
    if (categoryLower.includes("tiktok")) return "🎵";
    if (categoryLower.includes("snapchat")) return "👻";
    if (categoryLower.includes("pinterest")) return "📌";
    
    // Content type categories
    if (categoryLower.includes("photo")) return "📸";
    if (categoryLower.includes("post")) return "📝";
    if (categoryLower.includes("carousel")) return "🎠";
    if (categoryLower.includes("thumbnail")) return "🖼️";
    if (categoryLower.includes("cover") || categoryLower.includes("banner")) return "🎨";
    if (categoryLower.includes("profile")) return "👤";
    if (categoryLower.includes("story")) return "📖";
    if (categoryLower.includes("ads")) return "📢";
    
    // Industry categories
    if (categoryLower.includes("business")) return "💼";
    if (categoryLower.includes("marketing")) return "📈";
    if (categoryLower.includes("education")) return "🎓";
    if (categoryLower.includes("health") || categoryLower.includes("fitness")) return "💪";
    if (categoryLower.includes("beauty") || categoryLower.includes("fashion")) return "💄";
    if (categoryLower.includes("food") || categoryLower.includes("cooking")) return "🍳";
    if (categoryLower.includes("music")) return "🎵";
    if (categoryLower.includes("travel")) return "✈️";
    if (categoryLower.includes("automotive")) return "🚗";
    if (categoryLower.includes("real estate")) return "🏠";
    if (categoryLower.includes("finance")) return "💰";
    
    // Default
    return "📄";
  }

  function getCategoryColor(category: string) {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes("video") || categoryLower.includes("youtube")) return "from-yellow-400 to-red-500";
    if (categoryLower.includes("shorts") || categoryLower.includes("reel")) return "from-pink-400 to-purple-500";
    if (categoryLower.includes("photo")) return "from-green-400 to-blue-500";
    if (categoryLower.includes("post")) return "from-purple-400 to-indigo-500";
    if (categoryLower.includes("carousel")) return "from-orange-400 to-red-500";
    if (categoryLower.includes("thumbnail")) return "from-cyan-400 to-blue-500";
    if (categoryLower.includes("cover") || categoryLower.includes("banner")) return "from-rose-400 to-pink-500";
    if (categoryLower.includes("profile")) return "from-emerald-400 to-teal-500";
    
    return "from-gray-400 to-gray-600";
  }

  function TemplateCard({ template }: { template: Template }) {
    return (
      <div
        className="relative group rounded-2xl p-5 cursor-pointer transition-all overflow-hidden shadow-lg bg-gray-200 border border-transparent hover:border-yellow-400 hover:shadow-[0_4px_32px_0_rgba(255,214,10,0.15)]"
        style={{
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          position: "relative",
          background: template.preview ? `url('${template.preview}') center center/cover no-repeat` : '#f5f5f5',
        }}
        onClick={() => setPreviewTemplate(template)}
        tabIndex={0}
        role="button"
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 rounded-2xl" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.1) 100%)'}} />
        
        <div className="text-3xl mb-2 z-10 relative text-yellow-400 drop-shadow-[0_2px_8px_#000a]">
          {template.icon || getCategoryIcon(category || "")}
        </div>
        
        <div className="text-xl font-bold text-white z-10 relative drop-shadow-lg">
          {template.title}
        </div>
        
        <div className="text-md text-white mt-1 mb-2 z-10 relative font-medium drop-shadow-md">
          {template.desc}
        </div>
        
        <span className="absolute bottom-3 right-4 text-2xl opacity-10 group-hover:opacity-25 transition text-yellow-400">
          {template.icon || getCategoryIcon(category || "")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17171c] to-[#232438] text-white">
      {/* Header */}
      <div className="w-full flex items-center px-6 py-4 bg-black/50 backdrop-blur-md border-b border-[#222]">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 font-semibold text-yellow-300 bg-[#16171c] hover:bg-[#232436] rounded-lg transition mr-6"
        >
          <ArrowLeft size={20} />
          Back to Studio
        </button>
        
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getCategoryIcon(decodedCategory)}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{decodedCategory}</h1>
            <p className="text-lg text-gray-300">
              {loading ? "Loading..." : `${filteredTemplates.length} templates available`}
            </p>
          </div>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-xl bg-[#16171c] text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-yellow-300"
              style={{ minWidth: 250 }}
            />
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-300 pointer-events-none"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow hover:scale-105 transition">
            <Download size={18} /> Download All
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-gradient-to-r from-red-400 to-pink-500 rounded-xl shadow hover:scale-105 transition">
            <Share size={18} /> Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-2xl text-yellow-400">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-50">{getCategoryIcon(decodedCategory)}</div>
            <h2 className="text-3xl font-bold text-gray-300 mb-2">
              {searchQuery ? "No matching templates found" : "No templates available"}
            </h2>
            <p className="text-lg text-gray-400">
              {searchQuery 
                ? `Try adjusting your search for "${searchQuery}"` 
                : `Import templates for the "${decodedCategory}" category to see them here.`
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Category Header */}
            <div className="mb-8">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-lg bg-gradient-to-r ${getCategoryColor(decodedCategory)} shadow-lg`}>
                <span className="text-2xl">{getCategoryIcon(decodedCategory)}</span>
                {decodedCategory} Templates
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTemplates.map((template, index) => (
                <TemplateCard key={template.id || `${template.title}-${index}`} template={template} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}

export default CategoryTemplates; 