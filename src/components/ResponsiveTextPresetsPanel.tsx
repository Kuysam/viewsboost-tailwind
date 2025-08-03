import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, X, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { TextPreset } from '../types/textPresets';
import { useTextPresets } from '../hooks/useTextPresets';
import TextPresetCard from './TextPresetCard';
import TextPresetPreview from './TextPresetPreview';

interface ResponsiveTextPresetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetSelect: (preset: TextPreset) => void;
  className?: string;
}

const ResponsiveTextPresetsPanel: React.FC<ResponsiveTextPresetsPanelProps> = ({
  isOpen,
  onClose,
  onPresetSelect,
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [previewPreset, setPreviewPreset] = useState<TextPreset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const {
    presets,
    recentPresets,
    filteredCount,
    totalCount,
    filter,
    loading,
    updateFilter,
    clearFilter,
    addToRecentPresets,
    quickFilters
  } = useTextPresets();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update search filter
  useEffect(() => {
    updateFilter({ search: searchQuery });
  }, [searchQuery, updateFilter]);

  // Handle preset selection
  const handlePresetSelect = (preset: TextPreset) => {
    addToRecentPresets(preset.id);
    onPresetSelect(preset);
    if (isMobile) {
      onClose();
    }
  };

  // Pagination
  const totalPages = Math.ceil(presets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPresets = presets.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!isOpen) return null;

  // Mobile layout
  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-50 bg-[#191a21] ${className}`}>
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Text Presets</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <div className="flex bg-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recent Presets */}
          {recentPresets.length > 0 && !searchQuery && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Recently Used</h3>
              <div className="space-y-2">
                {recentPresets.slice(0, 3).map((preset) => (
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

          {/* Presets Grid */}
          {currentPresets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No presets found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
                {currentPresets.map((preset) => (
                  <TextPresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={handlePresetSelect}
                    onPreview={setPreviewPreset}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-6 gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-white">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
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
  }

  // Desktop layout - use existing TextPresetsPanel
  return (
    <div className={`fixed inset-0 z-50 flex ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-96 bg-[#191a21] border-r border-gray-700 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header - same as original */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Menu className="w-6 h-6 text-yellow-400" />
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
            <button
              onClick={quickFilters.clear}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors"
            >
              All ({totalCount})
            </button>
            <button
              onClick={quickFilters.trending}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors"
            >
              Trending
            </button>
            <button
              onClick={quickFilters.new}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors"
            >
              New
            </button>
            <button
              onClick={quickFilters.premium}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-colors"
            >
              Premium
            </button>
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
              {filteredCount} presets
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent Presets */}
          {recentPresets.length > 0 && !searchQuery && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Recently Used</h3>
              <div className="space-y-2">
                {recentPresets.slice(0, 5).map((preset) => (
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

          {/* Preset Grid/List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading presets...</p>
              </div>
            ) : currentPresets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No presets found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 gap-4' 
                    : 'space-y-2'
                }>
                  {currentPresets.map((preset) => (
                    <TextPresetCard
                      key={preset.id}
                      preset={preset}
                      onSelect={handlePresetSelect}
                      onPreview={setPreviewPreset}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center mt-6 gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded text-sm ${
                              currentPage === pageNum
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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

export default ResponsiveTextPresetsPanel;