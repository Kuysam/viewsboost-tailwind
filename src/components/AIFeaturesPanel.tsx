import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wand2, Scissors, Crop, Image, Type, 
  Brain, Zap, Magic, Target, Eye, Palette, 
  ChevronRight, Clock, Check, AlertCircle, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIFeaturesPanelProps {
  selectedElement: any;
  onApplyAI: (feature: string, options: any) => void;
  onClose: () => void;
}

const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({
  selectedElement,
  onApplyAI,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<'enhance' | 'generate' | 'edit' | 'smart'>('enhance');
  const [processingFeature, setProcessingFeature] = useState<string | null>(null);
  const [aiCredits, setAiCredits] = useState(45);

  const aiFeatures = {
    enhance: [
      {
        id: 'bg-remove',
        name: 'Remove Background',
        description: 'Automatically remove background from images',
        icon: <Scissors size={20} />,
        credits: 1,
        premium: false,
        processing: 'Analyzing image and removing background...',
        color: 'text-green-400'
      },
      {
        id: 'smart-crop',
        name: 'Smart Crop',
        description: 'AI-powered intelligent cropping',
        icon: <Crop size={20} />,
        credits: 1,
        premium: false,
        processing: 'Detecting optimal crop regions...',
        color: 'text-blue-400'
      },
      {
        id: 'auto-enhance',
        name: 'Auto Enhance',
        description: 'Automatically improve image quality',
        icon: <Sparkles size={20} />,
        credits: 1,
        premium: false,
        processing: 'Enhancing image quality...',
        color: 'text-purple-400'
      },
      {
        id: 'upscale',
        name: 'AI Upscale',
        description: 'Increase image resolution with AI',
        icon: <Target size={20} />,
        credits: 2,
        premium: true,
        processing: 'Upscaling image with AI...',
        color: 'text-orange-400'
      },
      {
        id: 'color-enhance',
        name: 'Color Enhancement',
        description: 'AI-powered color correction',
        icon: <Palette size={20} />,
        credits: 1,
        premium: false,
        processing: 'Analyzing and enhancing colors...',
        color: 'text-pink-400'
      },
      {
        id: 'noise-reduction',
        name: 'Noise Reduction',
        description: 'Remove noise and grain from images',
        icon: <Eye size={20} />,
        credits: 1,
        premium: true,
        processing: 'Reducing image noise...',
        color: 'text-cyan-400'
      }
    ],
    generate: [
      {
        id: 'text-to-image',
        name: 'Text to Image',
        description: 'Generate images from text prompts',
        icon: <Image size={20} />,
        credits: 3,
        premium: true,
        processing: 'Generating image from prompt...',
        color: 'text-red-400'
      },
      {
        id: 'style-transfer',
        name: 'Style Transfer',
        description: 'Apply artistic styles to images',
        icon: <Wand2 size={20} />,
        credits: 2,
        premium: true,
        processing: 'Applying style transfer...',
        color: 'text-yellow-400'
      },
      {
        id: 'bg-generator',
        name: 'Background Generator',
        description: 'Generate backgrounds with AI',
        icon: <Brain size={20} />,
        credits: 2,
        premium: true,
        processing: 'Generating background...',
        color: 'text-indigo-400'
      },
      {
        id: 'text-generator',
        name: 'Smart Text',
        description: 'Generate headlines and copy',
        icon: <Type size={20} />,
        credits: 1,
        premium: false,
        processing: 'Generating text content...',
        color: 'text-green-400'
      }
    ],
    edit: [
      {
        id: 'object-remove',
        name: 'Object Removal',
        description: 'Remove unwanted objects from images',
        icon: <Magic size={20} />,
        credits: 2,
        premium: true,
        processing: 'Removing selected objects...',
        color: 'text-red-400'
      },
      {
        id: 'sky-replace',
        name: 'Sky Replacement',
        description: 'Replace sky in landscape photos',
        icon: <Eye size={20} />,
        credits: 2,
        premium: true,
        processing: 'Replacing sky in image...',
        color: 'text-blue-400'
      },
      {
        id: 'face-enhance',
        name: 'Face Enhancement',
        description: 'Enhance portraits automatically',
        icon: <Sparkles size={20} />,
        credits: 2,
        premium: true,
        processing: 'Enhancing facial features...',
        color: 'text-pink-400'
      }
    ],
    smart: [
      {
        id: 'smart-resize',
        name: 'Smart Resize',
        description: 'Intelligently resize for different formats',
        icon: <Target size={20} />,
        credits: 1,
        premium: false,
        processing: 'Smart resizing content...',
        color: 'text-green-400'
      },
      {
        id: 'auto-tag',
        name: 'Auto Tagging',
        description: 'Generate relevant tags and keywords',
        icon: <Brain size={20} />,
        credits: 1,
        premium: false,
        processing: 'Analyzing and generating tags...',
        color: 'text-blue-400'
      },
      {
        id: 'content-aware',
        name: 'Content-Aware Fill',
        description: 'Fill areas based on surrounding content',
        icon: <Zap size={20} />,
        credits: 2,
        premium: true,
        processing: 'Analyzing content and filling...',
        color: 'text-purple-400'
      }
    ]
  };

  const categories = [
    { id: 'enhance', name: 'Enhance', icon: <Sparkles size={16} /> },
    { id: 'generate', name: 'Generate', icon: <Brain size={16} /> },
    { id: 'edit', name: 'Edit', icon: <Magic size={16} /> },
    { id: 'smart', name: 'Smart Tools', icon: <Zap size={16} /> }
  ];

  const handleFeatureApply = async (feature: any) => {
    if (feature.credits > aiCredits) {
      toast.error('Not enough AI credits!');
      return;
    }

    if (feature.premium && !true) { // Simulate premium check
      toast.error('This feature requires a premium subscription!');
      return;
    }

    setProcessingFeature(feature.id);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    setAiCredits(prev => prev - feature.credits);
    setProcessingFeature(null);
    onApplyAI(feature.id, { feature });
    toast.success(`${feature.name} applied successfully!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto shadow-2xl"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">AI Features</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Credits: {aiCredits}</span>
                <button className="text-blue-400 hover:text-blue-300">
                  Get More
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>

        {/* Feature List */}
        <div className="space-y-3">
          {aiFeatures[activeCategory].map((feature) => (
            <motion.div
              key={feature.id}
              className="relative bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800 transition border border-gray-700"
              whileHover={{ scale: 1.02 }}
              layout
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 bg-gray-700 rounded-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{feature.name}</h3>
                    <div className="flex items-center gap-1">
                      {feature.credits > 0 && (
                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {feature.credits} credit{feature.credits > 1 ? 's' : ''}
                        </span>
                      )}
                      {feature.premium && (
                        <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded flex items-center gap-1">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{feature.description}</p>
                  
                  {processingFeature === feature.id ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-400 text-sm">{feature.processing}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFeatureApply(feature)}
                      disabled={feature.credits > aiCredits || processingFeature !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Apply</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="text-blue-400 font-medium mb-1">AI Processing Info</div>
              <div className="text-gray-400 space-y-1 text-xs">
                <div>• Processing times vary based on image complexity</div>
                <div>• Premium features require subscription</div>
                <div>• Credits refill daily or can be purchased</div>
                <div>• All processing happens securely in the cloud</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => toast.success('Tutorials coming soon!')}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
          >
            View Tutorials
          </button>
          <button
            onClick={() => toast.success('Upgrade panel coming soon!')}
            className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
          >
            Upgrade to Pro
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIFeaturesPanel; 