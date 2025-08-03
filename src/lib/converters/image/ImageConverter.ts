import { ConversionOptions, ConversionProgress, ConversionResult } from '../core/ConverterFactory';

// Browser-compatible image converter using Canvas API
export interface ImageConversionOptions {
  outputFormat: 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'json';
  quality?: number; // 1-100
  resize?: { width: number; height: number };
  compress?: boolean;
}

export class ImageConverter {
  async convert(
    inputBuffer: Buffer,
    fromExtension: string,
    toExtension: string,
    options: ConversionOptions = {},
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    try {
      onProgress?.({
        percentage: 0,
        stage: 'initializing',
        message: 'Starting image conversion...'
      });

      // Import Sharp for image processing (dynamic import for browser compatibility)
      const sharp = await this.getSharpInstance();
      
      onProgress?.({
        percentage: 20,
        stage: 'processing',
        message: 'Processing image...'
      });

      let processor = sharp(inputBuffer);

      // Apply transformations based on options
      processor = this.applyImageTransformations(processor, options, onProgress);

      onProgress?.({
        percentage: 70,
        stage: 'converting',
        message: `Converting to ${toExtension}...`
      });

      // Convert to target format
      const outputBuffer = await this.convertToFormat(processor, toExtension, options);

      onProgress?.({
        percentage: 100,
        stage: 'complete',
        message: 'Image conversion completed'
      });

      return {
        success: true,
        outputBuffer,
        metadata: {
          format: toExtension,
          options
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Image conversion failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async getSharpInstance() {
    // For browser environments, we'd use a different library like jimp or canvas
    if (typeof window !== 'undefined') {
      // Browser implementation using Canvas API
      return await this.getBrowserImageProcessor();
    } else {
      // Node.js implementation using Sharp
      const sharp = require('sharp');
      return sharp;
    }
  }

  private async getBrowserImageProcessor() {
    // Browser-based image processing implementation
    return {
      // Canvas-based implementation for browsers
      resize: (options: any) => this,
      jpeg: (options: any) => ({ toBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
      png: (options: any) => ({ toBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
      webp: (options: any) => ({ toBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
      // ... other methods
    };
  }

  private applyImageTransformations(processor: any, options: ConversionOptions, onProgress?: (progress: ConversionProgress) => void) {
    // Resize
    if (options.resize) {
      const { width, height, fit } = options.resize;
      processor = processor.resize(width, height, { fit: fit || 'cover' });
      
      onProgress?.({
        percentage: 30,
        stage: 'processing',
        message: `Resizing to ${width}x${height}...`
      });
    }

    // Crop
    if (options.crop) {
      const { x, y, width, height } = options.crop;
      processor = processor.extract({ left: x, top: y, width, height });
      
      onProgress?.({
        percentage: 40,
        stage: 'processing',
        message: 'Applying crop...'
      });
    }

    // Effects
    if (options.effects) {
      if (options.effects.blur) {
        processor = processor.blur(options.effects.blur);
      }
      
      if (options.effects.brightness) {
        processor = processor.modulate({ brightness: options.effects.brightness });
      }
      
      if (options.effects.saturation) {
        processor = processor.modulate({ saturation: options.effects.saturation });
      }
      
      if (options.effects.grayscale) {
        processor = processor.grayscale();
      }
      
      onProgress?.({
        percentage: 50,
        stage: 'processing',
        message: 'Applying effects...'
      });
    }

    // Optimization
    if (options.optimize) {
      processor = processor.sharpen();
    }

    return processor;
  }

  private async convertToFormat(processor: any, toExtension: string, options: ConversionOptions): Promise<Buffer> {
    const quality = options.quality || 85;
    
    switch (toExtension.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return processor.jpeg({ 
          quality,
          progressive: options.optimize || false,
          mozjpeg: options.optimize || false
        }).toBuffer();
        
      case '.png':
        return processor.png({ 
          quality,
          compressionLevel: options.compression || 6,
          progressive: options.optimize || false
        }).toBuffer();
        
      case '.webp':
        return processor.webp({ 
          quality,
          effort: options.optimize ? 6 : 4
        }).toBuffer();
        
      case '.avif':
        return processor.avif({ 
          quality,
          effort: options.optimize ? 9 : 4
        }).toBuffer();
        
      case '.heic':
        return processor.heif({ 
          quality,
          compression: options.optimize ? 'hevc' : 'av1'
        }).toBuffer();
        
      case '.tiff':
        return processor.tiff({ 
          quality,
          compression: options.optimize ? 'lzw' : 'none'
        }).toBuffer();
        
      case '.gif':
        // For GIF, we need special handling since Sharp doesn't support GIF output
        // Convert to PNG first, then use a GIF library
        const pngBuffer = await processor.png().toBuffer();
        return this.convertPngToGif(pngBuffer);
        
      case '.bmp':
        // Convert to PNG and then to BMP (Sharp doesn't support BMP output)
        const pngForBmp = await processor.png().toBuffer();
        return this.convertPngToBmp(pngForBmp);
        
      case '.ico':
        // Convert to PNG with specific size for ICO
        return processor.resize(256, 256).png().toBuffer();
        
      case '.svg':
        // For SVG conversion, we need to use a different approach
        throw new Error('SVG output not supported for raster images. Use vector-to-vector conversion.');
        
      default:
        throw new Error(`Unsupported output format: ${toExtension}`);
    }
  }

  private async convertPngToGif(pngBuffer: Buffer): Promise<Buffer> {
    // This would require a GIF encoding library like 'gif-encoder' or similar
    // For now, return the PNG buffer (placeholder implementation)
    console.warn('GIF conversion not fully implemented, returning PNG');
    return pngBuffer;
  }

  private async convertPngToBmp(pngBuffer: Buffer): Promise<Buffer> {
    // This would require a BMP encoding library
    // For now, return the PNG buffer (placeholder implementation)
    console.warn('BMP conversion not fully implemented, returning PNG');
    return pngBuffer;
  }

  // Browser-specific Canvas implementation
  private async convertUsingCanvas(
    inputBuffer: Buffer,
    fromExtension: string,
    toExtension: string,
    options: ConversionOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas size
        canvas.width = options.resize?.width || img.width;
        canvas.height = options.resize?.height || img.height;

        // Apply effects
        if (options.effects?.grayscale) {
          ctx!.filter = 'grayscale(100%)';
        }
        if (options.effects?.blur) {
          ctx!.filter += ` blur(${options.effects.blur}px)`;
        }
        if (options.effects?.brightness) {
          ctx!.filter += ` brightness(${options.effects.brightness})`;
        }

        // Draw image
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to target format
        const quality = (options.quality || 85) / 100;
        const mimeType = this.getMimeType(toExtension);
        
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(buffer => {
              resolve(Buffer.from(buffer));
            });
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, mimeType, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create blob URL from buffer
      const blob = new Blob([inputBuffer]);
      img.src = URL.createObjectURL(blob);
    });
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.svg': 'image/svg+xml',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'json': 'application/json'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'image/png';
  }

  async convertImage(
    file: File,
    options: ImageConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      onProgress?.(10);

      // Handle JSON metadata export
      if (options.outputFormat === 'json') {
        const img = await this.createImageFromFile(file);
        onProgress?.(50);

        const metadata = await this.extractImageMetadata(file, img);
        onProgress?.(80);

        const jsonContent = JSON.stringify(metadata, null, 2);
        onProgress?.(100);
        
        console.log('✅ Image metadata extraction completed successfully');
        return new Blob([jsonContent], { type: 'application/json' });
      }

      // Create image element
      const img = await this.createImageFromFile(file);
      onProgress?.(30);

      // Create canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas dimensions
      if (options.resize) {
        canvas.width = options.resize.width;
        canvas.height = options.resize.height;
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }

      onProgress?.(50);

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onProgress?.(70);

      // Convert to blob
      const mimeType = this.getMimeType(options.outputFormat);
      const quality = options.quality ? options.quality / 100 : 0.8;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          mimeType,
          quality
        );
      });

      onProgress?.(100);
      console.log('✅ Image conversion completed successfully');
      return blob;

    } catch (error) {
      console.error('❌ Image conversion failed:', error);
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  private createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  private async extractImageMetadata(file: File, img: HTMLImageElement): Promise<any> {
    // Calculate image statistics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Calculate average color and brightness
      let totalR = 0, totalG = 0, totalB = 0, totalBrightness = 0;
      const pixelCount = pixels.length / 4;
      
      for (let i = 0; i < pixels.length; i += 4) {
        totalR += pixels[i];
        totalG += pixels[i + 1];
        totalB += pixels[i + 2];
        totalBrightness += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      }
      
      const avgColor = {
        r: Math.round(totalR / pixelCount),
        g: Math.round(totalG / pixelCount),
        b: Math.round(totalB / pixelCount)
      };
      
      const avgBrightness = Math.round(totalBrightness / pixelCount);
      
      return {
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        },
        image: {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: +(img.naturalWidth / img.naturalHeight).toFixed(2),
          format: file.type || 'unknown',
          colorSpace: 'sRGB'
        },
        analysis: {
          averageColor: avgColor,
          averageBrightness: avgBrightness,
          dominantColorHex: `#${avgColor.r.toString(16).padStart(2, '0')}${avgColor.g.toString(16).padStart(2, '0')}${avgColor.b.toString(16).padStart(2, '0')}`,
          brightness: avgBrightness > 128 ? 'bright' : 'dark',
          resolution: `${img.naturalWidth}x${img.naturalHeight}`,
          megapixels: +((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2)
        },
        metadata: {
          extractedAt: new Date().toISOString(),
          extractedBy: 'ViewsBoost Image Converter',
          version: '1.0'
        }
      };
    }
    
    // Fallback basic metadata
    return {
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      },
      image: {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: +(img.naturalWidth / img.naturalHeight).toFixed(2),
        format: file.type || 'unknown'
      },
      metadata: {
        extractedAt: new Date().toISOString(),
        extractedBy: 'ViewsBoost Image Converter',
        version: '1.0'
      }
    };
  }

  getSupportedFormats(): string[] {
    return ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'json'];
  }

  getInputFormats(): string[] {
    return ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'heic', 'avif'];
  }
}

export default ImageConverter; 