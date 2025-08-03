import React, { useState, useRef, useEffect } from 'react';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { 
  Play, Pause, Scissors, Download, FileVideo, 
  Image as ImageIcon, Music, Info, Upload, 
  Loader2, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';

export const VideoProcessingDemo: React.FC = () => {
  const videoProcessing = useVideoProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [cutSettings, setCutSettings] = useState({ startTime: 0, duration: 5 });
  const [results, setResults] = useState<{
    type: string;
    success: boolean;
    message: string;
    timestamp: number;
  }[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailUrlRef = useRef<string | null>(null);

  // Cleanup effect for memory leaks
  useEffect(() => {
    return () => {
      // Clean up thumbnail URL to prevent memory leaks
      if (thumbnailUrlRef.current) {
        URL.revokeObjectURL(thumbnailUrlRef.current);
        thumbnailUrlRef.current = null;
      }
      if (generatedThumbnail && generatedThumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(generatedThumbnail);
      }
    };
  }, []);

  // Check if FFmpeg failed to load on first render
  useEffect(() => {
    // Give FFmpeg a chance to load, then check for fallback
    const timer = setTimeout(() => {
      if (videoProcessing.state.error && videoProcessing.state.error.includes('Failed to initialize')) {
        setShowFallback(true);
        addResult('Fallback Mode', true, 'Switched to HTML5 fallback mode');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [videoProcessing.state.error]);

  const addResult = (type: string, success: boolean, message: string) => {
    setResults(prev => [...prev, { type, success, message, timestamp: Date.now() }]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setGeneratedThumbnail(null);
      addResult('File Selected', true, `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      addResult('File Selection', false, 'Please select a valid video file');
    }
  };

  // Fallback thumbnail generation using HTML5 video
  const generateThumbnailFallback = async () => {
    if (!selectedFile || !videoRef.current || !canvasRef.current) {
      addResult('Thumbnail Generation (Fallback)', false, 'Required elements not available');
      return;
    }

    setIsGeneratingThumbnail(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not available');

      // Create object URL for video
      const videoUrl = URL.createObjectURL(selectedFile);
      
      // Reset video element
      video.currentTime = 0;
      video.src = videoUrl;

      await new Promise<void>((resolve, reject) => {
        let hasResolved = false;

        const cleanup = () => {
          URL.revokeObjectURL(videoUrl);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };

        const onLoadedMetadata = () => {
          console.log('Video metadata loaded, seeking to 2 seconds...');
          if (video.duration > 2) {
            video.currentTime = 2;
          } else {
            video.currentTime = video.duration / 2;
          }
        };
        
        const onSeeked = () => {
          if (hasResolved) return;
          hasResolved = true;

          try {
            console.log('Video seeked, capturing frame...');
            
            // Set canvas size based on video dimensions
            const aspectRatio = video.videoWidth / video.videoHeight;
            canvas.width = 320;
            canvas.height = Math.round(320 / aspectRatio);
            
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob URL
            canvas.toBlob((blob) => {
              if (blob) {
                // Clean up previous thumbnail URL
                if (thumbnailUrlRef.current) {
                  URL.revokeObjectURL(thumbnailUrlRef.current);
                }
                
                const thumbnailUrl = URL.createObjectURL(blob);
                thumbnailUrlRef.current = thumbnailUrl;
                setGeneratedThumbnail(thumbnailUrl);
                addResult('Thumbnail Generation (Fallback)', true, 'Thumbnail generated using HTML5 video');
                cleanup();
                resolve();
              } else {
                cleanup();
                reject(new Error('Failed to create thumbnail blob'));
              }
            }, 'image/jpeg', 0.8);
          } catch (error) {
            cleanup();
            reject(error);
          }
        };
        
        const onError = (error: Event) => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          reject(new Error('Video loading failed'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            cleanup();
            reject(new Error('Thumbnail generation timed out'));
          }
        }, 10000);
      });

    } catch (error) {
      console.error('Fallback thumbnail generation failed:', error);
      addResult('Thumbnail Generation (Fallback)', false, error instanceof Error ? error.message : 'Failed to generate thumbnail');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!selectedFile) return;

    // Always try fallback mode first if we detected FFmpeg issues
    if (showFallback || videoProcessing.state.error) {
      await generateThumbnailFallback();
      return;
    }

    try {
      const thumbnailUrl = await videoProcessing.generateThumbnail(selectedFile, {
        timeInSeconds: 2,
        width: 320,
        height: 180
      });
      setGeneratedThumbnail(thumbnailUrl);
      addResult('Thumbnail Generation', true, 'Thumbnail generated successfully');
    } catch (error) {
      addResult('Thumbnail Generation', false, error instanceof Error ? error.message : 'Failed to generate thumbnail');
      
      // Suggest fallback mode
      if (error instanceof Error && error.message.includes('Failed to initialize')) {
        setShowFallback(true);
        addResult('Fallback Mode', true, 'Switched to HTML5 fallback mode');
        // Try fallback immediately
        await generateThumbnailFallback();
      }
    }
  };

  const handleCutVideo = async () => {
    if (!selectedFile) return;

    if (showFallback) {
      addResult('Video Cutting', false, 'Video cutting requires FFmpeg. Please check your internet connection and disable ad blockers.');
      return;
    }

    try {
      const blob = await videoProcessing.cutVideo(
        selectedFile,
        cutSettings.startTime,
        cutSettings.duration,
        { quality: 'medium' }
      );
      
      const filename = `cut_${selectedFile.name.replace(/\.[^/.]+$/, '')}_${cutSettings.startTime}s-${cutSettings.duration}s.mp4`;
      videoProcessing.downloadProcessedVideo(blob, filename);
      
      addResult('Video Cutting', true, `Video cut and downloaded: ${filename}`);
    } catch (error) {
      addResult('Video Cutting', false, error instanceof Error ? error.message : 'Failed to cut video');
    }
  };

  const handleConvertVideo = async (format: 'mp4' | 'webm' | 'mov') => {
    if (!selectedFile) return;

    if (showFallback) {
      addResult('Video Conversion', false, 'Video conversion requires FFmpeg. Please check your internet connection and disable ad blockers.');
      return;
    }

    try {
      const blob = await videoProcessing.convertVideo(selectedFile, format, {
        quality: 'medium'
      });
      
      const filename = `converted_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${format}`;
      videoProcessing.downloadProcessedVideo(blob, filename);
      
      addResult('Video Conversion', true, `Video converted to ${format.toUpperCase()} and downloaded`);
    } catch (error) {
      addResult('Video Conversion', false, error instanceof Error ? error.message : 'Failed to convert video');
    }
  };

  const handleExtractAudio = async (format: 'mp3' | 'wav' | 'aac') => {
    if (!selectedFile) return;

    if (showFallback) {
      addResult('Audio Extraction', false, 'Audio extraction requires FFmpeg. Please check your internet connection and disable ad blockers.');
      return;
    }

    try {
      const blob = await videoProcessing.extractAudio(selectedFile, format);
      
      const filename = `audio_${selectedFile.name.replace(/\.[^/.]+$/, '')}.${format}`;
      videoProcessing.downloadProcessedVideo(blob, filename);
      
      addResult('Audio Extraction', true, `Audio extracted as ${format.toUpperCase()} and downloaded`);
    } catch (error) {
      addResult('Audio Extraction', false, error instanceof Error ? error.message : 'Failed to extract audio');
    }
  };

  const handleGetVideoInfo = async () => {
    if (!selectedFile) return;

    try {
      const info = await videoProcessing.getVideoInfo(selectedFile);
      addResult('Video Info', true, `Duration: ${info.duration}s, Size: ${info.width}x${info.height}, FPS: ${info.fps}, File size: ${(info.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      addResult('Video Info', false, error instanceof Error ? error.message : 'Failed to get video info');
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        🎬 FFmpeg Video Processing Demo
        {(videoProcessing.state.isLoading || isGeneratingThumbnail) && <Loader2 className="w-5 h-5 animate-spin" />}
        {showFallback && <AlertCircle className="w-5 h-5 text-yellow-400" />}
      </h2>

      {showFallback && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div className="text-yellow-300">
            <p className="font-medium">Fallback Mode Active</p>
            <p className="text-sm">FFmpeg is not available. Some features may be limited to HTML5 alternatives.</p>
          </div>
        </div>
      )}

      {/* Hidden video and canvas for fallback */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        preload="metadata"
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Video File</label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose Video
          </button>
          {selectedFile && (
            <span className="text-gray-300">{selectedFile.name}</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(videoProcessing.state.isLoading || isGeneratingThumbnail) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {isGeneratingThumbnail ? 'Generating thumbnail...' : 'Processing...'}
            </span>
            <span className="text-sm text-gray-400">
              {isGeneratingThumbnail ? '50%' : `${Math.round(videoProcessing.state.progress)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: isGeneratingThumbnail ? '50%' : `${videoProcessing.state.progress}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {videoProcessing.state.error && !showFallback && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{videoProcessing.state.error}</span>
        </div>
      )}

      {/* Actions */}
      {selectedFile && (
        <div className="space-y-6">
          {/* Thumbnail Generation */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Generate Thumbnail {showFallback && <span className="text-xs text-yellow-400">(HTML5)</span>}
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateThumbnail}
                disabled={videoProcessing.state.isLoading || isGeneratingThumbnail}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Generate Thumbnail
              </button>
              {generatedThumbnail && (
                <img
                  src={generatedThumbnail}
                  alt="Generated thumbnail"
                  className="w-32 h-auto object-cover rounded border border-gray-600"
                />
              )}
            </div>
          </div>

          {/* Video Cutting */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Cut Video {showFallback && <span className="text-xs text-red-400">(Requires FFmpeg)</span>}
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Start Time (s)</label>
                <input
                  type="number"
                  value={cutSettings.startTime}
                  onChange={(e) => setCutSettings(prev => ({ ...prev, startTime: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 w-20"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Duration (s)</label>
                <input
                  type="number"
                  value={cutSettings.duration}
                  onChange={(e) => setCutSettings(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-1 w-20"
                  min="1"
                />
              </div>
            </div>
            <button
              onClick={handleCutVideo}
              disabled={videoProcessing.state.isLoading || showFallback}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Scissors className="w-4 h-4" />
              Cut & Download
            </button>
          </div>

          {/* Video Conversion */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileVideo className="w-5 h-5" />
              Convert Video {showFallback && <span className="text-xs text-red-400">(Requires FFmpeg)</span>}
            </h3>
            <div className="flex gap-2">
              {(['mp4', 'webm', 'mov'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => handleConvertVideo(format)}
                  disabled={videoProcessing.state.isLoading || showFallback}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileVideo className="w-4 h-4" />
                  To {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Extraction */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Extract Audio {showFallback && <span className="text-xs text-red-400">(Requires FFmpeg)</span>}
            </h3>
            <div className="flex gap-2">
              {(['mp3', 'wav', 'aac'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => handleExtractAudio(format)}
                  disabled={videoProcessing.state.isLoading || showFallback}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Music className="w-4 h-4" />
                  As {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Video Info */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Video Information
            </h3>
            <button
              onClick={handleGetVideoInfo}
              disabled={videoProcessing.state.isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Info className="w-4 h-4" />
              Get Video Info
            </button>
          </div>
        </div>
      )}

      {/* Results Log */}
      {results.length > 0 && (
        <div className="mt-6 border border-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Processing Results
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.slice(-10).reverse().map((result, index) => (
              <div
                key={result.timestamp}
                className={`flex items-center gap-2 text-sm p-2 rounded ${
                  result.success 
                    ? 'bg-green-900/20 text-green-300' 
                    : 'bg-red-900/20 text-red-300'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-medium">{result.type}:</span>
                <span>{result.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 