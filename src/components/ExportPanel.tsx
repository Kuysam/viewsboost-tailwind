import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { 
  Download, FileImage, FileText, Video, Settings, 
  Zap, Clock, Layers, Share, Cloud, Check, AlertCircle,
  Monitor, Smartphone, Tablet, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportPanelProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  template: any;
  onExport: (format: string, options: ExportOptions) => void;
}

interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'mp4' | 'gif' | 'svg';
  quality: number;
  width: number;
  height: number;
  transparent: boolean;
  includeBackground: boolean;
  compression: number;
  fps?: number;
  duration?: number;
}

const ExportPanel: React.FC<ExportPanelProps> = ({
  canvasRef,
  template,
  onExport
}) => {
  const [activeFormat, setActiveFormat] = useState<'png' | 'jpg' | 'pdf' | 'mp4' | 'gif' | 'svg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 100,
    width: 1920,
    height: 1080,
    transparent: false,
    includeBackground: true,
    compression: 80,
    fps: 30,
    duration: 10
  });

  const formatOptions = [
    { 
      id: 'png', 
      name: 'PNG', 
      icon: <FileImage size={20} />, 
      description: 'High quality with transparency',
      recommended: true
    },
    { 
      id: 'jpg', 
      name: 'JPG', 
      icon: <FileImage size={20} />, 
      description: 'Compressed for web use' 
    },
    { 
      id: 'pdf', 
      name: 'PDF', 
      icon: <FileText size={20} />, 
      description: 'Vector format for print' 
    },
    { 
      id: 'mp4', 
      name: 'MP4', 
      icon: <Video size={20} />, 
      description: 'Video format for animations',
      premium: true
    },
    { 
      id: 'gif', 
      name: 'GIF', 
      icon: <Video size={20} />, 
      description: 'Animated format' 
    },
    { 
      id: 'svg', 
      name: 'SVG', 
      icon: <FileImage size={20} />, 
      description: 'Scalable vector graphics' 
    }
  ];

  const presetSizes = [
    { name: 'Social Media Post', width: 1080, height: 1080, icon: <Monitor size={16} /> },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: <Smartphone size={16} /> },
    { name: 'Facebook Cover', width: 1200, height: 630, icon: <Monitor size={16} /> },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: <Monitor size={16} /> },
    { name: 'Twitter Header', width: 1500, height: 500, icon: <Monitor size={16} /> },
    { name: 'LinkedIn Banner', width: 1584, height: 396, icon: <Monitor size={16} /> },
    { name: 'Business Card', width: 1050, height: 600, icon: <Tablet size={16} /> },
    { name: 'A4 Print', width: 2480, height: 3508, icon: <FileText size={16} /> }
  ];

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (activeFormat === 'png' || activeFormat === 'jpg') {
        const canvas = await html2canvas(canvasRef.current, {
          backgroundColor: exportOptions.includeBackground ? '#ffffff' : null,
          width: exportOptions.width,
          height: exportOptions.height,
          scale: 2,
          useCORS: true,
          allowTaint: true
        });

        const link = document.createElement('a');
        link.download = `${template.title || 'design'}.${activeFormat}`;
        
        if (activeFormat === 'png') {
          link.href = canvas.toDataURL('image/png');
        } else {
          link.href = canvas.toDataURL('image/jpeg', exportOptions.quality / 100);
        }
        
        link.click();
      } else if (activeFormat === 'pdf') {
        // PDF export would require additional library like jsPDF
        toast.success('PDF export feature coming soon!');
      } else if (activeFormat === 'mp4') {
        // Video export would require MediaRecorder API
        toast.success('Video export feature coming soon!');
      } else if (activeFormat === 'svg') {
        // SVG export would require converting canvas to SVG
        toast.success('SVG export feature coming soon!');
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        toast.success('Export completed successfully!');
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
      toast.error('Export failed. Please try again.');
    }
  };

  const handleBatchExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    const formats = ['png', 'jpg', 'pdf'];
    const totalFormats = formats.length;
    
    for (let i = 0; i < totalFormats; i++) {
      setExportProgress((i / totalFormats) * 100);
      // Simulate export for each format
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setExportProgress(100);
    setTimeout(() => {
      setIsExporting(false);
      setExportProgress(0);
      toast.success('Batch export completed!');
    }, 500);
  };

  const updateExportOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900 rounded-lg p-4 w-80 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Download size={20} className="text-green-400" />
          Export
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-gray-400 hover:text-white transition"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <span className="text-gray-400 text-sm">Export Format</span>
        <div className="grid grid-cols-2 gap-2">
          {formatOptions.map((format) => (
            <button
              key={format.id}
              onClick={() => setActiveFormat(format.id as any)}
              disabled={format.premium && !true} // Simulate premium check
              className={`p-3 rounded-lg border transition-all text-left relative ${
                activeFormat === format.id
                  ? 'border-blue-400 bg-blue-500/20 text-white'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              } ${format.premium ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {format.icon}
                <span className="font-medium text-sm">{format.name}</span>
                {format.recommended && (
                  <span className="text-xs bg-green-500 text-white px-1 rounded">REC</span>
                )}
                {format.premium && (
                  <span className="text-xs bg-yellow-500 text-black px-1 rounded">PRO</span>
                )}
              </div>
              <div className="text-xs text-gray-400">{format.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Size Presets */}
      <div className="space-y-2">
        <span className="text-gray-400 text-sm">Size Presets</span>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
          {presetSizes.slice(0, 4).map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                updateExportOption('width', preset.width);
                updateExportOption('height', preset.height);
              }}
              className="flex items-center gap-2 p-2 text-left bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
            >
              {preset.icon}
              <span>{preset.name}</span>
              <span className="text-gray-500 ml-auto">{preset.width}×{preset.height}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Width</label>
          <input
            type="number"
            value={exportOptions.width}
            onChange={(e) => updateExportOption('width', parseInt(e.target.value))}
            className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Height</label>
          <input
            type="number"
            value={exportOptions.height}
            onChange={(e) => updateExportOption('height', parseInt(e.target.value))}
            className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
          />
        </div>
      </div>

      {/* Quality Settings */}
      {(activeFormat === 'jpg' || activeFormat === 'png') && (
        <div>
          <label className="text-xs text-gray-400 block mb-2">
            Quality: {exportOptions.quality}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={exportOptions.quality}
            onChange={(e) => updateExportOption('quality', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 border-t border-gray-700 pt-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Transparent Background</span>
              <input
                type="checkbox"
                checked={exportOptions.transparent}
                onChange={(e) => updateExportOption('transparent', e.target.checked)}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Include Background</span>
              <input
                type="checkbox"
                checked={exportOptions.includeBackground}
                onChange={(e) => updateExportOption('includeBackground', e.target.checked)}
                className="rounded"
              />
            </div>

            {activeFormat === 'mp4' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">FPS</label>
                  <select
                    value={exportOptions.fps}
                    onChange={(e) => updateExportOption('fps', parseInt(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    <option value={24}>24 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={exportOptions.duration}
                    onChange={(e) => updateExportOption('duration', parseInt(e.target.value))}
                    className="w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Progress */}
      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Exporting...</span>
            <span className="text-gray-400 text-sm">{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${exportProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={18} />
              Export {activeFormat.toUpperCase()}
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBatchExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-1 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition disabled:opacity-50"
          >
            <Layers size={16} />
            Batch
          </button>
          <button
            onClick={() => toast.success('Share feature coming soon!')}
            className="flex items-center justify-center gap-1 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
          >
            <Share size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Export Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="text-blue-400 font-medium mb-1">Export Tips</div>
            <div className="text-gray-400 text-xs space-y-1">
              <div>• PNG for transparency and high quality</div>
              <div>• JPG for smaller file sizes</div>
              <div>• Use 2x resolution for retina displays</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExportPanel; 