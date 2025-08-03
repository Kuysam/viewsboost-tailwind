// Browser-compatible video converter using FFmpeg WASM
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoConversionOptions {
  outputFormat: 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv' | 'gif' | 'json';
  quality?: '480p' | '720p' | '1080p' | '4k';
  bitrate?: string;
  fps?: number;
}

export class VideoConverter {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load FFmpeg WASM
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      console.log('✅ FFmpeg WASM loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load FFmpeg WASM:', error);
      throw new Error('Failed to initialize video converter');
    }
  }

  async convertVideo(
    file: File,
    options: VideoConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    // Handle JSON metadata export
    if (options.outputFormat === 'json') {
      const metadata = await this.extractVideoMetadata(file, onProgress);
      const jsonContent = JSON.stringify(metadata, null, 2);
      
      console.log('✅ Video metadata extraction completed successfully');
      return new Blob([jsonContent], { type: 'application/json' });
    }

    await this.initialize();

    try {
      const inputName = `input.${this.getFileExtension(file.name)}`;
      const outputName = `output.${options.outputFormat}`;

      // Write input file to FFmpeg filesystem
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      // Build FFmpeg command
      const command = this.buildFFmpegCommand(inputName, outputName, options);
      
      console.log('🎬 Starting video conversion with command:', command);

      // Set up progress monitoring
      this.ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }
      });

      // Execute conversion
      await this.ffmpeg.exec(command);

      // Read output file
      const outputData = await this.ffmpeg.readFile(outputName);
      
      // Clean up files
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      // Convert to blob
      const blob = new Blob([outputData], { 
        type: this.getMimeType(options.outputFormat) 
      });

      console.log('✅ Video conversion completed successfully');
      return blob;

    } catch (error) {
      console.error('❌ Video conversion failed:', error);
      throw new Error(`Video conversion failed: ${error.message}`);
    }
  }

  private buildFFmpegCommand(
    inputName: string, 
    outputName: string, 
    options: VideoConversionOptions
  ): string[] {
    const command = ['-i', inputName];

    // Add quality settings
    if (options.quality) {
      const resolutions = {
        '480p': '854x480',
        '720p': '1280x720',
        '1080p': '1920x1080',
        '4k': '3840x2160'
      };
      command.push('-vf', `scale=${resolutions[options.quality]}`);
    }

    // Add bitrate if specified
    if (options.bitrate) {
      command.push('-b:v', options.bitrate);
    }

    // Add FPS if specified
    if (options.fps) {
      command.push('-r', options.fps.toString());
    }

    // Format-specific settings
    switch (options.outputFormat) {
      case 'mp4':
        command.push('-c:v', 'libx264', '-c:a', 'aac');
        break;
      case 'webm':
        command.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
        break;
      case 'gif':
        command.push('-vf', 'fps=10,scale=320:-1:flags=lanczos');
        break;
      default:
        // Use default codecs
        break;
    }

    command.push(outputName);
    return command;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private async extractVideoMetadata(file: File, onProgress?: (progress: number) => void): Promise<any> {
    onProgress?.(10);

    try {
      // Create video element to extract basic metadata
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.src = url;
      video.preload = 'metadata';

      const metadata = await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          onProgress?.(50);
          
          const data = {
            file: {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified).toISOString()
            },
            video: {
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              aspectRatio: +(video.videoWidth / video.videoHeight).toFixed(2),
              format: file.type || 'unknown'
            },
            analysis: {
              resolution: `${video.videoWidth}x${video.videoHeight}`,
              durationFormatted: this.formatDuration(video.duration),
              estimatedBitrate: Math.round((file.size * 8) / video.duration / 1000) + ' kbps',
              frameRate: 'unknown', // Cannot determine from HTML5 video
              codecInfo: 'unknown', // Limited browser access
              hasAudio: 'unknown' // Cannot determine reliably
            },
            metadata: {
              extractedAt: new Date().toISOString(),
              extractedBy: 'ViewsBoost Video Converter',
              version: '1.0'
            }
          };
          
          URL.revokeObjectURL(url);
          resolve(data);
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load video metadata'));
        };
      });

      onProgress?.(100);
      return metadata;

    } catch (error) {
      onProgress?.(100);
      // Fallback basic metadata
      return {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        },
        video: {
          format: file.type || 'unknown',
          note: 'Advanced video analysis not available for this format'
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          extractedBy: 'ViewsBoost Video Converter',
          version: '1.0',
          error: 'Could not extract video metadata'
        }
      };
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private getMimeType(format: string): string {
    const mimeTypes = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
      gif: 'image/gif',
      json: 'application/json'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  // Adobe format handling (limited in browser)
  async processAdobeFile(file: File): Promise<{ metadata: any; preview?: Blob }> {
    const extension = this.getFileExtension(file.name);
    
    if (extension === 'aep' || extension === 'mogrt') {
      // Extract basic metadata
      const metadata = {
        name: file.name,
        size: file.size,
        type: extension,
        lastModified: new Date(file.lastModified),
        note: 'Full rendering requires Adobe After Effects. Only metadata extraction available in browser.'
      };

      // For browser compatibility, we can't fully process Adobe files
      // Return metadata only
      return { metadata };
    }

    throw new Error(`Unsupported Adobe format: ${extension}`);
  }

  getSupportedFormats(): string[] {
    return ['mp4', 'webm', 'avi', 'mov', 'mkv', 'gif', 'json'];
  }

  getInputFormats(): string[] {
    return ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp', 'aep', 'mogrt'];
  }
} 