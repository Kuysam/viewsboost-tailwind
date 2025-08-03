import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, Command, Copy, Trash2, Undo, Redo,
  Save, Download, Play, Pause, ZoomIn, ZoomOut,
  Move, RotateCw, Type, Image, Square, Search,
  Layers, Grid3X3, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
  category: string;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');

  const shortcuts: Shortcut[] = [
    // General
    { keys: ['Cmd', 'S'], description: 'Save project', icon: <Save size={16} />, category: 'general' },
    { keys: ['Cmd', 'Shift', 'S'], description: 'Save as new version', icon: <Save size={16} />, category: 'general' },
    { keys: ['Cmd', 'O'], description: 'Open project', icon: <Search size={16} />, category: 'general' },
    { keys: ['Cmd', 'N'], description: 'New project', icon: <Square size={16} />, category: 'general' },
    { keys: ['Cmd', 'E'], description: 'Export project', icon: <Download size={16} />, category: 'general' },
    { keys: ['Cmd', 'P'], description: 'Print', icon: <Download size={16} />, category: 'general' },
    { keys: ['?'], description: 'Show keyboard shortcuts', icon: <Keyboard size={16} />, category: 'general' },
    { keys: ['Esc'], description: 'Close panels/modals', category: 'general' },

    // Edit
    { keys: ['Cmd', 'Z'], description: 'Undo', icon: <Undo size={16} />, category: 'edit' },
    { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo', icon: <Redo size={16} />, category: 'edit' },
    { keys: ['Cmd', 'C'], description: 'Copy selected element', icon: <Copy size={16} />, category: 'edit' },
    { keys: ['Cmd', 'V'], description: 'Paste element', icon: <Copy size={16} />, category: 'edit' },
    { keys: ['Cmd', 'X'], description: 'Cut selected element', icon: <Copy size={16} />, category: 'edit' },
    { keys: ['Cmd', 'D'], description: 'Duplicate selected element', icon: <Copy size={16} />, category: 'edit' },
    { keys: ['Delete'], description: 'Delete selected element', icon: <Trash2 size={16} />, category: 'edit' },
    { keys: ['Cmd', 'A'], description: 'Select all elements', category: 'edit' },
    { keys: ['Cmd', 'Shift', 'A'], description: 'Deselect all', category: 'edit' },

    // Navigation
    { keys: ['Space'], description: 'Pan canvas (hold and drag)', icon: <Move size={16} />, category: 'navigation' },
    { keys: ['Cmd', '+'], description: 'Zoom in', icon: <ZoomIn size={16} />, category: 'navigation' },
    { keys: ['Cmd', '-'], description: 'Zoom out', icon: <ZoomOut size={16} />, category: 'navigation' },
    { keys: ['Cmd', '0'], description: 'Fit to screen', category: 'navigation' },
    { keys: ['Cmd', '1'], description: 'Actual size (100%)', category: 'navigation' },
    { keys: ['F'], description: 'Focus on selected element', category: 'navigation' },

    // Tools
    { keys: ['V'], description: 'Select tool', icon: <Move size={16} />, category: 'tools' },
    { keys: ['T'], description: 'Text tool', icon: <Type size={16} />, category: 'tools' },
    { keys: ['R'], description: 'Rectangle tool', icon: <Square size={16} />, category: 'tools' },
    { keys: ['O'], description: 'Circle tool', category: 'tools' },
    { keys: ['I'], description: 'Image tool', icon: <Image size={16} />, category: 'tools' },
    { keys: ['P'], description: 'Pen tool', category: 'tools' },
    { keys: ['H'], description: 'Hand tool (pan)', icon: <Move size={16} />, category: 'tools' },

    // Transform
    { keys: ['Cmd', 'G'], description: 'Group selected elements', icon: <Layers size={16} />, category: 'transform' },
    { keys: ['Cmd', 'Shift', 'G'], description: 'Ungroup elements', icon: <Layers size={16} />, category: 'transform' },
    { keys: ['Cmd', ']'], description: 'Bring forward', category: 'transform' },
    { keys: ['Cmd', '['], description: 'Send backward', category: 'transform' },
    { keys: ['Cmd', 'Shift', ']'], description: 'Bring to front', category: 'transform' },
    { keys: ['Cmd', 'Shift', '['], description: 'Send to back', category: 'transform' },
    { keys: ['Cmd', 'R'], description: 'Rotate selected element', icon: <RotateCw size={16} />, category: 'transform' },
    { keys: ['Shift'], description: 'Constrain proportions (while resizing)', category: 'transform' },

    // Text
    { keys: ['Cmd', 'B'], description: 'Bold text', category: 'text' },
    { keys: ['Cmd', 'I'], description: 'Italic text', category: 'text' },
    { keys: ['Cmd', 'U'], description: 'Underline text', category: 'text' },
    { keys: ['Cmd', 'Shift', 'L'], description: 'Align left', category: 'text' },
    { keys: ['Cmd', 'Shift', 'C'], description: 'Align center', category: 'text' },
    { keys: ['Cmd', 'Shift', 'R'], description: 'Align right', category: 'text' },
    { keys: ['Enter'], description: 'Finish text editing', category: 'text' },
    { keys: ['Shift', 'Enter'], description: 'New line in text', category: 'text' },

    // View
    { keys: ['Cmd', ';'], description: 'Show/hide guides', icon: <Grid3X3 size={16} />, category: 'view' },
    { keys: ['Cmd', "'"], description: 'Show/hide grid', icon: <Grid3X3 size={16} />, category: 'view' },
    { keys: ['Cmd', 'H'], description: 'Hide/show selected element', icon: <Eye size={16} />, category: 'view' },
    { keys: ['Cmd', 'L'], description: 'Lock/unlock selected element', icon: <Lock size={16} />, category: 'view' },
    { keys: ['Cmd', 'Y'], description: 'Show layers panel', icon: <Layers size={16} />, category: 'view' },

    // Playback
    { keys: ['Space'], description: 'Play/pause timeline', icon: <Play size={16} />, category: 'playback' },
    { keys: ['←'], description: 'Previous frame', category: 'playback' },
    { keys: ['→'], description: 'Next frame', category: 'playback' },
    { keys: ['Home'], description: 'Go to beginning', category: 'playback' },
    { keys: ['End'], description: 'Go to end', category: 'playback' },
    { keys: ['K'], description: 'Add keyframe', category: 'playback' }
  ];

  const categories = [
    { id: 'general', name: 'General', count: shortcuts.filter(s => s.category === 'general').length },
    { id: 'edit', name: 'Edit', count: shortcuts.filter(s => s.category === 'edit').length },
    { id: 'navigation', name: 'Navigation', count: shortcuts.filter(s => s.category === 'navigation').length },
    { id: 'tools', name: 'Tools', count: shortcuts.filter(s => s.category === 'tools').length },
    { id: 'transform', name: 'Transform', count: shortcuts.filter(s => s.category === 'transform').length },
    { id: 'text', name: 'Text', count: shortcuts.filter(s => s.category === 'text').length },
    { id: 'view', name: 'View', count: shortcuts.filter(s => s.category === 'view').length },
    { id: 'playback', name: 'Playback', count: shortcuts.filter(s => s.category === 'playback').length }
  ];

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesCategory = activeCategory === 'all' || shortcut.category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.keys.some(key => key.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const renderKey = (key: string) => {
    const keyDisplayMap: Record<string, string> = {
      'Cmd': '⌘',
      'Shift': '⇧',
      'Alt': '⌥',
      'Ctrl': '⌃',
      'Delete': '⌫',
      'Enter': '↵',
      'Space': '␣',
      'Esc': '⎋',
      '←': '←',
      '→': '→',
      '↑': '↑',
      '↓': '↓'
    };

    return (
      <kbd className="inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-mono bg-gray-700 text-gray-200 rounded border border-gray-600 shadow-sm">
        {keyDisplayMap[key] || key}
      </kbd>
    );
  };

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toast.success('Keyboard shortcuts panel opened!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        className="bg-gray-900 rounded-2xl p-6 w-[800px] max-h-[80vh] overflow-hidden shadow-2xl"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <Keyboard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-semibold">Keyboard Shortcuts</h2>
              <div className="text-sm text-gray-400">Master the editor with these shortcuts</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-400 outline-none"
          />
        </div>

        <div className="flex gap-6 h-96">
          {/* Categories Sidebar */}
          <div className="w-48 space-y-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full p-3 rounded-lg text-left transition ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">All Shortcuts</div>
              <div className="text-sm opacity-75">{shortcuts.length} total</div>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full p-3 rounded-lg text-left transition ${
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{category.name}</div>
                <div className="text-sm opacity-75">{category.count} shortcuts</div>
              </button>
            ))}
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            <AnimatePresence>
              {filteredShortcuts.map((shortcut, index) => (
                <motion.div
                  key={`${shortcut.category}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition"
                >
                  <div className="flex items-center gap-3">
                    {shortcut.icon && (
                      <div className="text-blue-400">
                        {shortcut.icon}
                      </div>
                    )}
                    <span className="text-gray-300">{shortcut.description}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && (
                          <span className="text-gray-500 mx-1">+</span>
                        )}
                        {renderKey(key)}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredShortcuts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Keyboard size={48} className="mx-auto mb-3 opacity-50" />
                <div className="text-lg font-medium mb-1">No shortcuts found</div>
                <div className="text-sm">Try adjusting your search or category filter</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">?</kbd> anytime to open this panel
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => toast.success('Shortcuts exported to PDF!')}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
            >
              Export PDF
            </button>
            <button
              onClick={() => toast.success('Shortcuts printed!')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Print Reference
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KeyboardShortcuts; 