import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCw, Zap, Clock, Layers, Settings, 
  ChevronDown, ChevronRight, Eye, EyeOff 
} from 'lucide-react';

interface AnimationControlsProps {
  selectedElementId: string | null;
  onApplyAnimation: (elementId: string, animation: Animation) => void;
}

interface Animation {
  type: 'entrance' | 'emphasis' | 'exit';
  name: string;
  duration: number;
  delay: number;
  easing: string;
  direction?: string;
  intensity?: number;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  selectedElementId,
  onApplyAnimation
}) => {
  const [activeTab, setActiveTab] = useState<'entrance' | 'emphasis' | 'exit'>('entrance');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const animationPresets = {
    entrance: [
      { name: 'Fade In', duration: 0.5, delay: 0, easing: 'ease-out' },
      { name: 'Slide In Left', duration: 0.6, delay: 0, easing: 'ease-out', direction: 'left' },
      { name: 'Slide In Right', duration: 0.6, delay: 0, easing: 'ease-out', direction: 'right' },
      { name: 'Zoom In', duration: 0.5, delay: 0, easing: 'ease-out' },
      { name: 'Bounce In', duration: 0.8, delay: 0, easing: 'ease-out' },
      { name: 'Rotate In', duration: 0.6, delay: 0, easing: 'ease-out' }
    ],
    emphasis: [
      { name: 'Pulse', duration: 0.3, delay: 0, easing: 'ease-in-out' },
      { name: 'Shake', duration: 0.5, delay: 0, easing: 'ease-in-out' },
      { name: 'Wobble', duration: 0.8, delay: 0, easing: 'ease-in-out' },
      { name: 'Flash', duration: 0.4, delay: 0, easing: 'ease-in-out' },
      { name: 'Bounce', duration: 0.6, delay: 0, easing: 'ease-out' },
      { name: 'Heartbeat', duration: 1.0, delay: 0, easing: 'ease-in-out' }
    ],
    exit: [
      { name: 'Fade Out', duration: 0.5, delay: 0, easing: 'ease-in' },
      { name: 'Slide Out Left', duration: 0.6, delay: 0, easing: 'ease-in', direction: 'left' },
      { name: 'Slide Out Right', duration: 0.6, delay: 0, easing: 'ease-in', direction: 'right' },
      { name: 'Zoom Out', duration: 0.5, delay: 0, easing: 'ease-in' },
      { name: 'Rotate Out', duration: 0.6, delay: 0, easing: 'ease-in' }
    ]
  };

  const easingOptions = [
    'ease', 'ease-in', 'ease-out', 'ease-in-out',
    'linear', 'ease-in-quad', 'ease-out-quad', 'ease-in-out-quad',
    'ease-in-cubic', 'ease-out-cubic', 'ease-in-out-cubic'
  ];

  const handleAnimationSelect = (animation: any) => {
    const fullAnimation: Animation = {
      type: activeTab,
      ...animation
    };
    setSelectedAnimation(fullAnimation);
  };

  const handleApplyAnimation = () => {
    if (selectedElementId && selectedAnimation) {
      onApplyAnimation(selectedElementId, selectedAnimation);
    }
  };

  const playPreview = (animation: any) => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), animation.duration * 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Animations
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-gray-400 hover:text-white transition"
        >
          <Settings size={16} />
        </button>
      </div>

      <div className="flex bg-gray-800 rounded-lg p-1">
        {(['entrance', 'emphasis', 'exit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {animationPresets[activeTab].map((animation, index) => (
          <motion.button
            key={animation.name}
            onClick={() => handleAnimationSelect(animation)}
            onDoubleClick={() => playPreview(animation)}
            className={`p-3 rounded-lg border transition-all text-left ${
              selectedAnimation?.name === animation.name
                ? 'border-blue-400 bg-blue-500/20 text-white'
                : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="font-medium text-sm">{animation.name}</div>
            <div className="text-xs text-gray-400">
              {animation.duration}s • {animation.easing}
            </div>
          </motion.button>
        ))}
      </div>

      {selectedAnimation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-700 pt-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{selectedAnimation.name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => playPreview(selectedAnimation)}
                className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={handleApplyAnimation}
                disabled={!selectedElementId}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Duration</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedAnimation.duration}
                onChange={(e) => setSelectedAnimation({
                  ...selectedAnimation,
                  duration: parseFloat(e.target.value)
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{selectedAnimation.duration}s</span>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Delay</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={selectedAnimation.delay}
                onChange={(e) => setSelectedAnimation({
                  ...selectedAnimation,
                  delay: parseFloat(e.target.value)
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{selectedAnimation.delay}s</span>
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Easing</label>
                  <select
                    value={selectedAnimation.easing}
                    onChange={(e) => setSelectedAnimation({
                      ...selectedAnimation,
                      easing: e.target.value
                    })}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    {easingOptions.map(easing => (
                      <option key={easing} value={easing}>{easing}</option>
                    ))}
                  </select>
                </div>

                {selectedAnimation.direction && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Direction</label>
                    <select
                      value={selectedAnimation.direction}
                      onChange={(e) => setSelectedAnimation({
                        ...selectedAnimation,
                        direction: e.target.value
                      })}
                      className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Intensity</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={selectedAnimation.intensity || 5}
                    onChange={(e) => setSelectedAnimation({
                      ...selectedAnimation,
                      intensity: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-400">{selectedAnimation.intensity || 5}/10</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Animation Timeline</span>
              <button className="text-gray-400 hover:text-white">
                <Clock size={14} />
              </button>
            </div>
            <div className="h-8 bg-gray-800 rounded relative">
              {selectedAnimation && (
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                  style={{
                    width: `${(selectedAnimation.duration / 3) * 100}%`,
                    marginLeft: `${(selectedAnimation.delay / 3) * 100}%`
                  }}
                  layout
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimationControls; 