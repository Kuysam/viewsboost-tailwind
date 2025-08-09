// Unified Template Loading System
// Consolidates template loading logic from Studio.tsx and TemplatesPanel.tsx

import { fabric } from 'fabric';
import { FirebaseStorageMapper } from './services/firebaseStorageMapper';

export interface Template {
  id: string;
  title: string;
  category: string;
  desc?: string;
  preview?: string;
  videoSource?: string;
  imageUrl?: string;
  type?: 'video' | 'image';
  isPremium?: boolean;
  isNew?: boolean;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export class TemplateLoader {
  private static videoRenderLoops = new Map<string, number>();

  /**
   * Load a template into a Fabric.js canvas
   */
  static async loadTemplate(
    template: Template, 
    canvas: fabric.Canvas, 
    canvasSize: CanvasSize = { width: 800, height: 600 }
  ): Promise<boolean> {
    try {
      console.log('🎨 [TemplateLoader] Loading template:', template.title);

      if (!template || !template.title) {
        console.error('❌ [TemplateLoader] Invalid template data');
        return false;
      }

      if (!canvas) {
        console.error('❌ [TemplateLoader] Canvas not available');
        return false;
      }

      // Clear canvas and show loading state
      this.showLoadingState(canvas, canvasSize, `Loading ${template.title}...`);

      // Determine template type
      const isVideoTemplate = this.isVideoTemplate(template);
      console.log('🔍 [TemplateLoader] Template type:', isVideoTemplate ? 'video' : 'image');

      // Get best URL using FirebaseStorageMapper
      const result = await FirebaseStorageMapper.getBestUrl(template.title, isVideoTemplate);
      
      console.log('✅ [TemplateLoader] URL result:', result);

      // If we have a real Firebase Storage URL, try to load it
      if (result.url && (result.url.includes('firebasestorage.googleapis.com') || result.url.includes('firebase'))) {
        console.log('🔥 [TemplateLoader] Trying Firebase Storage URL:', result.url);
        
        // Load template based on type
        if (result.type === 'video') {
          const success = await this.loadVideoTemplate(result.url, canvas, canvasSize, template);
          if (success) return true;
        } else {
          const success = await this.loadImageTemplate(result.url, canvas, canvasSize, template);
          if (success) return true;
        }
        
        console.warn('⚠️ [TemplateLoader] Firebase URL failed, showing placeholder');
      }

      // ✅ FALLBACK: Show canvas-based placeholder (no external URL needed)
      console.log('🎨 [TemplateLoader] Using canvas-based placeholder for:', template.title);
      this.showTemplatePlaceholder(canvas, canvasSize, template.title);
      return true; // Consider placeholder as success

    } catch (error) {
      console.error('❌ [TemplateLoader] Template loading failed:', error);
      this.showEmptyState(canvas, canvasSize);
      return false;
    }
  }

  /**
   * Determine if template should be treated as video
   */
  private static isVideoTemplate(template: Template): boolean {
    return !!(
      template.type === 'video' ||
      template.videoSource?.includes('.mp4') ||
      template.title?.toLowerCase().includes('tiktok') ||
      template.title?.toLowerCase().includes('tikinsta') ||
      template.title?.toLowerCase().includes('fcb') ||
      template.category?.toLowerCase().includes('video')
    );
  }

  /**
   * Load video template with proper Fabric.js integration
   */
  private static async loadVideoTemplate(
    videoUrl: string,
    canvas: fabric.Canvas,
    canvasSize: CanvasSize,
    template: Template
  ): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('📺 [TemplateLoader] Loading video:', videoUrl);

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.autoplay = false;
      video.loop = true;
      video.muted = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.setAttribute('crossorigin', 'anonymous');
      video.setAttribute('webkit-playsinline', 'true');

      const timeoutId = setTimeout(() => {
        console.warn('⏰ [TemplateLoader] Video loading timeout');
        // Try image fallback
        this.tryImageFallback(template, canvas, canvasSize).then(resolve);
      }, 15000);

      video.onloadeddata = () => {
        clearTimeout(timeoutId);
        
        try {
          // Clear loading state
          canvas.clear();

          // ✅ CRITICAL: Create video object with proper Fabric.js settings
          const videoObject = new fabric.Image(video, {
            left: canvasSize.width / 2,
            top: canvasSize.height / 2,
            originX: 'center',
            originY: 'center',
            selectable: true,
            evented: true,
            objectCaching: false, // ✅ CRITICAL for video elements
            crossOrigin: 'anonymous',
          });

          // Scale to fit canvas
          const scale = this.calculateScale(
            video.videoWidth || 1920,
            video.videoHeight || 1080,
            canvasSize.width,
            canvasSize.height
          );
          
          videoObject.scale(scale);

          // Add metadata
          Object.assign(videoObject, {
            type: 'video',
            id: `video-${Date.now()}`,
            videoElement: video,
            templateId: template.id
          });

          canvas.add(videoObject);
          canvas.renderAll();

          // ✅ Start video playback with continuous rendering
          video.play()
            .then(() => {
              this.startVideoRendering(video, canvas, template.id);
              console.log('✅ [TemplateLoader] Video template loaded successfully');
              resolve(true);
            })
            .catch(error => {
              console.warn('⚠️ [TemplateLoader] Video autoplay failed:', error);
              resolve(true); // Still success - we have the frame
            });

        } catch (error) {
          console.error('❌ [TemplateLoader] Video object creation failed:', error);
          this.tryImageFallback(template, canvas, canvasSize).then(resolve);
        }
      };

      video.onerror = () => {
        clearTimeout(timeoutId);
        console.error('❌ [TemplateLoader] Video loading failed');
        this.tryImageFallback(template, canvas, canvasSize).then(resolve);
      };
    });
  }

  /**
   * Load image template with proper error handling
   */
  private static async loadImageTemplate(
    imageUrl: string,
    canvas: fabric.Canvas,
    canvasSize: CanvasSize,
    template: Template
  ): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🖼️ [TemplateLoader] Loading image:', imageUrl);

      const timeoutId = setTimeout(() => {
        console.warn('⏰ [TemplateLoader] Image loading timeout for:', imageUrl);
        // ✅ FALLBACK: Use canvas-based placeholder on timeout
        this.showTemplatePlaceholder(canvas, canvasSize, template.title);
        resolve(true); // Consider placeholder as success
      }, 8000); // Reduced timeout to 8 seconds for faster fallback

      fabric.util.loadImage(
        imageUrl,
        (img, isError) => {
          clearTimeout(timeoutId);

          if (isError || !img) {
            console.error('❌ [TemplateLoader] Image loading failed for URL:', imageUrl);
            console.error('❌ [TemplateLoader] Error details:', isError);
            
            // ✅ FALLBACK: Use canvas-based placeholder instead of empty state
            this.showTemplatePlaceholder(canvas, canvasSize, template.title);
            resolve(true); // Consider placeholder as success
            return;
          }

          try {
            // Clear loading state
            canvas.clear();

            // Scale image to fit canvas
            const scale = this.calculateScale(
              img.width || 1920,
              img.height || 1080,
              canvasSize.width,
              canvasSize.height
            );

            img.set({
              left: canvasSize.width / 2,
              top: canvasSize.height / 2,
              originX: 'center',
              originY: 'center',
              scaleX: scale,
              scaleY: scale,
            });

            canvas.setBackgroundImage(img, () => {
              canvas.renderAll();
              console.log('✅ [TemplateLoader] Image template loaded successfully');
              resolve(true);
            });

          } catch (error) {
            console.error('❌ [TemplateLoader] Image processing failed:', error);
            // ✅ FALLBACK: Use canvas-based placeholder
            this.showTemplatePlaceholder(canvas, canvasSize, template.title);
            resolve(true); // Consider placeholder as success
          }
        },
        null,
        { crossOrigin: 'anonymous' }
      );
    });
  }

  /**
   * Try to load image fallback when video fails
   */
  private static async tryImageFallback(
    template: Template,
    canvas: fabric.Canvas,
    canvasSize: CanvasSize
  ): Promise<boolean> {
    console.log('🔄 [TemplateLoader] Trying image fallback for:', template.title);
    
    // Try to get an image URL for this template
    const result = await FirebaseStorageMapper.getBestUrl(template.title, false);
    
    if (result.url && result.url.includes('firebasestorage.googleapis.com')) {
      const success = await this.loadImageTemplate(result.url, canvas, canvasSize, template);
      if (success) return true;
    }
    
    // ✅ FALLBACK: Use canvas-based placeholder instead of empty state
    console.log('🎨 [TemplateLoader] Using placeholder fallback for video:', template.title);
    this.showTemplatePlaceholder(canvas, canvasSize, template.title);
    return true; // Consider placeholder as success
  }

  /**
   * Calculate scale to fit content in canvas while maintaining aspect ratio
   */
  private static calculateScale(
    contentWidth: number,
    contentHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): number {
    const contentAspect = contentWidth / contentHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    
    if (contentAspect > canvasAspect) {
      // Content is wider - fit to width
      return (canvasWidth * 0.9) / contentWidth;
    } else {
      // Content is taller - fit to height
      return (canvasHeight * 0.9) / contentHeight;
    }
  }

  /**
   * Start continuous rendering for video element
   */
  private static startVideoRendering(video: HTMLVideoElement, canvas: fabric.Canvas, templateId: string) {
    // Stop any existing render loop for this template
    if (this.videoRenderLoops.has(templateId)) {
      cancelAnimationFrame(this.videoRenderLoops.get(templateId)!);
    }

    const renderFrame = () => {
      if (canvas && video && !video.paused && !video.ended) {
        canvas.renderAll();
        const frameId = requestAnimationFrame(renderFrame);
        this.videoRenderLoops.set(templateId, frameId);
      } else {
        this.videoRenderLoops.delete(templateId);
      }
    };

    video.addEventListener('play', () => {
      const frameId = requestAnimationFrame(renderFrame);
      this.videoRenderLoops.set(templateId, frameId);
    });

    video.addEventListener('pause', () => {
      if (this.videoRenderLoops.has(templateId)) {
        cancelAnimationFrame(this.videoRenderLoops.get(templateId)!);
        this.videoRenderLoops.delete(templateId);
      }
    });
  }

  /**
   * Show loading state on canvas
   */
  private static showLoadingState(canvas: fabric.Canvas, canvasSize: CanvasSize, message: string = 'Loading...') {
    canvas.clear();

    const loadingBg = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      fill: '#f8f9fa',
      selectable: false,
      evented: false
    });

    const loadingText = new fabric.Text(message, {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 18,
      fill: '#6c757d',
      fontFamily: 'Arial, sans-serif',
      selectable: false,
      evented: false
    });

    canvas.add(loadingBg, loadingText);
    canvas.renderAll();
  }

  /**
   * Show template placeholder directly on canvas (no external URLs needed)
   */
  private static showTemplatePlaceholder(canvas: fabric.Canvas, canvasSize: CanvasSize, templateTitle: string) {
    console.log('🎨 [TemplateLoader] Creating canvas-based placeholder for:', templateTitle);
    canvas.clear();

    // Background with template-like appearance
    const bg = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      fill: '#f8fafc',
      stroke: '#e2e8f0',
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    // Title text
    const titleText = new fabric.Text(templateTitle, {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2 - 30,
      originX: 'center',
      originY: 'center',
      fontSize: Math.min(32, Math.max(16, canvasSize.width / 20)),
      fill: '#1e293b',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      selectable: false,
      evented: false
    });

    // Subtitle
    const subtitle = new fabric.Text('Template Preview', {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2 + 10,
      originX: 'center',
      originY: 'center',
      fontSize: Math.min(16, Math.max(12, canvasSize.width / 40)),
      fill: '#64748b',
      fontFamily: 'Arial, sans-serif',
      selectable: false,
      evented: false
    });

    // Decorative elements
    const icon = new fabric.Text('🎨', {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2 - 80,
      originX: 'center',
      originY: 'center',
      fontSize: 48,
      selectable: false,
      evented: false
    });

    canvas.add(bg, icon, titleText, subtitle);
    canvas.renderAll();
  }

  /**
   * Show empty state on canvas
   */
  private static showEmptyState(canvas: fabric.Canvas, canvasSize: CanvasSize) {
    canvas.clear();

    const emptyBg = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasSize.width,
      height: canvasSize.height,
      fill: '#ffffff',
      stroke: '#e9ecef',
      strokeWidth: 2,
      strokeDashArray: [10, 5],
      selectable: false,
      evented: false
    });

    const placeholder = new fabric.Text('Select a template to get started', {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 24,
      fill: '#666',
      fontFamily: 'Arial, sans-serif',
      selectable: false,
      evented: false
    });

    canvas.add(emptyBg, placeholder);
    canvas.renderAll();
  }

  /**
   * Stop all video rendering loops
   */
  static stopAllVideoRendering() {
    this.videoRenderLoops.forEach((frameId) => {
      cancelAnimationFrame(frameId);
    });
    this.videoRenderLoops.clear();
  }
}