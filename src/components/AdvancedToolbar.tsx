import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Palette, Download, Share, Settings, 
  Layers, Magic, Sparkles, Filter, Target,
  Grid3X3, Move3D, RotateCw, Copy, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdvancedToolbarProps {
  selectedElementId: string | null;
  onAnimationClick: () => void;
  onColorClick: () => void;
  onExportClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const AdvancedToolbar: React.FC<AdvancedToolbarProps> = ({
  selectedElementId,
  onAnimationClick,
  onColorClick,
  onExportClick,
  onDuplicate,
  onDelete
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const tools = [
    {
      id: 'animation',
      icon: <Zap size={20} />,
      label: 'Animations',
      color: 'text-yellow-400',
      onClick: onAnimationClick,
      premium: false
    },
    {
      id: 'color',
      icon: <Palette size={20} />,
      label: 'Colors & Gradients',
      color: 'text-blue-400',
      onClick: onColorClick,
      premium: false
    },
    {
      id: 'ai-magic',
      icon: <Sparkles size={20} />,
      label: 'AI Magic',
      color: 'text-purple-400',
      onClick: () => toast.success('AI features coming soon!'),
      premium: true
    },
    {
      id: 'filters',
      icon: <Filter size={20} />,
      label: 'Filters & Effects',
      color: 'text-green-400',
      onClick: () => toast.success('Filter panel coming soon!'),
      premium: false
    },
    {
      id: 'transform',
      icon: <Move3D size={20} />,
      label: '3D Transform',
      color: 'text-red-400',
      onClick: () => toast.success('3D transforms coming soon!'),
      premium: true
    },
    {
      id: 'grid',
      icon: <Grid3X3 size={20} />,
      label: 'Grid & Alignment',
      color: 'text-cyan-400',
      onClick: () => toast.success('Grid tools activated!'),
      premium: false
    }
  ];

  const elementTools = [
    {
      id: 'duplicate',
      icon: <Copy size={18} />,
      label: 'Duplicate',
      color: 'text-blue-400',
      onClick: onDuplicate
    },
    {
      id: 'rotate',
      icon: <RotateCw size={18} />,
      label: 'Rotate',
      color: 'text-green-400',
      onClick: () => toast.success('Rotate tool activated!')
    },
    {
      id: 'delete',
      icon: <Trash2 size={18} />,
      label: 'Delete',
      color: 'text-red-400',
      onClick: onDelete
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
    >
      {/* Main Toolbar */}
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          {tools.map((tool) => (
            <motion.button
              key={tool.id}
              onClick={tool.onClick}
              onMouseEnter={() => setShowTooltip(tool.id)}
              onMouseLeave={() => setShowTooltip(null)}
              className="relative p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700 transition-all group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={tool.color}>{tool.icon}</span>
              
              {tool.premium && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">★</span>
                </div>
              )}

              <AnimatePresence>
                {showTooltip === tool.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                              bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                  >
                    {tool.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                                   w-0 h-0 border-l-4 border-r-4 border-t-4 
                                   border-transparent border-t-black"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}

          {/* Separator */}
          <div className="w-px h-8 bg-gray-600 mx-2"></div>

          {/* Export Button */}
          <motion.button
            onClick={onExportClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                       transition-all flex items-center gap-2 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={18} />
            Export
          </motion.button>
        </div>
      </div>

      {/* Element-specific toolbar */}
      <AnimatePresence>
        {selectedElementId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3 bg-gray-900/95 backdrop-blur-sm border border-gray-700 
                       rounded-xl px-3 py-2 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm mr-2">Element:</span>
              {elementTools.map((tool) => (
                <motion.button
                  key={tool.id}
                  onClick={tool.onClick}
                  onMouseEnter={() => setShowTooltip(`element-${tool.id}`)}
                  onMouseLeave={() => setShowTooltip(null)}
                  className="relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={tool.color}>{tool.icon}</span>
                  
                  <AnimatePresence>
                    {showTooltip === `element-${tool.id}` && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                                  bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                      >
                        {tool.label}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                                       w-0 h-0 border-l-4 border-r-4 border-t-4 
                                       border-transparent border-t-black"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdvancedToolbar; 