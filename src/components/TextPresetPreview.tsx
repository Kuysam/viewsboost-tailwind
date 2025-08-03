import React, { useState } from 'react';
import { X, Crown, Zap, TrendingUp, Copy, Download, Heart, Share2, Edit3, Palette, Type, Sparkles, Tag, Calendar, BarChart3 } from 'lucide-react';
import { TextPreset } from '../types/textPresets';
import { platformColors } from '../data/textPresets';

interface TextPresetPreviewProps {
  preset: TextPreset;
  onClose: () => void;
  onSelect: (preset: TextPreset) => void;
}

const TextPresetPreview: React.FC<TextPresetPreviewProps> = ({
  preset,
  onClose,
  onSelect
}) => {
  const [customText, setCustomText] = useState(preset.sampleText);
  const [isLiked, setIsLiked] = useState(false);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);

  const handleSelect = () => {
    onSelect(preset);
    onClose();
  };

  const handleCopyCSS = () => {
    const cssProperties = Object.entries(preset.style)
      .filter(([key, value]) => value !== undefined)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `  ${cssKey}: ${value};`;
      })
      .join('\n');

    const cssCode = `.text-preset-${preset.id} {\n${cssProperties}\n}`;
    navigator.clipboard.writeText(cssCode);
  };

  const renderPresetText = () => {
    const style = preset.style;
    const cssStyle: React.CSSProperties = {
      fontFamily: style.fontFamily,
      fontSize: '4rem',
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
      padding: '20px 40px',
      margin: '0',
      WebkitBackgroundClip: style.backgroundImage ? 'text' : 'initial',
      WebkitTextFillColor: style.backgroundImage ? 'transparent' : 'initial',
      position: 'relative',
      zIndex: 1,
      maxWidth: '100%',
      wordBreak: 'break-word'
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
        <div style={cssStyle} className="preset-text-sample">
          {customText}
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
        className="flex items-center gap-2 px-3 py-1 rounded-full text-white font-medium"
        style={{ backgroundColor: color }}
      >
        <div className="w-2 h-2 bg-white rounded-full" />
        {preset.platform.charAt(0).toUpperCase() + preset.platform.slice(1)}
      </div>
    );
  };

  const getStyleProperties = () => {
    const properties = [];
    
    if (preset.style.fontFamily) properties.push({ label: 'Font Family', value: preset.style.fontFamily });
    if (preset.style.fontSize) properties.push({ label: 'Font Size', value: preset.style.fontSize });
    if (preset.style.fontWeight) properties.push({ label: 'Font Weight', value: preset.style.fontWeight });
    if (preset.style.color) properties.push({ label: 'Color', value: preset.style.color });
    if (preset.style.textAlign) properties.push({ label: 'Text Align', value: preset.style.textAlign });
    if (preset.style.textTransform) properties.push({ label: 'Text Transform', value: preset.style.textTransform });
    if (preset.style.letterSpacing) properties.push({ label: 'Letter Spacing', value: preset.style.letterSpacing });
    if (preset.style.lineHeight) properties.push({ label: 'Line Height', value: preset.style.lineHeight });
    if (preset.style.textShadow) properties.push({ label: 'Text Shadow', value: preset.style.textShadow });
    if (preset.style.backgroundColor) properties.push({ label: 'Background Color', value: preset.style.backgroundColor });
    if (preset.style.backgroundImage) properties.push({ label: 'Background Image', value: preset.style.backgroundImage });
    if (preset.style.border) properties.push({ label: 'Border', value: preset.style.border });
    if (preset.style.borderRadius) properties.push({ label: 'Border Radius', value: preset.style.borderRadius });
    if (preset.style.padding) properties.push({ label: 'Padding', value: preset.style.padding });
    
    return properties;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#191a21] rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{preset.name}</h2>
                <div className="flex items-center gap-1">
                  {preset.isPremium && <Crown className="w-5 h-5 text-yellow-400" />}
                  {preset.isNew && <Zap className="w-5 h-5 text-blue-400" />}
                  {preset.isTrending && <TrendingUp className="w-5 h-5 text-green-400" />}
                </div>
              </div>
              {getPlatformBadge()}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Preview Area */}
          <div className="flex-1 p-6">
            <div className="bg-gray-900 rounded-lg p-8 mb-4 min-h-[300px] flex items-center justify-center overflow-hidden">
              {renderPresetText()}
            </div>
            
            {/* Text Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Custom Text
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                placeholder="Enter your text here..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelect}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Use This Preset
              </button>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isLiked ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleCopyCSS}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy CSS
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="w-full lg:w-80 p-6 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white capitalize">{preset.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-white capitalize">{preset.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white">{preset.usageCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{preset.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-yellow-400" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {preset.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Animation */}
              {preset.animation && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Animation
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white capitalize">{preset.animation.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{preset.animation.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Repeat:</span>
                      <span className="text-white">{preset.animation.repeat}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style Properties */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-yellow-400" />
                  Style Properties
                </h3>
                <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                  {getStyleProperties().map((prop, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-400">{prop.label}:</span>
                      <span className="text-white font-mono text-xs truncate ml-2" title={prop.value}>
                        {prop.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                  className="w-full text-left text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  {showCodeSnippet ? 'Hide' : 'Show'} CSS Code
                </button>
                {showCodeSnippet && (
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`.text-preset-${preset.id} {
${Object.entries(preset.style)
  .filter(([key, value]) => value !== undefined)
  .map(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `  ${cssKey}: ${value};`;
  })
  .join('\n')}
}`}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextPresetPreview;