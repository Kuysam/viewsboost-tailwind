import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoProcessingOptions {
  startTime?: number;
  duration?: number;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface ThumbnailOptions {
  timeInSeconds?: number;
  width?: number;
  height?: number;
  format?: 'jpg' | 'png';
}

export class FFmpegService {
  private static instance: FFmpegService;
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {
    this.ffmpeg = new FFmpeg();
  }

  static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  /**
   * Load FFmpeg core - must be called before any operations
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.doLoad();
    await this.loadingPromise;
    this.isLoaded = true;
  }

  private async doLoad(): Promise<void> {
    try {
      console.log('🎬 Loading FFmpeg core from CDN...');
      
      // Set up logging for debugging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg Log:', message);
      });

      this.ffmpeg.on('progress', ({ progress, time }) => {
        console.log(`FFmpeg Progress: ${Math.round(progress * 100)}% (${time}s)`);
      });

      // Use CDN URLs for better reliability
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      console.log('✅ FFmpeg core loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load FFmpeg:', error);
      throw new Error('Failed to initialize video processing. Please check your internet connection and try again.');
    }
  }

  /**
   * Generate a thumbnail from a video file
   */
  async generateThumbnail(
    videoFile: File, 
    options: ThumbnailOptions = {}
  ): Promise<string> {
    await this.load();

    const {
      timeInSeconds = 1,
      width = 320,
      height = 180,
      format = 'jpg'
    } = options;

    try {
      console.log(`🖼️ Generating thumbnail at ${timeInSeconds}s...`);

      // Write input file
      const inputName = 'input.mp4';
      const outputName = `thumbnail.${format}`;
      
      console.log('📁 Writing video file to FFmpeg filesystem...');
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Generate thumbnail command
      const command = [
        '-i', inputName,
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-vf', `scale=${width}:${height}`,
        '-y', // Overwrite output
        outputName
      ];

      console.log('⚡ Executing FFmpeg command:', command.join(' '));
      await this.ffmpeg.exec(command);

      // Read output file
      console.log('📤 Reading generated thumbnail...');
      const data = await this.ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: `image/${format}` });
      const thumbnailUrl = URL.createObjectURL(blob);

      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      console.log('✅ Thumbnail generated successfully!');
      return thumbnailUrl;

    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      throw new Error('Failed to generate video thumbnail. Please try with a different video file.');
    }
  }

  /**
   * Cut a segment from a video
   */
  async cutVideo(
    videoFile: File,
    startTime: number,
    duration: number,
    options: VideoProcessingOptions = {}
  ): Promise<Blob> {
    await this.load();

    const {
      width,
      height,
      quality = 'medium'
    } = options;

    try {
      console.log(`✂️ Cutting video: ${startTime}s to ${startTime + duration}s...`);

      const inputName = 'input.mp4';
      const outputName = 'output.mp4';

      console.log('📁 Writing video file to FFmpeg filesystem...');
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Build command
      const command = [
        '-i', inputName,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c:v', 'libx264'
      ];

      // Add quality settings
      switch (quality) {
        case 'low':
          command.push('-crf', '28', '-preset', 'ultrafast');
          break;
        case 'high':
          command.push('-crf', '18', '-preset', 'slow');
          break;
        default: // medium
          command.push('-crf', '23', '-preset', 'medium');
      }

      // Add resolution if specified
      if (width && height) {
        command.push('-vf', `scale=${width}:${height}`);
      }

      command.push('-y', outputName);

      console.log('⚡ Executing FFmpeg command:', command.join(' '));
      await this.ffmpeg.exec(command);

      // Read output
      console.log('📤 Reading processed video...');
      const data = await this.ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });

      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      console.log('✅ Video cut successfully!');
      return blob;

    } catch (error) {
      console.error('❌ Video cutting failed:', error);
      throw new Error('Failed to cut video. Please try with a shorter duration or different video file.');
    }
  }

  /**
   * Merge multiple video segments
   */
  async mergeVideos(
    videoFiles: File[],
    options: VideoProcessingOptions = {}
  ): Promise<Blob> {
    await this.load();

    const { quality = 'medium' } = options;

    try {
      console.log(`🔗 Merging ${videoFiles.length} video segments...`);

      // Write all input files
      const inputNames: string[] = [];
      for (let i = 0; i < videoFiles.length; i++) {
        const inputName = `input${i}.mp4`;
        inputNames.push(inputName);
        await this.ffmpeg.writeFile(inputName, await fetchFile(videoFiles[i]));
      }

      // Create concat file
      const concatContent = inputNames.map(name => `file '${name}'`).join('\n');
      await this.ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

      const outputName = 'merged.mp4';
      const command = [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        '-y', outputName
      ];

      await this.ffmpeg.exec(command);

      // Read output
      const data = await this.ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });

      // Cleanup
      for (const inputName of inputNames) {
        await this.ffmpeg.deleteFile(inputName);
      }
      await this.ffmpeg.deleteFile('concat.txt');
      await this.ffmpeg.deleteFile(outputName);

      console.log('✅ Videos merged successfully!');
      return blob;

    } catch (error) {
      console.error('❌ Video merging failed:', error);
      throw new Error('Failed to merge videos');
    }
  }

  /**
   * Convert video format or compress
   */
  async convertVideo(
    videoFile: File,
    outputFormat: 'mp4' | 'webm' | 'mov',
    options: VideoProcessingOptions = {}
  ): Promise<Blob> {
    await this.load();

    const {
      width,
      height,
      quality = 'medium'
    } = options;

    try {
      console.log(`🔄 Converting video to ${outputFormat}...`);

      const inputName = 'input.mp4';
      const outputName = `output.${outputFormat}`;

      console.log('📁 Writing video file to FFmpeg filesystem...');
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const command = ['-i', inputName];

      // Add codec based on format
      switch (outputFormat) {
        case 'webm':
          command.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
          break;
        case 'mov':
          command.push('-c:v', 'libx264', '-c:a', 'aac');
          break;
        default: // mp4
          command.push('-c:v', 'libx264', '-c:a', 'aac');
      }

      // Add quality settings
      switch (quality) {
        case 'low':
          command.push('-crf', '28');
          break;
        case 'high':
          command.push('-crf', '18');
          break;
        default:
          command.push('-crf', '23');
      }

      // Add resolution if specified
      if (width && height) {
        command.push('-vf', `scale=${width}:${height}`);
      }

      command.push('-y', outputName);

      console.log('⚡ Executing FFmpeg command:', command.join(' '));
      await this.ffmpeg.exec(command);

      // Read output
      console.log('📤 Reading converted video...');
      const data = await this.ffmpeg.readFile(outputName);
      const mimeType = outputFormat === 'webm' ? 'video/webm' : 
                      outputFormat === 'mov' ? 'video/quicktime' : 'video/mp4';
      const blob = new Blob([data], { type: mimeType });

      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      console.log('✅ Video converted successfully!');
      return blob;

    } catch (error) {
      console.error('❌ Video conversion failed:', error);
      throw new Error('Failed to convert video. Please try with a different format or video file.');
    }
  }

  /**
   * Extract audio from video
   */
  async extractAudio(
    videoFile: File,
    format: 'mp3' | 'wav' | 'aac' = 'mp3'
  ): Promise<Blob> {
    await this.load();

    try {
      console.log(`🎵 Extracting audio as ${format}...`);

      const inputName = 'input.mp4';
      const outputName = `audio.${format}`;

      console.log('📁 Writing video file to FFmpeg filesystem...');
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      const command = [
        '-i', inputName,
        '-vn', // No video
        '-acodec', format === 'wav' ? 'pcm_s16le' : format,
        '-y', outputName
      ];

      console.log('⚡ Executing FFmpeg command:', command.join(' '));
      await this.ffmpeg.exec(command);

      // Read output
      console.log('📤 Reading extracted audio...');
      const data = await this.ffmpeg.readFile(outputName);
      const mimeType = `audio/${format}`;
      const blob = new Blob([data], { type: mimeType });

      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      console.log('✅ Audio extracted successfully!');
      return blob;

    } catch (error) {
      console.error('❌ Audio extraction failed:', error);
      throw new Error('Failed to extract audio. Please try with a different video file.');
    }
  }

  /**
   * Get basic video information (simplified for reliability)
   */
  async getVideoInfo(videoFile: File): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    size: number;
  }> {
    // For now, return basic file info
    // In a production app, you'd parse FFmpeg output or use the File API
    console.log('ℹ️ Getting video info for:', videoFile.name);
    return {
      duration: 10, // Would parse from video metadata
      width: 1920,  // Would get from video
      height: 1080, // Would get from video
      fps: 30,      // Would get from video
      size: videoFile.size
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
      this.loadingPromise = null;
    }
  }
} 