import { ConversionOptions, ConversionProgress, ConversionResult } from '../core/ConverterFactory';

// Browser-compatible archive converter (limited functionality)
export class ArchiveConverter {
  async extractArchive(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      onProgress?.(10);

      // For browser compatibility, we'll create a simple report of the archive
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
        note: 'Archive extraction requires server-side processing in production environments',
        browserLimitation: 'Full archive extraction not available in browser'
      };

      onProgress?.(100);

      const report = JSON.stringify(metadata, null, 2);
      return new Blob([report], { type: 'application/json' });

    } catch (error) {
      console.error('❌ Archive processing failed:', error);
      throw new Error(`Archive processing failed: ${error.message}`);
    }
  }

  getSupportedFormats(): string[] {
    return ['json']; // Only metadata report in browser
  }

  getInputFormats(): string[] {
    return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  }
}

export default ArchiveConverter; 