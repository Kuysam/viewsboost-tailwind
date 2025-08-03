import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, TrendingUp, Crown, Zap, Palette, Type, Sparkles, BarChart3 } from 'lucide-react';
import { TextPreset } from '../types/textPresets';
import { textPresets } from '../data/textPresets';
import { categoryDefinitions, platformSpecialties, quickFilters } from '../data/presetCategories';
import VirtualizedTextPresetsList from './VirtualizedTextPresetsList';
import TextPresetPreview from './TextPresetPreview';

interface PresetShowcaseProps {
  onPresetSelect?: (preset: TextPreset) => void;
  className?: string;
}

const PresetShowcase: React.FC<PresetShowcaseProps> = ({
  onPresetSelect = () => {},
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [previewPreset, setPreviewPreset] = useState<TextPreset | null>(null);

  // Filter and sort presets
  const filteredPresets = useMemo(() => {
    let filtered = textPresets;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(preset =>
        preset.name.toLowerCase().includes(query) ||
        preset.tags.some(tag => tag.toLowerCase().includes(query)) ||
        preset.sampleText.toLowerCase().includes(query) ||
        preset.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(preset => preset.category === selectedCategory);
    }

    // Apply platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(preset => preset.platform === selectedPlatform);
    }

    // Apply premium filter
    if (showPremiumOnly) {
      filtered = filtered.filter(preset => preset.isPremium);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount;
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedPlatform, showPremiumOnly, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = textPresets.length;
    const premium = textPresets.filter(p => p.isPremium).length;
    const trending = textPresets.filter(p => p.isTrending).length;
    const newest = textPresets.filter(p => p.isNew).length;
    
    const categoryCount = Object.keys(categoryDefinitions).length;
    const platformCount = Object.keys(platformSpecialities).length;

    return {
      total,
      premium,
      trending,
      newest,
      categoryCount,
      platformCount,
      filtered: filteredPresets.length
    };
  }, [filteredPresets.length]);

  // Category options
  const categoryOptions = Object.entries(categoryDefinitions).map(([key, def]) => ({
    value: key,
    label: def.label,
    icon: def.icon,
    color: def.color
  }));

  // Platform options
  const platformOptions = Object.entries(platformSpecialties).map(([key, spec]) => ({
    value: key,
    label: spec.name,
    color: spec.color,
    count: spec.presetCount
  }));

  return (
    <div className={`w-full h-full bg-[#191a21] text-white ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-[#191a21] to-[#232438]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Type className="w-8 h-8 text-yellow-400" />
              ViewsBoost Text Presets
            </h1>
            <p className="text-gray-400 mt-2">
              200+ Professional Text Styles Inspired by Canva, CapCut, Create Vista & Adobe Express
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">{stats.total}</div>
              <div className="text-xs text-gray-400">Total Presets</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">{stats.categoryCount}</div>
              <div className="text-xs text-gray-400">Categories</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{stats.platformCount}</div>
              <div className="text-xs text-gray-400">Platforms</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{stats.premium}</div>
              <div className="text-xs text-gray-400">Premium</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search 200+ presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
          >
            <option value="all">All Categories ({Object.keys(categoryDefinitions).length})</option>
            {categoryOptions.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
          >
            <option value="all">All Platforms</option>
            {platformOptions.map(platform => (
              <option key={platform.value} value={platform.value}>
                {platform.label} ({platform.count})
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'alphabetical')}
            className="p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(quickFilters).map(([label, config]) => (
            <button
              key={label}
              onClick={() => {
                // Apply the quick filter logic here
                if (label === 'Trending Now') {
                  setSelectedCategory('all');
                  // Filter by trending would be handled in the filter logic
                }
                // Add more quick filter logic as needed
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors border border-gray-600 hover:border-yellow-400"
              style={{ borderColor: config.color + '40' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              {label}
              <span className="text-xs opacity-75">({config.count})</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={(e) => setShowPremiumOnly(e.target.checked)}
                className="rounded"
              />
              <Crown className="w-4 h-4 text-yellow-400" />
              Premium Only
            </label>
            
            <div className="flex bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Showing {stats.filtered} of {stats.total} presets
          </div>
        </div>
      </div>

      {/* Preset Display */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedTextPresetsList
          presets={filteredPresets}
          onPresetSelect={onPresetSelect}
          onPresetPreview={setPreviewPreset}
          viewMode={viewMode}
          searchQuery={searchQuery}
          itemsPerRow={viewMode === 'grid' ? 3 : 1}
          className="h-full"
        />
      </div>

      {/* Preview Modal */}
      {previewPreset && (
        <TextPresetPreview
          preset={previewPreset}
          onClose={() => setPreviewPreset(null)}
          onSelect={onPresetSelect}
        />
      )}
    </div>
  );
};

export default PresetShowcase;