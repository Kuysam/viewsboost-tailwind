import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Grid, List, Star, Zap, Crown, Clock, X, ChevronDown, ChevronUp, Eye, Heart, Copy, Edit3, Sparkles } from 'lucide-react';
import { TextPreset, TextPresetCategory, Platform, TextPresetFilter } from '../types/textPresets';
import { textPresets, presetCategories, platformColors, getPresetsByCategory, getPresetsByPlatform, getTrendingPresets, getNewPresets, getPremiumPresets, getMostUsedPresets, searchPresets } from '../data/textPresets';
import TextPresetCard from './TextPresetCard';
import TextPresetPreview from './TextPresetPreview';
import VirtualizedTextPresetsList from './VirtualizedTextPresetsList';

interface TextPresetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetSelect: (preset: TextPreset) => void;
  className?: string;
}

const TextPresetsPanel: React.FC<TextPresetsPanelProps> = ({
  isOpen,
  onClose,
  onPresetSelect,
  className = ''
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TextPresetCategory | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created' | 'updated'>('usage');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyTrending, setShowOnlyTrending] = useState(false);
  const [previewPreset, setPreviewPreset] = useState<TextPreset | null>(null);
  const [recentPresets, setRecentPresets] = useState<string[]>([]);

  // Load recent presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('viewsboost-recent-text-presets');
    if (stored) {
      setRecentPresets(JSON.parse(stored));
    }
  }, []);

  // Save recent presets to localStorage
  const addToRecentPresets = useCallback((presetId: string) => {
    setRecentPresets(prev => {
      const updated = [presetId, ...prev.filter(id => id !== presetId)].slice(0, 10);
      localStorage.setItem('viewsboost-recent-text-presets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Filter and sort presets
  const filteredPresets = useMemo(() => {
    let filtered = textPresets;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchPresets(searchQuery);
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
    if (showOnlyPremium) {
      filtered = filtered.filter(preset => preset.isPremium);
    }

    // Apply new filter
    if (showOnlyNew) {
      filtered = filtered.filter(preset => preset.isNew);
    }

    // Apply trending filter
    if (showOnlyTrending) {
      filtered = filtered.filter(preset => preset.isTrending);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'usage':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updated':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        default:
          aValue = a.usageCount;
          bValue = b.usageCount;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedPlatform, showOnlyPremium, showOnlyNew, showOnlyTrending, sortBy, sortOrder]);

  // Get recent presets data
  const recentPresetsData = useMemo(() => {
    return recentPresets.map(id => textPresets.find(preset => preset.id === id)).filter(Boolean) as TextPreset[];
  }, [recentPresets]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: TextPreset) => {
    addToRecentPresets(preset.id);
    onPresetSelect(preset);
  }, [addToRecentPresets, onPresetSelect]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setShowOnlyPremium(false);
    setShowOnlyNew(false);
    setShowOnlyTrending(false);
  };

  // Get quick filter sets
  const quickFilters = [
    { label: 'All', count: textPresets.length, action: clearFilters },
    { label: 'Trending', count: getTrendingPresets().length, action: () => setShowOnlyTrending(true) },
    { label: 'New', count: getNewPresets().length, action: () => setShowOnlyNew(true) },
    { label: 'Premium', count: getPremiumPresets().length, action: () => setShowOnlyPremium(true) },
    { label: 'Most Used', count: getMostUsedPresets().length, action: () => setSortBy('usage') }
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-96 bg-[#191a21] border-r border-gray-700 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-yellow-400" />
              Text Presets
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quickFilters.map((filter, index) => (
              <button
                key={index}
                onClick={filter.action}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors"
              >
                {filter.label}
                <span className="text-yellow-400">({filter.count})</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-yellow-500 text-black' : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <div className="flex bg-gray-800 rounded-lg overflow-hidden">
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
              {filteredPresets.length} presets
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TextPresetCategory | 'all')}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(presetCategories).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'all')}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="all">All Platforms</option>
                  <option value="canva">Canva</option>
                  <option value="capcut">CapCut</option>
                  <option value="createvista">Create Vista</option>
                  <option value="adobeexpress">Adobe Express</option>
                  <option value="viewsboost">ViewsBoost</option>
                  <option value="universal">Universal</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'created' | 'updated')}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="usage">Usage</option>
                    <option value="name">Name</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              {/* Filter Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showOnlyPremium}
                    onChange={(e) => setShowOnlyPremium(e.target.checked)}
                    className="rounded text-yellow-400"
                  />
                  Premium Only
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showOnlyNew}
                    onChange={(e) => setShowOnlyNew(e.target.checked)}
                    className="rounded text-yellow-400"
                  />
                  New Only
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={showOnlyTrending}
                    onChange={(e) => setShowOnlyTrending(e.target.checked)}
                    className="rounded text-yellow-400"
                  />
                  Trending Only
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent Presets */}
          {recentPresetsData.length > 0 && !searchQuery && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Recently Used
              </h3>
              <div className="space-y-2">
                {recentPresetsData.slice(0, 5).map((preset) => (
                  <TextPresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={handlePresetSelect}
                    onPreview={setPreviewPreset}
                    viewMode="list"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Virtualized Preset List */}
          <VirtualizedTextPresetsList
            presets={filteredPresets}
            onPresetSelect={handlePresetSelect}
            onPresetPreview={setPreviewPreset}
            viewMode={viewMode}
            searchQuery={searchQuery}
            loading={false}
            className="flex-1"
          />
        </div>
      </div>

      {/* Preview Modal */}
      {previewPreset && (
        <TextPresetPreview
          preset={previewPreset}
          onClose={() => setPreviewPreset(null)}
          onSelect={handlePresetSelect}
        />
      )}
    </div>
  );
};

export default TextPresetsPanel;