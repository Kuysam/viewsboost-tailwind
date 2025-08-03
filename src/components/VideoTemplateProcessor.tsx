import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileDetector, FileFormat } from '../lib/converters/core/FileDetector';
import { ConverterFactory, ConversionOptions, ConversionProgress, ConversionResult } from '../lib/converters/core/ConverterFactory';

interface ProcessedFile {
  id: string;
  originalFile: File;
  originalName: string;
  detectedFormat: FileFormat | null;
  selectedOutputFormat: string;
  availableFormats: string[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: ConversionResult;
  error?: string;
  downloadUrl?: string;
}

interface DetectedFileInfo {
  file: File;
  format: FileFormat | null;
  category: string;
  availableOutputs: string[];
  recommendations: string[];
}

export const VideoTemplateProcessor: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [detectedFiles, setDetectedFiles] = useState<DetectedFileInfo[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showDetectionResults, setShowDetectionResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const converterFactory = ConverterFactory.getInstance();
  const fileDetector = new FileDetector();

  // Format recommendations based on file category
  const getFormatRecommendations = (category: string): string[] => {
    const recommendations: { [key: string]: string[] } = {
      video: ['mp4', 'webm', 'mov', 'json'],
      audio: ['mp3', 'wav', 'aac', 'json'],
      image: ['jpg', 'png', 'webp', 'json'],
      document: ['pdf', 'html', 'txt', 'json'],
      adobe: ['json', 'png', 'pdf'],
      archive: ['zip', 'json'],
      font: ['woff2', 'ttf', 'otf', 'json']
    };
    return recommendations[category] || [];
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesSelected(droppedFiles);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFilesSelected(selectedFiles);
    }
  }, []);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    // Auto-detect all selected files
    const detectedInfo: DetectedFileInfo[] = selectedFiles.map(file => {
      const format = fileDetector.detectFormat(file);
      const category = format?.category || 'unknown';
      const availableOutputs = format ? converterFactory.getOutputFormatsForFile(file) : [];
      const recommendations = getFormatRecommendations(category);

      return {
        file,
        format,
        category,
        availableOutputs,
        recommendations
      };
    });

    setDetectedFiles(detectedInfo);
    setShowDetectionResults(true);
  }, [fileDetector, converterFactory]);

  const confirmFilesToProcess = () => {
    const validFiles = detectedFiles.filter(info => info.format && info.availableOutputs.length > 0);
    
    if (validFiles.length === 0) {
      alert('No supported files detected. Please select valid files.');
      return;
    }

    const newFiles: ProcessedFile[] = validFiles.map(info => {
      const defaultFormat = info.recommendations[0] || info.availableOutputs[0];
      
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        originalFile: info.file,
        originalName: info.file.name,
        detectedFormat: info.format,
        selectedOutputFormat: defaultFormat,
        availableFormats: info.availableOutputs,
        status: 'pending',
        progress: 0
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    setDetectedFiles([]);
    setShowDetectionResults(false);
  };

  const updateFileOutputFormat = (fileId: string, newFormat: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, selectedOutputFormat: newFormat }
        : file
    ));
  };

  const convertAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsConverting(true);

    for (const file of pendingFiles) {
      try {
        const options: ConversionOptions = {
          outputFormat: file.selectedOutputFormat,
          quality: '720p',
          compress: true
        };

        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing', progress: 0 }
            : f
        ));

        const result = await converterFactory.convertSingleFile(
          file.originalFile,
          options,
          (progress) => {
            setFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { ...f, progress }
                : f
            ));
          }
        );

        if (result.blob) {
          const downloadUrl = URL.createObjectURL(result.blob);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'completed',
                  progress: 100,
                  result,
                  downloadUrl 
                }
              : f
          ));
        }

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'error',
                error: error instanceof Error ? error.message : 'Conversion failed'
              }
            : f
        ));
      }
    }

    setIsConverting(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const downloadFile = (file: ProcessedFile) => {
    if (file.downloadUrl) {
      const extension = file.selectedOutputFormat.startsWith('.') ? file.selectedOutputFormat : `.${file.selectedOutputFormat}`;
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = `${file.originalName.replace(/\.[^/.]+$/, '')}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadAll = () => {
    files.filter(f => f.status === 'completed' && f.downloadUrl).forEach(file => {
      downloadFile(file);
    });
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
    });
    setFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      video: '🎥',
      audio: '🎵', 
      image: '🖼️',
      document: '📄',
      adobe: '🎨',
      archive: '📦',
      font: '🔤',
      unknown: '❓'
    };
    return icons[category] || '📄';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">🔄 Smart File Converter</h1>
        <p className="text-gray-300">Intelligent file detection with format recommendations • 70+ supported formats</p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-900/20 scale-105'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-900/20'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-4">
          <div className="text-6xl animate-bounce">📁</div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-400">
              Smart detection for video, audio, images, documents, Adobe files, archives, and fonts
            </p>
            <div className="mt-2 text-sm text-cyan-400">
              ✨ Auto-detects file types and suggests optimal output formats
            </div>
          </div>
        </div>
      </div>

      {/* File Detection Results */}
      {showDetectionResults && detectedFiles.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            🔍 Auto-Detection Results ({detectedFiles.length} files)
          </h3>
          
          <div className="space-y-3 mb-6">
            {detectedFiles.map((info, index) => (
              <div key={index} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(info.category)}</span>
                    <div>
                      <div className="font-medium text-white">{info.file.name}</div>
                      <div className="text-sm text-gray-400">
                        {formatFileSize(info.file.size)} • 
                        {info.format ? (
                          <span className="text-green-400 ml-1">
                            {info.format.name} ({info.category})
                          </span>
                        ) : (
                          <span className="text-red-400 ml-1">Unsupported format</span>
                        )}
                      </div>
                      {info.recommendations.length > 0 && (
                        <div className="text-xs text-cyan-400 mt-1">
                          💡 Recommended: {info.recommendations.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      info.format && info.availableOutputs.length > 0
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {info.format && info.availableOutputs.length > 0 
                        ? `${info.availableOutputs.length} formats available`
                        : 'Not supported'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={confirmFilesToProcess}
              disabled={detectedFiles.filter(info => info.format && info.availableOutputs.length > 0).length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              ✅ Add {detectedFiles.filter(info => info.format && info.availableOutputs.length > 0).length} Supported Files
            </button>
            <button
              onClick={() => {
                setDetectedFiles([]);
                setShowDetectionResults(false);
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Processing Queue */}
      {files.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              📋 Processing Queue ({files.length} files)
            </h3>
            <div className="flex gap-3">
              <button
                onClick={convertAllFiles}
                disabled={isConverting || files.filter(f => f.status === 'pending').length === 0}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isConverting ? '🔄 Converting...' : '🚀 Convert All'}
              </button>
              <button
                onClick={downloadAll}
                disabled={files.filter(f => f.status === 'completed').length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                📥 Download All
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {files.map(file => (
              <div key={file.id} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(file.status)}</span>
                    <div>
                      <div className="font-medium text-white">{file.originalName}</div>
                      <div className="text-sm text-gray-400">
                        {formatFileSize(file.originalFile.size)} • 
                        <span className="text-cyan-400 ml-1">
                          {file.detectedFormat?.name} ({file.detectedFormat?.category})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {file.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300">Output:</label>
                        <select
                          value={file.selectedOutputFormat}
                          onChange={(e) => updateFileOutputFormat(file.id, e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        >
                          {file.availableFormats.map(format => (
                            <option key={format} value={format}>
                              {format.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {file.status === 'completed' && file.downloadUrl && (
                      <button
                        onClick={() => downloadFile(file)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        📥 Download
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {file.status === 'processing' && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span>Converting to {file.selectedOutputFormat.toUpperCase()}...</span>
                      <span>{file.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {file.status === 'completed' && file.detectedFormat?.category === 'adobe' && (
                  <div className="mt-2 p-3 bg-blue-900/30 rounded text-blue-300 text-sm">
                    <div className="font-medium mb-1">🎨 Adobe File Processed</div>
                    <div className="text-xs">
                      Metadata extracted and template structure analyzed. Check the downloaded file for details.
                    </div>
                  </div>
                )}

                {file.status === 'error' && (
                  <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300 text-sm">
                    ❌ {file.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{files.length}</div>
            <div className="text-sm text-gray-400">Total Files</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{files.filter(f => f.status === 'processing').length}</div>
            <div className="text-sm text-gray-400">Processing</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{files.filter(f => f.status === 'completed').length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{files.filter(f => f.status === 'error').length}</div>
            <div className="text-sm text-gray-400">Errors</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTemplateProcessor; 