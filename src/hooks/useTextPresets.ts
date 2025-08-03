import { useState, useEffect, useMemo, useCallback } from 'react';
import { TextPreset, TextPresetFilter, RecentPreset } from '../types/textPresets';
import { textPresets, searchPresets, getPresetsByCategory, getPresetsByPlatform, getTrendingPresets, getNewPresets, getPremiumPresets } from '../data/textPresets';

export const useTextPresets = (initialFilter?: TextPresetFilter) => {
  const [filter, setFilter] = useState<TextPresetFilter>(initialFilter || {});
  const [recentPresets, setRecentPresets] = useState<RecentPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recent presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('viewsboost-recent-text-presets');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentPresets(parsed);
      }
    } catch (err) {
      console.error('Failed to load recent presets:', err);
    }
  }, []);

  // Save recent presets to localStorage
  const saveRecentPresets = useCallback((presets: RecentPreset[]) => {
    try {
      localStorage.setItem('viewsboost-recent-text-presets', JSON.stringify(presets));
    } catch (err) {
      console.error('Failed to save recent presets:', err);
    }
  }, []);

  // Add preset to recent list
  const addToRecentPresets = useCallback((presetId: string) => {
    setRecentPresets(prev => {
      const existing = prev.find(p => p.presetId === presetId);
      let updated: RecentPreset[];
      
      if (existing) {
        // Update existing
        updated = prev.map(p => 
          p.presetId === presetId 
            ? { ...p, usedAt: new Date(), usageCount: p.usageCount + 1 }
            : p
        );
      } else {
        // Add new
        updated = [
          { presetId, usedAt: new Date(), usageCount: 1 },
          ...prev
        ];
      }

      // Sort by usage date and keep only top 20
      updated = updated
        .sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime())
        .slice(0, 20);

      saveRecentPresets(updated);
      return updated;
    });
  }, [saveRecentPresets]);

  // Filter presets based on current filter
  const filteredPresets = useMemo(() => {
    setLoading(true);
    
    try {
      let filtered = textPresets;

      // Apply search filter
      if (filter.search?.trim()) {
        filtered = searchPresets(filter.search);
      }

      // Apply category filter
      if (filter.category) {
        filtered = filtered.filter(preset => preset.category === filter.category);
      }

      // Apply platform filter
      if (filter.platform) {
        filtered = filtered.filter(preset => preset.platform === filter.platform);
      }

      // Apply premium filter
      if (filter.isPremium !== undefined) {
        filtered = filtered.filter(preset => preset.isPremium === filter.isPremium);
      }

      // Apply new filter
      if (filter.isNew !== undefined) {
        filtered = filtered.filter(preset => preset.isNew === filter.isNew);
      }

      // Apply trending filter
      if (filter.isTrending !== undefined) {
        filtered = filtered.filter(preset => preset.isTrending === filter.isTrending);
      }

      // Apply tags filter
      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(preset => 
          filter.tags!.some(tag => preset.tags.includes(tag))
        );
      }

      // Apply sorting
      if (filter.sortBy) {
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filter.sortBy) {
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

          if (filter.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      setError(null);
      return filtered;
    } catch (err) {
      setError('Failed to filter presets');
      console.error('Error filtering presets:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Get recent presets data
  const recentPresetsData = useMemo(() => {
    return recentPresets
      .map(recent => {
        const preset = textPresets.find(p => p.id === recent.presetId);
        return preset ? { ...preset, recentUsage: recent } : null;
      })
      .filter(Boolean) as (TextPreset & { recentUsage: RecentPreset })[];
  }, [recentPresets]);

  // Quick filter functions
  const quickFilters = useMemo(() => ({
    trending: () => setFilter(prev => ({ ...prev, isTrending: true })),
    new: () => setFilter(prev => ({ ...prev, isNew: true })),
    premium: () => setFilter(prev => ({ ...prev, isPremium: true })),
    mostUsed: () => setFilter(prev => ({ ...prev, sortBy: 'usage', sortOrder: 'desc' })),
    clear: () => setFilter({})
  }), []);

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<TextPresetFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  // Search presets
  const searchPresetsWithDebounce = useCallback((query: string) => {
    updateFilter({ search: query });
  }, [updateFilter]);

  return {
    // Data
    presets: filteredPresets,
    recentPresets: recentPresetsData,
    totalCount: textPresets.length,
    filteredCount: filteredPresets.length,
    
    // State
    filter,
    loading,
    error,
    
    // Actions
    updateFilter,
    clearFilter,
    searchPresets: searchPresetsWithDebounce,
    addToRecentPresets,
    quickFilters,
    
    // Utilities
    getPresetsByCategory,
    getPresetsByPlatform,
    getTrendingPresets,
    getNewPresets,
    getPremiumPresets
  };
};

export default useTextPresets;