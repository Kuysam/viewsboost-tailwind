// Browser-compatible file detector
export interface FileFormat {
  extension: string;
  mimeType: string;
  category: 'video' | 'audio' | 'image' | 'document' | 'adobe' | 'archive' | 'font';
  name: string;
}

export class FileDetector {
  private static readonly SUPPORTED_FORMATS: Record<string, FileFormat> = {
    // Video formats
    'mp4': { extension: 'mp4', mimeType: 'video/mp4', category: 'video', name: 'MP4 Video' },
    'avi': { extension: 'avi', mimeType: 'video/x-msvideo', category: 'video', name: 'AVI Video' },
    'mov': { extension: 'mov', mimeType: 'video/quicktime', category: 'video', name: 'QuickTime Video' },
    'mkv': { extension: 'mkv', mimeType: 'video/x-matroska', category: 'video', name: 'Matroska Video' },
    'webm': { extension: 'webm', mimeType: 'video/webm', category: 'video', name: 'WebM Video' },
    'flv': { extension: 'flv', mimeType: 'video/x-flv', category: 'video', name: 'Flash Video' },
    'wmv': { extension: 'wmv', mimeType: 'video/x-ms-wmv', category: 'video', name: 'Windows Media Video' },
    'm4v': { extension: 'm4v', mimeType: 'video/x-m4v', category: 'video', name: 'iTunes Video' },
    '3gp': { extension: '3gp', mimeType: 'video/3gpp', category: 'video', name: '3GP Video' },

    // Audio formats
    'mp3': { extension: 'mp3', mimeType: 'audio/mpeg', category: 'audio', name: 'MP3 Audio' },
    'wav': { extension: 'wav', mimeType: 'audio/wav', category: 'audio', name: 'WAV Audio' },
    'aac': { extension: 'aac', mimeType: 'audio/aac', category: 'audio', name: 'AAC Audio' },
    'ogg': { extension: 'ogg', mimeType: 'audio/ogg', category: 'audio', name: 'OGG Audio' },
    'flac': { extension: 'flac', mimeType: 'audio/flac', category: 'audio', name: 'FLAC Audio' },
    'wma': { extension: 'wma', mimeType: 'audio/x-ms-wma', category: 'audio', name: 'Windows Media Audio' },
    'm4a': { extension: 'm4a', mimeType: 'audio/x-m4a', category: 'audio', name: 'M4A Audio' },
    'aiff': { extension: 'aiff', mimeType: 'audio/aiff', category: 'audio', name: 'AIFF Audio' },
    'au': { extension: 'au', mimeType: 'audio/basic', category: 'audio', name: 'AU Audio' },

    // Image formats
    'jpg': { extension: 'jpg', mimeType: 'image/jpeg', category: 'image', name: 'JPEG Image' },
    'jpeg': { extension: 'jpeg', mimeType: 'image/jpeg', category: 'image', name: 'JPEG Image' },
    'png': { extension: 'png', mimeType: 'image/png', category: 'image', name: 'PNG Image' },
    'gif': { extension: 'gif', mimeType: 'image/gif', category: 'image', name: 'GIF Image' },
    'webp': { extension: 'webp', mimeType: 'image/webp', category: 'image', name: 'WebP Image' },
    'bmp': { extension: 'bmp', mimeType: 'image/bmp', category: 'image', name: 'BMP Image' },
    'tiff': { extension: 'tiff', mimeType: 'image/tiff', category: 'image', name: 'TIFF Image' },
    'svg': { extension: 'svg', mimeType: 'image/svg+xml', category: 'image', name: 'SVG Image' },
    'ico': { extension: 'ico', mimeType: 'image/x-icon', category: 'image', name: 'Icon Image' },
    'heic': { extension: 'heic', mimeType: 'image/heic', category: 'image', name: 'HEIC Image' },
    'avif': { extension: 'avif', mimeType: 'image/avif', category: 'image', name: 'AVIF Image' },

    // Document formats
    'pdf': { extension: 'pdf', mimeType: 'application/pdf', category: 'document', name: 'PDF Document' },
    'docx': { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', name: 'Word Document' },
    'doc': { extension: 'doc', mimeType: 'application/msword', category: 'document', name: 'Word Document (Legacy)' },
    'html': { extension: 'html', mimeType: 'text/html', category: 'document', name: 'HTML Document' },
    'rtf': { extension: 'rtf', mimeType: 'application/rtf', category: 'document', name: 'Rich Text Format' },
    'txt': { extension: 'txt', mimeType: 'text/plain', category: 'document', name: 'Text Document' },
    'md': { extension: 'md', mimeType: 'text/markdown', category: 'document', name: 'Markdown Document' },
    'csv': { extension: 'csv', mimeType: 'text/csv', category: 'document', name: 'CSV Document' },
    'json': { extension: 'json', mimeType: 'application/json', category: 'document', name: 'JSON Document' },

    // Adobe formats
    'aep': { extension: 'aep', mimeType: 'application/octet-stream', category: 'adobe', name: 'After Effects Project' },
    'mogrt': { extension: 'mogrt', mimeType: 'application/octet-stream', category: 'adobe', name: 'Motion Graphics Template' },
    'psd': { extension: 'psd', mimeType: 'image/vnd.adobe.photoshop', category: 'adobe', name: 'Photoshop Document' },
    'ai': { extension: 'ai', mimeType: 'application/postscript', category: 'adobe', name: 'Adobe Illustrator' },
    'eps': { extension: 'eps', mimeType: 'application/postscript', category: 'adobe', name: 'Encapsulated PostScript' },

    // Archive formats
    'zip': { extension: 'zip', mimeType: 'application/zip', category: 'archive', name: 'ZIP Archive' },
    'rar': { extension: 'rar', mimeType: 'application/x-rar-compressed', category: 'archive', name: 'RAR Archive' },
    '7z': { extension: '7z', mimeType: 'application/x-7z-compressed', category: 'archive', name: '7-Zip Archive' },
    'tar': { extension: 'tar', mimeType: 'application/x-tar', category: 'archive', name: 'TAR Archive' },
    'gz': { extension: 'gz', mimeType: 'application/gzip', category: 'archive', name: 'GZip Archive' },
    'bz2': { extension: 'bz2', mimeType: 'application/x-bzip2', category: 'archive', name: 'BZip2 Archive' },

    // Font formats
    'ttf': { extension: 'ttf', mimeType: 'font/ttf', category: 'font', name: 'TrueType Font' },
    'otf': { extension: 'otf', mimeType: 'font/otf', category: 'font', name: 'OpenType Font' },
    'woff': { extension: 'woff', mimeType: 'font/woff', category: 'font', name: 'Web Open Font Format' },
    'woff2': { extension: 'woff2', mimeType: 'font/woff2', category: 'font', name: 'Web Open Font Format 2' },
    'eot': { extension: 'eot', mimeType: 'application/vnd.ms-fontobject', category: 'font', name: 'Embedded OpenType' }
  };

  detectFormat(file: File): FileFormat | null {
    // First try to detect by file extension
    const extension = this.getFileExtension(file.name);
    if (extension && FileDetector.SUPPORTED_FORMATS[extension]) {
      return FileDetector.SUPPORTED_FORMATS[extension];
    }

    // Fallback to MIME type detection
    return this.detectByMimeType(file.type);
  }

  getFileCategory(file: File): string | null {
    const format = this.detectFormat(file);
    return format ? format.category : null;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private detectByMimeType(mimeType: string): FileFormat | null {
    // Find format by MIME type
    for (const format of Object.values(FileDetector.SUPPORTED_FORMATS)) {
      if (format.mimeType === mimeType) {
        return format;
      }
    }

    // Try partial MIME type matching
    for (const format of Object.values(FileDetector.SUPPORTED_FORMATS)) {
      if (mimeType && mimeType.includes(format.mimeType.split('/')[1])) {
        return format;
      }
    }

    return null;
  }

  getAllSupportedFormats(): Record<string, FileFormat> {
    return FileDetector.SUPPORTED_FORMATS;
  }

  getSupportedExtensions(): string[] {
    return Object.keys(FileDetector.SUPPORTED_FORMATS);
  }

  getSupportedCategories(): string[] {
    const categories = new Set<string>();
    Object.values(FileDetector.SUPPORTED_FORMATS).forEach(format => {
      categories.add(format.category);
    });
    return Array.from(categories);
  }

  getFormatsByCategory(category: string): FileFormat[] {
    return Object.values(FileDetector.SUPPORTED_FORMATS).filter(
      format => format.category === category
    );
  }

  isSupported(file: File): boolean {
    return this.detectFormat(file) !== null;
  }
} 