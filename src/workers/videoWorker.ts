import { FFmpegService } from '../services/FFmpegService';

export interface WorkerMessage {
  id: string;
  type: 'generateThumbnail' | 'cutVideo' | 'mergeVideos' | 'convertVideo' | 'extractAudio' | 'getVideoInfo';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: 'success' | 'error' | 'progress';
  payload?: any;
  error?: string;
}

class VideoWorker {
  private ffmpegService: FFmpegService;

  constructor() {
    this.ffmpegService = FFmpegService.getInstance();
    this.setupMessageHandler();
  }

  private setupMessageHandler() {
    self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = event.data;

      try {
        switch (type) {
          case 'generateThumbnail':
            await this.handleGenerateThumbnail(id, payload);
            break;
          
          case 'cutVideo':
            await this.handleCutVideo(id, payload);
            break;
          
          case 'mergeVideos':
            await this.handleMergeVideos(id, payload);
            break;
          
          case 'convertVideo':
            await this.handleConvertVideo(id, payload);
            break;
          
          case 'extractAudio':
            await this.handleExtractAudio(id, payload);
            break;
          
          case 'getVideoInfo':
            await this.handleGetVideoInfo(id, payload);
            break;
          
          default:
            throw new Error(`Unknown worker message type: ${type}`);
        }
      } catch (error) {
        this.postError(id, error instanceof Error ? error.message : 'Unknown error');
      }
    };
  }

  private async handleGenerateThumbnail(id: string, payload: {
    videoFile: File;
    options?: any;
  }) {
    const { videoFile, options } = payload;
    const thumbnailUrl = await this.ffmpegService.generateThumbnail(videoFile, options);
    
    this.postSuccess(id, { thumbnailUrl });
  }

  private async handleCutVideo(id: string, payload: {
    videoFile: File;
    startTime: number;
    duration: number;
    options?: any;
  }) {
    const { videoFile, startTime, duration, options } = payload;
    const blob = await this.ffmpegService.cutVideo(videoFile, startTime, duration, options);
    
    // Convert blob to array buffer for transfer
    const arrayBuffer = await blob.arrayBuffer();
    
    this.postSuccess(id, { 
      videoData: arrayBuffer,
      mimeType: blob.type 
    });
  }

  private async handleMergeVideos(id: string, payload: {
    videoFiles: File[];
    options?: any;
  }) {
    const { videoFiles, options } = payload;
    const blob = await this.ffmpegService.mergeVideos(videoFiles, options);
    
    const arrayBuffer = await blob.arrayBuffer();
    
    this.postSuccess(id, { 
      videoData: arrayBuffer,
      mimeType: blob.type 
    });
  }

  private async handleConvertVideo(id: string, payload: {
    videoFile: File;
    outputFormat: 'mp4' | 'webm' | 'mov';
    options?: any;
  }) {
    const { videoFile, outputFormat, options } = payload;
    const blob = await this.ffmpegService.convertVideo(videoFile, outputFormat, options);
    
    const arrayBuffer = await blob.arrayBuffer();
    
    this.postSuccess(id, { 
      videoData: arrayBuffer,
      mimeType: blob.type 
    });
  }

  private async handleExtractAudio(id: string, payload: {
    videoFile: File;
    format?: 'mp3' | 'wav' | 'aac';
  }) {
    const { videoFile, format } = payload;
    const blob = await this.ffmpegService.extractAudio(videoFile, format);
    
    const arrayBuffer = await blob.arrayBuffer();
    
    this.postSuccess(id, { 
      audioData: arrayBuffer,
      mimeType: blob.type 
    });
  }

  private async handleGetVideoInfo(id: string, payload: {
    videoFile: File;
  }) {
    const { videoFile } = payload;
    const info = await this.ffmpegService.getVideoInfo(videoFile);
    
    this.postSuccess(id, { info });
  }

  private postSuccess(id: string, payload: any) {
    const response: WorkerResponse = {
      id,
      type: 'success',
      payload
    };
    self.postMessage(response);
  }

  private postError(id: string, error: string) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error
    };
    self.postMessage(response);
  }

  private postProgress(id: string, progress: number) {
    const response: WorkerResponse = {
      id,
      type: 'progress',
      payload: { progress }
    };
    self.postMessage(response);
  }
}

// Initialize the worker
new VideoWorker(); 