import React from 'react';
import { Crown, Zap, TrendingUp, Eye, Heart, Copy, MoreVertical } from 'lucide-react';
import { TextPreset } from '../types/textPresets';
import { platformColors } from '../data/textPresets';

interface TextPresetCardProps {
  preset: TextPreset;
  onSelect: (preset: TextPreset) => void;
  onPreview: (preset: TextPreset) => void;
  viewMode: 'grid' | 'list';
}

const TextPresetCard: React.FC<TextPresetCardProps> = ({
  preset,
  onSelect,
  onPreview,
  viewMode
}) => {
  const handleClick = () => {
    onSelect(preset);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(preset);
  };

  const renderPresetText = () => {
    const style = preset.style;
    const cssStyle: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: viewMode === 'grid' ? '1.5rem' : '1rem',
      fontWeight: style.fontWeight,
      color: style.color,
      textAlign: style.textAlign,
      textTransform: style.textTransform as any,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      textShadow: style.textShadow,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      border: style.border,
      borderRadius: style.borderRadius,
      padding: viewMode === 'grid' ? '8px 12px' : '4px 8px',
      margin: '0',
      WebkitBackgroundClip: style.backgroundImage ? 'text' : 'initial',
      WebkitTextFillColor: style.backgroundImage ? 'transparent' : 'initial',
      position: 'relative',
      zIndex: 1
    };

    // Apply outline if defined
    if (style.outline) {
      cssStyle.WebkitTextStroke = `${style.outline.width} ${style.outline.color}`;
    }

    // Apply transform if defined
    if (style.transform) {
      cssStyle.transform = `rotate(${style.transform.rotate || 0}deg) scale(${style.transform.scale || 1}) skew(${style.transform.skew || 0}deg)`;
    }

    // Apply filter if defined
    if (style.filter) {
      cssStyle.filter = `blur(${style.filter.blur || 0}px) brightness(${style.filter.brightness || 1}) contrast(${style.filter.contrast || 1}) saturate(${style.filter.saturate || 1})`;
    }

    return (
      <div className="preset-text-container relative overflow-hidden">
        <div style={cssStyle} className="preset-text-sample whitespace-nowrap">
          {preset.sampleText}
        </div>
        
        {/* Glow effect */}
        {style.glow && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${style.glow.color}${Math.floor(style.glow.intensity * 25.5).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              filter: `blur(${style.glow.blur}px)`,
              zIndex: -1
            }}
          />
        )}
      </div>
    );
  };

  const getPlatformBadge = () => {
    const color = platformColors[preset.platform] || '#6c757d';
    return (
      <div
        className="text-xs px-2 py-1 rounded-full text-white font-medium"
        style={{ backgroundColor: color }}
      >
        {preset.platform.charAt(0).toUpperCase() + preset.platform.slice(1)}
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleClick}
        className="group flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-gray-700 hover:border-yellow-400/50"
      >
        {/* Preview */}
        <div className="flex-shrink-0 w-20 h-12 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
          {renderPresetText()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium text-sm truncate">{preset.name}</h3>
            <div className="flex items-center gap-1">
              {preset.isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
              {preset.isNew && <Zap className="w-3 h-3 text-blue-400" />}
              {preset.isTrending && <TrendingUp className="w-3 h-3 text-green-400" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getPlatformBadge()}
            <span className="text-xs text-gray-400 capitalize">{preset.category}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePreviewClick}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:scale-[1.02] border border-gray-700 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {preset.isPremium && <Crown className="w-4 h-4 text-yellow-400" />}
          {preset.isNew && <Zap className="w-4 h-4 text-blue-400" />}
          {preset.isTrending && <TrendingUp className="w-4 h-4 text-green-400" />}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handlePreviewClick}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-gray-900 rounded-lg p-4 mb-3 min-h-[80px] flex items-center justify-center overflow-hidden">
        {renderPresetText()}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h3 className="text-white font-medium text-sm truncate">{preset.name}</h3>
        <div className="flex items-center justify-between">
          {getPlatformBadge()}
          <span className="text-xs text-gray-400 capitalize">{preset.category}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{preset.usageCount.toLocaleString()} uses</span>
          <span>{preset.tags.length} tags</span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
    </div>
  );
};

export default TextPresetCard;