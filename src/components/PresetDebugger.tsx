import React, { useState } from 'react';
import { textPresets } from '../data/textPresets';
import { generateCompletePresetCollection } from '../data/extendedTextPresets';

const PresetDebugger: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 left-4 bg-red-500 text-white px-3 py-2 rounded text-xs z-50"
      >
        Debug Presets
      </button>
    );
  }

  const allPresets = generateCompletePresetCollection();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Preset Debug Information</h2>
        
        <div className="space-y-4">
          <div>
            <strong>Total Presets Loaded:</strong> {allPresets.length}
          </div>
          
          <div>
            <strong>Sample Presets:</strong>
            <ul className="mt-2 space-y-1">
              {allPresets.slice(0, 10).map(preset => (
                <li key={preset.id} className="text-sm">
                  {preset.name} ({preset.category}) - {preset.platform}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <strong>Categories Found:</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(new Set(allPresets.map(p => p.category))).map(cat => (
                <span key={cat} className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {cat} ({allPresets.filter(p => p.category === cat).length})
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <strong>Platforms Found:</strong>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(new Set(allPresets.map(p => p.platform))).map(platform => (
                <span key={platform} className="bg-blue-200 px-2 py-1 rounded text-xs">
                  {platform} ({allPresets.filter(p => p.platform === platform).length})
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowDebug(false)}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PresetDebugger;