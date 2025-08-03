import { useState, useCallback, useRef, useEffect } from 'react';
import { FFmpegService } from '../services/FFmpegService';

export interface VideoProcessingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
}

export interface VideoProcessingHook {
  state: VideoProcessingState;
  generateThumbnail: (videoFile: File, options?: any) => Promise<string>;
  cutVideo: (videoFile: File, startTime: number, duration: number, options?: any) => Promise<Blob>;
  mergeVideos: (videoFiles: File[], options?: any) => Promise<Blob>;
  convertVideo: (videoFile: File, outputFormat: 'mp4' | 'webm' | 'mov', options?: any) => Promise<Blob>;
  extractAudio: (videoFile: File, format?: 'mp3' | 'wav' | 'aac') => Promise<Blob>;
  getVideoInfo: (videoFile: File) => Promise<any>;
  downloadProcessedVideo: (blob: Blob, filename: string) => void;
}

export function useVideoProcessing(): VideoProcessingHook {
  const [state, setState] = useState<VideoProcessingState>({
    isLoading: false,
    progress: 0,
    error: null
  });

  const ffmpegServiceRef = useRef<FFmpegService | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize FFmpeg service directly (no Web Worker for now)
  useEffect(() => {
    ffmpegServiceRef.current = FFmpegService.getInstance();
  }, []);

  const executeWithProgress = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    // Clear any existing intervals to prevent duplicates
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, progress: 0, error: null }));
    
    try {
      // Start progress simulation with better throttling
      progressIntervalRef.current = setInterval(() => {
        setState(prev => {
          if (!prev.isLoading) return prev; // Skip if no longer loading
          const newProgress = Math.min(prev.progress + Math.random() * 15, 95);
          return { ...prev, progress: newProgress };
        });
      }, 500);

      const result = await operation();
      
      // Clear interval and complete progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setState(prev => ({ ...prev, isLoading: false, progress: 100, error: null }));
      
      // Reset progress after a short delay
      const resetTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, progress: 0 }));
      }, 1500);
      
      return result;
    } catch (error) {
      // Clear interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        progress: 0,
        error: `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
      throw error;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const generateThumbnail = useCallback(async (
    videoFile: File, 
    options?: any
  ): Promise<string> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.generateThumbnail(videoFile, options),
      'Thumbnail generation'
    );
  }, [executeWithProgress]);

  const cutVideo = useCallback(async (
    videoFile: File,
    startTime: number,
    duration: number,
    options?: any
  ): Promise<Blob> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.cutVideo(videoFile, startTime, duration, options),
      'Video cutting'
    );
  }, [executeWithProgress]);

  const mergeVideos = useCallback(async (
    videoFiles: File[],
    options?: any
  ): Promise<Blob> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.mergeVideos(videoFiles, options),
      'Video merging'
    );
  }, [executeWithProgress]);

  const convertVideo = useCallback(async (
    videoFile: File,
    outputFormat: 'mp4' | 'webm' | 'mov',
    options?: any
  ): Promise<Blob> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.convertVideo(videoFile, outputFormat, options),
      'Video conversion'
    );
  }, [executeWithProgress]);

  const extractAudio = useCallback(async (
    videoFile: File,
    format: 'mp3' | 'wav' | 'aac' = 'mp3'
  ): Promise<Blob> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.extractAudio(videoFile, format),
      'Audio extraction'
    );
  }, [executeWithProgress]);

  const getVideoInfo = useCallback(async (videoFile: File): Promise<any> => {
    if (!ffmpegServiceRef.current) {
      throw new Error('FFmpeg service not initialized');
    }

    return executeWithProgress(
      () => ffmpegServiceRef.current!.getVideoInfo(videoFile),
      'Getting video info'
    );
  }, [executeWithProgress]);

  const downloadProcessedVideo = useCallback((blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    state,
    generateThumbnail,
    cutVideo,
    mergeVideos,
    convertVideo,
    extractAudio,
    getVideoInfo,
    downloadProcessedVideo
  };
} 