import { FileDetector } from './FileDetector';
import { VideoConverter, VideoConversionOptions } from '../video/VideoConverter';
import { ImageConverter } from '../image/ImageConverter';
import { AudioConverter } from '../audio/AudioConverter';
import { DocumentConverter } from '../document/DocumentConverter';
import { AdobeConverter } from '../adobe/AdobeConverter';
import { ArchiveConverter } from '../archive/ArchiveConverter';
import { FontConverter } from '../font/FontConverter';

export interface ConversionProgress {
  fileIndex: number;
  totalFiles: number;
  currentFileProgress: number;
  currentFileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export interface ConversionResult {
  file: File;
  blob?: Blob;
  error?: string;
  metadata?: any;
}

export interface ConversionOptions {
  outputFormat: string;
  quality?: string;
  resize?: { width: number; height: number };
  compress?: boolean;
  [key: string]: any;
}

export class ConverterFactory {
  private static instance: ConverterFactory;
  private fileDetector: FileDetector;
  private videoConverter: VideoConverter;
  private imageConverter: ImageConverter;
  private audioConverter: AudioConverter;
  private documentConverter: DocumentConverter;
  private adobeConverter: AdobeConverter;
  private archiveConverter: ArchiveConverter;
  private fontConverter: FontConverter;

  private constructor() {
    this.fileDetector = new FileDetector();
    this.videoConverter = new VideoConverter();
    this.imageConverter = new ImageConverter();
    this.audioConverter = new AudioConverter();
    this.documentConverter = new DocumentConverter();
    this.adobeConverter = new AdobeConverter();
    this.archiveConverter = new ArchiveConverter();
    this.fontConverter = new FontConverter();
  }

  static getInstance(): ConverterFactory {
    if (!ConverterFactory.instance) {
      ConverterFactory.instance = new ConverterFactory();
    }
    return ConverterFactory.instance;
  }

  async convertFiles(
    files: File[],
    options: ConversionOptions,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      onProgress?.({
        fileIndex: i,
        totalFiles: files.length,
        currentFileProgress: 0,
        currentFileName: file.name,
        status: 'processing',
        message: `Processing ${file.name}...`
      });

      try {
        const result = await this.convertSingleFile(file, options, (progress) => {
          onProgress?.({
            fileIndex: i,
            totalFiles: files.length,
            currentFileProgress: progress,
            currentFileName: file.name,
            status: 'processing',
            message: `Converting ${file.name}... ${progress}%`
          });
        });

        results.push(result);

        onProgress?.({
          fileIndex: i,
          totalFiles: files.length,
          currentFileProgress: 100,
          currentFileName: file.name,
          status: 'completed',
          message: `Completed ${file.name}`
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          file,
          error: errorMessage
        });

        onProgress?.({
          fileIndex: i,
          totalFiles: files.length,
          currentFileProgress: 0,
          currentFileName: file.name,
          status: 'error',
          message: `Error converting ${file.name}: ${errorMessage}`
        });
      }
    }

    return results;
  }

  async convertSingleFile(
    file: File,
    options: ConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<ConversionResult> {
    const formatInfo = this.fileDetector.detectFormat(file);
    
    if (!formatInfo) {
      throw new Error('Unsupported file format');
    }

    const { category } = formatInfo;

    try {
      let blob: Blob;
      let metadata: any = {};

      switch (category) {
        case 'video':
          const videoOptions: VideoConversionOptions = {
            outputFormat: options.outputFormat as any,
            quality: options.quality as any,
            bitrate: options.bitrate,
            fps: options.fps
          };
          blob = await this.videoConverter.convertVideo(file, videoOptions, onProgress);
          break;

        case 'adobe':
          const adobeResult = await this.adobeConverter.convertAdobeFile(file, {
            outputFormat: options.outputFormat,
            extractPreview: true,
            generateTemplate: true,
            extractLayers: true,
            quality: options.quality as string
          });
          blob = adobeResult.blob || new Blob();
          metadata = adobeResult.metadata;
          break;

        case 'image':
          blob = await this.imageConverter.convertImage(file, {
            outputFormat: options.outputFormat,
            quality: parseInt(options.quality || '80'),
            resize: options.resize,
            compress: options.compress
          }, onProgress);
          break;

        case 'audio':
          blob = await this.audioConverter.convertAudio(file, {
            outputFormat: options.outputFormat,
            bitrate: options.bitrate || '192k',
            sampleRate: options.sampleRate || 44100
          }, onProgress);
          break;

        case 'document':
          blob = await this.documentConverter.convertDocument(file, {
            outputFormat: options.outputFormat,
            quality: options.quality
          }, onProgress);
          break;

        case 'archive':
          blob = await this.archiveConverter.extractArchive(file, onProgress);
          break;

        case 'font':
          blob = await this.fontConverter.convertFont(file, {
            outputFormat: options.outputFormat
          }, onProgress);
          break;

        default:
          throw new Error(`Unsupported file category: ${category}`);
      }

      return {
        file,
        blob,
        metadata
      };

    } catch (error) {
      throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getSupportedFormats(): { [category: string]: string[] } {
    return {
      video: this.videoConverter.getSupportedFormats(),
      image: this.imageConverter.getSupportedFormats(),
      audio: this.audioConverter.getSupportedFormats(),
      document: this.documentConverter.getSupportedFormats(),
      adobe: this.adobeConverter.getSupportedFormats(),
      archive: this.archiveConverter.getSupportedFormats(),
      font: this.fontConverter.getSupportedFormats()
    };
  }

  getOutputFormatsForFile(file: File): string[] {
    const formatInfo = this.fileDetector.detectFormat(file);
    
    if (!formatInfo) {
      return [];
    }

    const supportedFormats = this.getSupportedFormats();
    return supportedFormats[formatInfo.category] || [];
  }

  isFormatSupported(file: File): boolean {
    const formatInfo = this.fileDetector.detectFormat(file);
    return formatInfo !== null;
  }

  getFileCategory(file: File): string | null {
    const formatInfo = this.fileDetector.detectFormat(file);
    return formatInfo?.category || null;
  }
}

export default ConverterFactory; 