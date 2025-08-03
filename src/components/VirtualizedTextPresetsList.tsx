import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { TextPreset } from '../types/textPresets';
import TextPresetCard from './TextPresetCard';

interface VirtualizedTextPresetsListProps {
  presets: TextPreset[];
  onPresetSelect: (preset: TextPreset) => void;
  onPresetPreview: (preset: TextPreset) => void;
  viewMode: 'grid' | 'list';
  searchQuery?: string;
  loading?: boolean;
  itemsPerRow?: number;
  className?: string;
}

const VirtualizedTextPresetsList: React.FC<VirtualizedTextPresetsListProps> = ({
  presets,
  onPresetSelect,
  onPresetPreview,
  viewMode,
  searchQuery = '',
  loading = false,
  itemsPerRow = 1,
  className = ''
}) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate items per row based on view mode and container width
  const calculatedItemsPerRow = useMemo(() => {
    if (viewMode === 'list') return 1;
    
    const minItemWidth = 280; // Minimum width for grid items
    const gap = 16; // Gap between items
    const padding = 32; // Container padding
    
    const availableWidth = containerDimensions.width - padding;
    const itemsWithGaps = Math.floor((availableWidth + gap) / (minItemWidth + gap));
    
    return Math.max(1, Math.min(itemsWithGaps, itemsPerRow));
  }, [viewMode, containerDimensions.width, itemsPerRow]);

  // Group presets into rows for grid view
  const groupedPresets = useMemo(() => {
    if (viewMode === 'list') {
      return presets.map(preset => [preset]);
    }

    const groups: TextPreset[][] = [];
    for (let i = 0; i < presets.length; i += calculatedItemsPerRow) {
      groups.push(presets.slice(i, i + calculatedItemsPerRow));
    }
    return groups;
  }, [presets, viewMode, calculatedItemsPerRow]);

  // Calculate item height based on view mode
  const itemHeight = useMemo(() => {
    if (viewMode === 'list') return 80; // Compact list item height
    return 320; // Grid item height with preview area
  }, [viewMode]);

  // Scroll to top when search query changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [searchQuery]);

  // Row renderer for virtualized list
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowPresets = groupedPresets[index];
    
    if (!rowPresets || rowPresets.length === 0) {
      return <div style={style} />;
    }

    return (
      <div style={style} className="px-4">
        <div className={`flex ${viewMode === 'grid' ? 'gap-4' : 'flex-col'}`}>
          {rowPresets.map((preset, presetIndex) => (
            <div
              key={preset.id}
              className={viewMode === 'grid' ? 'flex-1' : 'mb-2'}
              style={viewMode === 'grid' ? { maxWidth: `${100 / calculatedItemsPerRow}%` } : {}}
            >
              <TextPresetCard
                preset={preset}
                onSelect={onPresetSelect}
                onPreview={onPresetPreview}
                viewMode={viewMode}
              />
            </div>
          ))}
          
          {/* Fill empty spaces in last row for grid view */}
          {viewMode === 'grid' && rowPresets.length < calculatedItemsPerRow && (
            Array.from({ length: calculatedItemsPerRow - rowPresets.length }).map((_, emptyIndex) => (
              <div key={`empty-${emptyIndex}`} className="flex-1" />
            ))
          )}
        </div>
      </div>
    );
  }, [groupedPresets, viewMode, calculatedItemsPerRow, onPresetSelect, onPresetPreview]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading presets...</p>
          <p className="text-gray-500 text-sm">Preparing 200+ amazing text styles</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (groupedPresets.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No presets found</h3>
          <p className="text-gray-400 max-w-md">
            {searchQuery 
              ? `No results for "${searchQuery}". Try different keywords or clear filters.`
              : 'No presets match your current filters. Try adjusting your search criteria.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex-1 ${className}`}>
      {containerDimensions.height > 0 && (
        <List
          ref={listRef}
          height={containerDimensions.height}
          itemCount={groupedPresets.length}
          itemSize={itemHeight}
          width="100%"
          overscanCount={3} // Render 3 extra items outside viewport for smooth scrolling
        >
          {Row}
        </List>
      )}
    </div>
  );
};

// Memoized version for better performance
export default React.memo(VirtualizedTextPresetsList);