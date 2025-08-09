import * as PIXI from 'pixi.js';

// Timeline configuration
export interface TimelineConfig {
  width: number;
  height: number;
  trackHeight: number;
  rulerHeight: number;
  timeScale: number; // pixels per second
  backgroundColor: number;
  trackColors: {
    video: number;
    audio: number;
    text: number;
    graphics: number;
  };
  modernTheme: {
    primary: number;
    secondary: number;
    accent: number;
    surface: number;
    surfaceVariant: number;
    outline: number;
    shadow: number;
  };
}

// Timeline clip data
export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'text' | 'graphics' | 'image';
  trackIndex: number;
  startTime: number;
  duration: number;
  title: string;
  thumbnailUrl?: string;
  color: number;
  selected?: boolean;
  locked?: boolean;
  volume?: number;
  opacity?: number;
  effects?: string[];
  transitions?: {
    in?: 'fade' | 'slide' | 'zoom' | 'none';
    out?: 'fade' | 'slide' | 'zoom' | 'none';
    duration?: number;
  };
}

// Timeline events
export interface TimelineEvents {
  onClipSelect: (clip: TimelineClip) => void;
  onClipMove: (clip: TimelineClip, newStartTime: number, newTrackIndex: number) => void;
  onClipResize: (clip: TimelineClip, newDuration: number) => void;
  onPlayheadMove: (time: number) => void;
  onZoomChange: (scale: number) => void;
  onContextMenu?: (clip: TimelineClip | null, x: number, y: number) => void;
}

export class TimelineEngine {
  private app: PIXI.Application;
  private container: HTMLElement;
  private timelineContainer: PIXI.Container;
  private tracksContainer: PIXI.Container;
  private rulerContainer: PIXI.Container;
  private playheadContainer: PIXI.Container;
  private clipsContainer: PIXI.Container;
  
  private config: TimelineConfig;
  private clips: Map<string, TimelineClip> = new Map();
  private clipGraphics: Map<string, PIXI.Container> = new Map();
  private thumbnailTextures: Map<string, PIXI.Texture> = new Map();
  private events: TimelineEvents;
  
  private playheadPosition: number = 0; // in seconds
  private playheadGraphic: PIXI.Graphics | null = null;
  private isDragging: boolean = false;
  private dragData: {
    clip: TimelineClip;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null = null;

  // Resize state
  private isResizing: boolean = false;
  private resizeData: {
    clip: TimelineClip;
    mode: 'left' | 'right';
    startX: number;
    originalStart: number;
    originalDuration: number;
  } | null = null;

  // Tooltip for time display during resize
  private tooltip: PIXI.Text | null = null;
  
  // Magnetic snapping configuration
  private snapEnabled: boolean = true;
  private snapThreshold: number = 15; // pixels
  private snapIndicator: PIXI.Graphics | null = null;

  constructor(container: HTMLElement, config: TimelineConfig, events: TimelineEvents) {
    this.container = container;
    this.config = config;
    this.events = events;

    // Initialize PixiJS application
    this.app = new PIXI.Application({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add to DOM with error handling
    try {
      if (this.app.view && container) {
        container.appendChild(this.app.view as HTMLCanvasElement);
      }
    } catch (error) {
      console.error('❌ [Timeline] Failed to append canvas to container:', error);
      throw error;
    }

    // Create main containers
    this.timelineContainer = new PIXI.Container();
    this.rulerContainer = new PIXI.Container();
    this.tracksContainer = new PIXI.Container();
    this.clipsContainer = new PIXI.Container();
    this.playheadContainer = new PIXI.Container();

    // Set up container hierarchy
    this.app.stage.addChild(this.timelineContainer);
    this.timelineContainer.addChild(this.tracksContainer);
    this.timelineContainer.addChild(this.clipsContainer);
    this.timelineContainer.addChild(this.rulerContainer);
    this.timelineContainer.addChild(this.playheadContainer);

    // Position containers
    this.rulerContainer.y = 0;
    this.tracksContainer.y = config.rulerHeight;
    this.clipsContainer.y = config.rulerHeight;
    this.playheadContainer.y = 0;

    this.initializeTimeline();
    this.setupInteraction();
  }

  private initializeTimeline(): void {
    this.createTimeRuler();
    this.createTracks();
    this.createPlayhead();
  }

  private createTimeRuler(): void {
    const ruler = new PIXI.Graphics();
    
    // Modern gradient background
    const gradient = new PIXI.Graphics();
    gradient.beginFill(this.config.modernTheme.surface);
    gradient.drawRect(0, 0, this.config.width, this.config.rulerHeight);
    gradient.endFill();
    
    // Add subtle shadow effect
    const shadow = new PIXI.Graphics();
    shadow.beginFill(this.config.modernTheme.shadow, 0.1);
    shadow.drawRect(0, this.config.rulerHeight - 2, this.config.width, 2);
    shadow.endFill();

    // Bottom border with modern color
    ruler.lineStyle(1, this.config.modernTheme.outline, 0.3);
    ruler.moveTo(0, this.config.rulerHeight - 1);
    ruler.lineTo(this.config.width, this.config.rulerHeight - 1);

    // Time markers with modern styling
    const totalSeconds = this.config.width / this.config.timeScale;
    const secondInterval = 1;
    const fiveSecondInterval = 5;
    const tenSecondInterval = 10;

    for (let second = 0; second <= totalSeconds; second += secondInterval) {
      const x = second * this.config.timeScale;
      const isMajor = second % tenSecondInterval === 0;
      const isMinor = second % fiveSecondInterval === 0;
      
      // Different tick heights for better hierarchy
      let tickHeight = 4;
      let tickColor = this.config.modernTheme.outline;
      let tickAlpha = 0.4;
      
      if (isMajor) {
        tickHeight = 18;
        tickColor = this.config.modernTheme.primary;
        tickAlpha = 0.8;
      } else if (isMinor) {
        tickHeight = 12;
        tickAlpha = 0.6;
      }
      
      ruler.lineStyle(1, tickColor, tickAlpha);
      ruler.moveTo(x, this.config.rulerHeight - tickHeight);
      ruler.lineTo(x, this.config.rulerHeight - 1);

      // Add time labels for major marks with modern typography
      if (isMajor) {
        const minutes = Math.floor(second / 60);
        const seconds = second % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const text = new PIXI.Text(timeText, {
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 11,
          fill: this.config.modernTheme.primary,
          fontWeight: '600',
          letterSpacing: 0.5,
        });
        text.x = x + 4;
        text.y = 4;
        ruler.addChild(text);
      }
    }

    ruler.addChild(gradient);
    ruler.addChild(shadow);
    this.rulerContainer.addChild(ruler);
  }

  private createTracks(): void {
    // Only Video track by default. Audio track can be added later from sidebar.
    const trackTypes = [
      { type: 'video', color: this.config.trackColors.video },
    ] as const;
    
    trackTypes.forEach((trackConfig, index) => {
      const track = new PIXI.Graphics();
      const y = index * this.config.trackHeight;
      
      // Modern track background with subtle gradient
      const gradient = this.createTrackGradient(trackConfig.color, y);
      track.addChild(gradient);
      
      // Track separators with modern styling
      if (index > 0) {
        track.lineStyle(1, this.config.modernTheme.outline, 0.2);
        track.moveTo(0, y);
        track.lineTo(this.config.width, y);
      }
      
      // Add subtle inner shadow for depth
      const innerShadow = new PIXI.Graphics();
      innerShadow.beginFill(this.config.modernTheme.shadow, 0.05);
      innerShadow.drawRect(0, y + 1, this.config.width, 2);
      innerShadow.endFill();
      track.addChild(innerShadow);

      this.tracksContainer.addChild(track);
    });
  }
  
  private createTrackGradient(baseColor: number, y: number): PIXI.Graphics {
    const gradient = new PIXI.Graphics();
    
    // Create subtle gradient effect
    gradient.beginFill(baseColor);
    gradient.drawRect(0, y, this.config.width, this.config.trackHeight);
    gradient.endFill();
    
    // Add highlight at top
    gradient.beginFill(this.config.modernTheme.surfaceVariant, 0.1);
    gradient.drawRect(0, y, this.config.width, 1);
    gradient.endFill();
    
    return gradient;
  }

  private createPlayhead(): void {
    this.playheadGraphic = new PIXI.Graphics();
    
    // Modern playhead with accent color and glow effect
    const playheadColor = this.config.modernTheme.accent;
    
    // Playhead line with modern styling
    this.playheadGraphic.lineStyle(3, playheadColor, 0.9);
    this.playheadGraphic.moveTo(0, 0);
    this.playheadGraphic.lineTo(0, this.config.height);
    
    // Add glow effect
    const glow = new PIXI.Graphics();
    glow.lineStyle(6, playheadColor, 0.3);
    glow.moveTo(0, 0);
    glow.lineTo(0, this.config.height);
    this.playheadGraphic.addChild(glow);
    
    // Modern playhead handle - rounded triangle
    const handle = new PIXI.Graphics();
    handle.beginFill(playheadColor);
    handle.drawRoundedRect(-8, -2, 16, 14, 3);
    handle.endFill();
    
    // Add handle shadow
    const handleShadow = new PIXI.Graphics();
    handleShadow.beginFill(this.config.modernTheme.shadow, 0.4);
    handleShadow.drawRoundedRect(-7, 0, 14, 12, 3);
    handleShadow.endFill();
    
    this.playheadGraphic.addChild(handleShadow);
    this.playheadGraphic.addChild(handle);

    this.playheadContainer.addChild(this.playheadGraphic);
    this.updatePlayheadPosition();
  }

  private async loadThumbnail(url: string): Promise<PIXI.Texture | null> {
    if (this.thumbnailTextures.has(url)) {
      return this.thumbnailTextures.get(url)!;
    }

    try {
      const texture = await PIXI.Assets.load(url);
      this.thumbnailTextures.set(url, texture);
      return texture;
    } catch (error) {
      console.warn('Failed to load thumbnail:', url, error);
      return null;
    }
  }

  private setupInteraction(): void {
    // Enable interaction
    this.app.stage.interactive = true;
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
    this.app.stage.on('rightclick', this.onRightClick.bind(this));

    // Ruler click for playhead positioning
    this.rulerContainer.interactive = true;
    this.rulerContainer.on('pointerdown', (event) => {
      const x = event.data.global.x;
      const time = x / this.config.timeScale;
      this.setPlayheadPosition(time);
      this.events.onPlayheadMove(time);
    });
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    const globalPos = event.data.global;
    
    // Check if clicking on a clip
    for (const [clipId, clipGraphic] of this.clipGraphics) {
      const bounds = clipGraphic.getBounds();
      if (bounds.contains(globalPos.x, globalPos.y)) {
        const clip = this.clips.get(clipId)!;
        this.selectClip(clip);

        // Option/Alt-drag duplicate
        const altPressed = (event.data.originalEvent as any)?.altKey;
        let targetClip = clip;
        if (altPressed) {
          const clone: TimelineClip = { ...clip, id: `${clip.id}_copy_${Date.now()}`, startTime: clip.startTime + 0.1 };
          this.addClip(clone);
          targetClip = clone;
        }

        // Detect edge resize (8px area)
        const localX = globalPos.x - bounds.x;
        const edgeZone = 8;
        if (localX <= edgeZone) {
          this.isResizing = true;
          this.resizeData = {
            clip: targetClip,
            mode: 'left',
            startX: globalPos.x,
            originalStart: targetClip.startTime,
            originalDuration: targetClip.duration,
          };
          this.showTooltip(globalPos.x, bounds.y - 18, targetClip.startTime, targetClip.duration);
          return;
        }
        if (localX >= bounds.width - edgeZone) {
          this.isResizing = true;
          this.resizeData = {
            clip: targetClip,
            mode: 'right',
            startX: globalPos.x,
            originalStart: targetClip.startTime,
            originalDuration: targetClip.duration,
          };
          this.showTooltip(globalPos.x, bounds.y - 18, targetClip.startTime, targetClip.duration);
          return;
        }

        // Start dragging
        this.isDragging = true;
        this.dragData = {
          clip: targetClip,
          startX: globalPos.x,
          startY: globalPos.y,
          offsetX: globalPos.x - bounds.x,
          offsetY: globalPos.y - bounds.y,
        };
        return;
      }
    }
    
    // Clear selection if clicking empty area
    this.clearSelection();
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isResizing && this.resizeData) {
      const globalPos = event.data.global;
      const dx = globalPos.x - this.resizeData.startX;
      const deltaSeconds = dx / this.config.timeScale;
      const clip = this.resizeData.clip;
      const clipGraphic = this.clipGraphics.get(clip.id);
      if (!clipGraphic) return;

      let newStart = this.resizeData.originalStart;
      let newDuration = this.resizeData.originalDuration;

      if (this.resizeData.mode === 'left') {
        newStart = Math.max(0, this.resizeData.originalStart + deltaSeconds);
        const endTime = this.resizeData.originalStart + this.resizeData.originalDuration;
        newDuration = Math.max(0.1, endTime - newStart);
      } else {
        newDuration = Math.max(0.1, this.resizeData.originalDuration + deltaSeconds);
      }

      const snapped = this.getSnappedTime(newStart, clip.id);
      if (snapped && this.resizeData.mode === 'left') {
        newStart = snapped.time;
        newDuration = Math.max(0.1, (this.resizeData.originalStart + this.resizeData.originalDuration) - newStart);
      }

      clipGraphic.x = newStart * this.config.timeScale;
      const newWidth = newDuration * this.config.timeScale;
      clipGraphic.width = Math.max(10, newWidth);

      this.showTooltip(globalPos.x, clipGraphic.getBounds().y - 18, newStart, newDuration);
      return;
    }

    if (!this.isDragging || !this.dragData) return;

    const globalPos = event.data.global;
    const newX = globalPos.x - this.dragData.offsetX;
    const newY = globalPos.y - this.dragData.offsetY - this.config.rulerHeight;
    
    // Calculate new time and track
    let newStartTime = Math.max(0, newX / this.config.timeScale);
    const newTrackIndex = Math.max(0, Math.min(3, Math.floor(newY / this.config.trackHeight))); // 0-3 for 4 tracks
    
    // Apply magnetic snapping
    if (this.snapEnabled) {
      const snappedTime = this.getSnappedTime(newStartTime, this.dragData.clip.id);
      if (snappedTime !== null) {
        newStartTime = snappedTime.time;
        this.showSnapIndicator(snappedTime.time, snappedTime.type);
      } else {
        this.hideSnapIndicator();
      }
    }
    
    // Update clip position visually
    const clipGraphic = this.clipGraphics.get(this.dragData.clip.id);
    if (clipGraphic) {
      clipGraphic.x = newStartTime * this.config.timeScale;
      clipGraphic.y = newTrackIndex * this.config.trackHeight;
    }
  }

  private onPointerUp(): void {
    if (this.isResizing && this.resizeData) {
      const clipGraphic = this.clipGraphics.get(this.resizeData.clip.id);
      if (clipGraphic) {
        const newStartTime = clipGraphic.x / this.config.timeScale;
        const newDuration = Math.max(0.1, clipGraphic.width / this.config.timeScale);
        this.resizeData.clip.startTime = newStartTime;
        this.resizeData.clip.duration = newDuration;
        this.events.onClipResize(this.resizeData.clip, newDuration);
      }
      this.isResizing = false;
      this.resizeData = null;
      this.hideTooltip();
    }

    if (this.isDragging && this.dragData) {
      const clipGraphic = this.clipGraphics.get(this.dragData.clip.id);
      if (clipGraphic) {
        const newStartTime = clipGraphic.x / this.config.timeScale;
        const newTrackIndex = Math.floor(clipGraphic.y / this.config.trackHeight);
        
        // Update clip data
        this.dragData.clip.startTime = newStartTime;
        this.dragData.clip.trackIndex = newTrackIndex;
        
        // Notify event
        this.events.onClipMove(this.dragData.clip, newStartTime, newTrackIndex);
      }
    }
    
    // Hide snap indicator
    this.hideSnapIndicator();
    
    this.isDragging = false;
    this.dragData = null;
  }

  private onRightClick(event: PIXI.FederatedPointerEvent): void {
    event.stopPropagation();
    const globalPos = event.data.global;
    
    // Check if right-clicking on a clip
    for (const [clipId, clipGraphic] of this.clipGraphics) {
      const bounds = clipGraphic.getBounds();
      if (bounds.contains(globalPos.x, globalPos.y)) {
        const clip = this.clips.get(clipId)!;
        this.selectClip(clip);
        
        // Show context menu for clip
        if (this.events.onContextMenu) {
          this.events.onContextMenu(clip, globalPos.x, globalPos.y);
        }
        return;
      }
    }
    
    // Right-click on empty area
    if (this.events.onContextMenu) {
      this.events.onContextMenu(null, globalPos.x, globalPos.y);
    }
  }

  public addClip(clip: TimelineClip): void {
    this.clips.set(clip.id, clip);
    this.createClipGraphic(clip);
  }

  public removeClip(clipId: string): void {
    const clipGraphic = this.clipGraphics.get(clipId);
    if (clipGraphic) {
      this.clipsContainer.removeChild(clipGraphic);
      this.clipGraphics.delete(clipId);
    }
    this.clips.delete(clipId);
  }

  public updateClip(clip: TimelineClip): void {
    this.clips.set(clip.id, clip);
    this.recreateClipGraphic(clip);
  }

  private async createClipGraphic(clip: TimelineClip): Promise<void> {
    const container = new PIXI.Container();
    const width = clip.duration * this.config.timeScale;
    const height = this.config.trackHeight - 10; // More padding for modern look
    const borderRadius = 8; // Increased border radius for modern feel
    
    // Clip background with modern styling
    const background = new PIXI.Graphics();
    
    // Add drop shadow first
    const shadow = new PIXI.Graphics();
    shadow.beginFill(this.config.modernTheme.shadow, 0.3);
    shadow.drawRoundedRect(2, 6, width, height, borderRadius);
    shadow.endFill();
    container.addChild(shadow);
    
    if (clip.type === 'video') {
      // Modern video clips with enhanced styling
      this.createVideoClip(background, clip, width, height, borderRadius);
      
      // Add thumbnail if available
      if (clip.thumbnailUrl) {
        await this.addThumbnailsToClip(container, clip, width, height, borderRadius);
      }
    } else if (clip.type === 'audio') {
      // Modern audio clips with enhanced waveform
      this.createAudioClip(background, container, clip, width, height, borderRadius);
    } else if (clip.type === 'text') {
      // Modern text clips
      this.createTextClip(background, clip, width, height, borderRadius);
    } else if (clip.type === 'graphics') {
      // Modern graphics clips
      this.createGraphicsClip(background, clip, width, height, borderRadius);
    }
    
    // Modern selection border
    if (clip.selected) {
      const selectionBorder = new PIXI.Graphics();
      selectionBorder.lineStyle(3, this.config.modernTheme.accent, 1);
      selectionBorder.drawRoundedRect(-2, 3, width + 4, height + 4, borderRadius + 1);
      container.addChild(selectionBorder);
    }
    
    // Modern typography for title
    const titleText = new PIXI.Text(clip.title, {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 11,
      fill: 0xffffff,
      fontWeight: '600',
      dropShadow: {
        color: 0x000000,
        blur: 3,
        distance: 1,
        alpha: 0.7,
      },
    });
    titleText.x = 8;
    titleText.y = 8;
    
    // Modern duration display
    const durationText = new PIXI.Text(`${clip.duration.toFixed(1)}s`, {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 9,
      fill: 0xcccccc,
      fontWeight: '500',
      alpha: 0.8,
    });
    durationText.x = width - durationText.width - 8;
    durationText.y = height - 16;
    
    container.addChild(background);
    container.addChild(titleText);
    container.addChild(durationText);
    
    // Add transitions indicators
    if (clip.transitions) {
      this.addTransitionIndicators(container, clip, width, height);
    }
    
    // Add effects indicator
    if (clip.effects && clip.effects.length > 0) {
      const effectsIndicator = new PIXI.Graphics();
      effectsIndicator.beginFill(0xf59e0b, 0.8); // Amber
      effectsIndicator.drawCircle(width - 12, 12, 4);
      effectsIndicator.endFill();
      
      const effectsText = new PIXI.Text('FX', {
        fontFamily: 'Inter, sans-serif',
        fontSize: 6,
        fill: 0x000000,
        fontWeight: '700',
      });
      effectsText.x = width - 16;
      effectsText.y = 8;
      container.addChild(effectsIndicator);
      container.addChild(effectsText);
    }
    
    // Add opacity indicator if not fully opaque
    if (clip.opacity && clip.opacity < 1.0) {
      const opacityText = new PIXI.Text(`${Math.round(clip.opacity * 100)}%`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: 8,
        fill: 0xffffff,
        fontWeight: '500',
      });
      opacityText.x = 8;
      opacityText.y = height - 16;
      container.addChild(opacityText);
    }
    
    // Position container
    container.x = clip.startTime * this.config.timeScale;
    container.y = clip.trackIndex * this.config.trackHeight;
    
    // Make interactive
    container.interactive = true;
    container.cursor = 'pointer';
    
    this.clipsContainer.addChild(container);
    this.clipGraphics.set(clip.id, container);
  }

  private createVideoClip(background: PIXI.Graphics, clip: TimelineClip, width: number, height: number, borderRadius: number): void {
    // Modern gradient background for video clips
    background.beginFill(this.config.modernTheme.primary);
    background.drawRoundedRect(0, 4, width, height, borderRadius);
    background.endFill();
    
    // Add subtle highlight
    background.beginFill(0xffffff, 0.1);
    background.drawRoundedRect(0, 4, width, 2, borderRadius);
    background.endFill();

    // Add resize handles
    const handleWidth = 4;
    const left = new PIXI.Graphics();
    left.beginFill(0xffffff, 0.8);
    left.drawRoundedRect(0, 4, handleWidth, height, 2);
    left.endFill();
    const right = new PIXI.Graphics();
    right.beginFill(0xffffff, 0.8);
    right.drawRoundedRect(width - handleWidth, 4, handleWidth, height, 2);
    right.endFill();
    background.addChild(left);
    background.addChild(right);
  }

  private createAudioClip(background: PIXI.Graphics, container: PIXI.Container, clip: TimelineClip, width: number, height: number, borderRadius: number): void {
    // Modern audio clip background
    background.beginFill(this.config.trackColors.audio);
    background.drawRoundedRect(0, 4, width, height, borderRadius);
    background.endFill();
    
    // Enhanced realistic waveform visualization
    this.createRealisticWaveform(container, clip, width, height);
  }

  private createRealisticWaveform(container: PIXI.Container, clip: TimelineClip, width: number, height: number): void {
    const waveform = new PIXI.Graphics();
    const waveColor = 0x10b981; // Emerald-500
    const centerY = 4 + height / 2;
    const maxWaveHeight = height * 0.7;
    
    // Create more realistic waveform data
    const samples = Math.floor(width / 2); // One sample per 2 pixels for performance
    const waveformData = this.generateWaveformData(samples, clip.duration);
    
    // Draw waveform bars like professional audio editors
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const amplitude = waveformData[i];
      const barHeight = amplitude * maxWaveHeight;
      
      // Draw main waveform bar
      waveform.beginFill(waveColor, 0.8);
      waveform.drawRect(x, centerY - barHeight / 2, 1.5, barHeight);
      waveform.endFill();
      
      // Add peak indicators for louder sections
      if (amplitude > 0.7) {
        waveform.beginFill(0xfbbf24, 0.9); // Amber for peaks
        waveform.drawRect(x, centerY - barHeight / 2, 1.5, barHeight);
        waveform.endFill();
      }
      
      // Add subtle reflection
      waveform.beginFill(waveColor, 0.2);
      waveform.drawRect(x, centerY + barHeight / 2, 1.5, barHeight * 0.3);
      waveform.endFill();
    }
    
    // Add volume indicator if available
    if (clip.volume !== undefined) {
      const volumeIndicator = new PIXI.Text(`${Math.round(clip.volume * 100)}%`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: 8,
        fill: 0x10b981,
        fontWeight: '600',
      });
      volumeIndicator.x = width - volumeIndicator.width - 8;
      volumeIndicator.y = 8;
      container.addChild(volumeIndicator);
    }
    
    container.addChild(waveform);
  }

  private generateWaveformData(samples: number, duration: number): number[] {
    const data: number[] = [];
    
    // Generate realistic audio waveform pattern
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * duration;
      
      // Create varied amplitude patterns
      let amplitude = 0;
      
      // Add different frequency components for realism
      amplitude += Math.sin(t * 2 * Math.PI * 0.5) * 0.3; // Low frequency
      amplitude += Math.sin(t * 2 * Math.PI * 2) * 0.2; // Mid frequency
      amplitude += Math.sin(t * 2 * Math.PI * 8) * 0.1; // High frequency
      
      // Add random variation for natural feel
      amplitude += (Math.random() - 0.5) * 0.4;
      
      // Apply envelope (fade in/out at edges)
      const edgeFade = Math.min(i / (samples * 0.1), (samples - i) / (samples * 0.1), 1);
      amplitude *= edgeFade;
      
      // Normalize and ensure positive
      amplitude = Math.abs(amplitude);
      amplitude = Math.min(amplitude, 1);
      
      data.push(amplitude);
    }
    
    return data;
  }

  private createTextClip(background: PIXI.Graphics, clip: TimelineClip, width: number, height: number, borderRadius: number): void {
    // Modern text clip styling
    background.beginFill(this.config.trackColors.text);
    background.drawRoundedRect(0, 4, width, height, borderRadius);
    background.endFill();
    
    // Add text icon pattern
    const textPattern = new PIXI.Graphics();
    textPattern.lineStyle(1, 0xa855f7, 0.3); // Purple-500
    
    for (let i = 0; i < 3; i++) {
      const y = 4 + 15 + (i * 8);
      textPattern.moveTo(8, y);
      textPattern.lineTo(width - 8, y);
    }
    
    background.addChild(textPattern);
  }

  private createGraphicsClip(background: PIXI.Graphics, clip: TimelineClip, width: number, height: number, borderRadius: number): void {
    // Modern graphics clip styling
    background.beginFill(this.config.trackColors.graphics);
    background.drawRoundedRect(0, 4, width, height, borderRadius);
    background.endFill();
    
    // Add graphics pattern
    const pattern = new PIXI.Graphics();
    pattern.lineStyle(2, 0xf59e0b, 0.4); // Amber-500
    
    // Draw simple geometric pattern
    const centerX = width / 2;
    const centerY = 4 + height / 2;
    const radius = Math.min(width, height) * 0.15;
    
    pattern.drawCircle(centerX - 10, centerY, radius);
    pattern.drawRect(centerX + 5, centerY - radius, radius * 1.5, radius * 2);
    
    background.addChild(pattern);
  }

  private async addThumbnailsToClip(container: PIXI.Container, clip: TimelineClip, width: number, height: number, borderRadius: number): Promise<void> {
    const texture = await this.loadThumbnail(clip.thumbnailUrl!);
    if (texture) {
      // Create repeating thumbnails with modern styling
      const thumbnailWidth = height * 1.6; // Better aspect ratio
      const numThumbnails = Math.ceil(width / thumbnailWidth);
      
      for (let i = 0; i < numThumbnails; i++) {
        const sprite = new PIXI.Sprite(texture);
        sprite.x = i * thumbnailWidth;
        sprite.y = 4;
        sprite.width = Math.min(thumbnailWidth, width - (i * thumbnailWidth));
        sprite.height = height;
        
        // Create mask for rounded corners
        const mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(0, 4, width, height, borderRadius);
        mask.endFill();
        sprite.mask = mask;
        
        container.addChild(sprite);
        container.addChild(mask);
      }
    }
  }

  private recreateClipGraphic(clip: TimelineClip): void {
    this.removeClip(clip.id);
    this.createClipGraphic(clip);
  }

  private showTooltip(x: number, y: number, start: number, duration: number): void {
    const text = `Start ${start.toFixed(2)}s • Dur ${duration.toFixed(2)}s`;
    if (!this.tooltip) {
      this.tooltip = new PIXI.Text(text, {
        fontFamily: 'Inter, sans-serif', fontSize: 11, fill: 0xffffff,
        stroke: 0x000000, strokeThickness: 3
      });
      this.playheadContainer.addChild(this.tooltip);
    }
    this.tooltip.text = text;
    this.tooltip.x = x + 8;
    this.tooltip.y = y;
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.playheadContainer.removeChild(this.tooltip);
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  private selectClip(clip: TimelineClip): void {
    // Clear previous selection
    this.clearSelection();
    
    // Select new clip
    clip.selected = true;
    this.recreateClipGraphic(clip);
    this.events.onClipSelect(clip);
  }

  private clearSelection(): void {
    for (const clip of this.clips.values()) {
      if (clip.selected) {
        clip.selected = false;
        this.recreateClipGraphic(clip);
      }
    }
  }

  public setPlayheadPosition(time: number): void {
    this.playheadPosition = time;
    this.updatePlayheadPosition();
  }

  private updatePlayheadPosition(): void {
    if (this.playheadGraphic) {
      this.playheadGraphic.x = this.playheadPosition * this.config.timeScale;
    }
  }

  public setTimeScale(scale: number): void {
    this.config.timeScale = scale;
    this.refresh();
    this.events.onZoomChange(scale);
  }

  public refresh(): void {
    // Clear and recreate everything
    this.rulerContainer.removeChildren();
    this.tracksContainer.removeChildren();
    this.clipsContainer.removeChildren();
    this.playheadContainer.removeChildren();
    this.clipGraphics.clear();
    
    this.initializeTimeline();
    
    // Recreate clips
    for (const clip of this.clips.values()) {
      this.createClipGraphic(clip);
    }
  }

  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.app.renderer.resize(width, height);
    this.refresh();
  }

  public destroy(): void {
    // Clean up textures
    for (const texture of this.thumbnailTextures.values()) {
      texture.destroy();
    }
    this.thumbnailTextures.clear();
    
    this.app.destroy(true, true);
  }

  // Utility methods
  public getClipAt(x: number, y: number): TimelineClip | null {
    const time = x / this.config.timeScale;
    const trackIndex = Math.floor((y - this.config.rulerHeight) / this.config.trackHeight);
    
    for (const clip of this.clips.values()) {
      if (
        clip.trackIndex === trackIndex &&
        time >= clip.startTime &&
        time <= clip.startTime + clip.duration
      ) {
        return clip;
      }
    }
    
    return null;
  }

  public getSelectedClips(): TimelineClip[] {
    return Array.from(this.clips.values()).filter(clip => clip.selected);
  }

  public getCurrentTime(): number {
    return this.playheadPosition;
  }

  public getTotalDuration(): number {
    let maxTime = 0;
    for (const clip of this.clips.values()) {
      maxTime = Math.max(maxTime, clip.startTime + clip.duration);
    }
    return maxTime;
  }

  // Magnetic snapping functionality
  private getSnappedTime(targetTime: number, excludeClipId: string): { time: number; type: string } | null {
    const snapThresholdTime = this.snapThreshold / this.config.timeScale;
    let closestSnapTime: number | null = null;
    let closestDistance = Infinity;
    let snapType = '';

    // Check snapping to playhead
    const playheadDistance = Math.abs(targetTime - this.playheadPosition);
    if (playheadDistance < snapThresholdTime && playheadDistance < closestDistance) {
      closestSnapTime = this.playheadPosition;
      closestDistance = playheadDistance;
      snapType = 'playhead';
    }

    // Check snapping to timeline start (0)
    const startDistance = Math.abs(targetTime);
    if (startDistance < snapThresholdTime && startDistance < closestDistance) {
      closestSnapTime = 0;
      closestDistance = startDistance;
      snapType = 'start';
    }

    // Check snapping to other clips
    for (const clip of this.clips.values()) {
      if (clip.id === excludeClipId) continue;

      // Snap to clip start
      const clipStartDistance = Math.abs(targetTime - clip.startTime);
      if (clipStartDistance < snapThresholdTime && clipStartDistance < closestDistance) {
        closestSnapTime = clip.startTime;
        closestDistance = clipStartDistance;
        snapType = 'clip-start';
      }

      // Snap to clip end
      const clipEnd = clip.startTime + clip.duration;
      const clipEndDistance = Math.abs(targetTime - clipEnd);
      if (clipEndDistance < snapThresholdTime && clipEndDistance < closestDistance) {
        closestSnapTime = clipEnd;
        closestDistance = clipEndDistance;
        snapType = 'clip-end';
      }
    }

    return closestSnapTime !== null ? { time: closestSnapTime, type: snapType } : null;
  }

  private showSnapIndicator(time: number, type: string): void {
    this.hideSnapIndicator();

    this.snapIndicator = new PIXI.Graphics();
    const x = time * this.config.timeScale;

    // Draw snap line
    this.snapIndicator.lineStyle(2, this.config.modernTheme.accent, 0.8);
    this.snapIndicator.moveTo(x, 0);
    this.snapIndicator.lineTo(x, this.config.height);

    // Add snap indicator icon at top
    const indicator = new PIXI.Graphics();
    indicator.beginFill(this.config.modernTheme.accent);
    indicator.drawRoundedRect(x - 4, -8, 8, 16, 4);
    indicator.endFill();

    this.snapIndicator.addChild(indicator);
    this.playheadContainer.addChild(this.snapIndicator);
  }

  private hideSnapIndicator(): void {
    if (this.snapIndicator) {
      this.playheadContainer.removeChild(this.snapIndicator);
      this.snapIndicator = null;
    }
  }

  public toggleSnapping(enabled: boolean): void {
    this.snapEnabled = enabled;
  }

  public setSnapThreshold(threshold: number): void {
    this.snapThreshold = threshold;
  }

  private addTransitionIndicators(container: PIXI.Container, clip: TimelineClip, width: number, height: number): void {
    const transitionWidth = 20; // Width of transition indicator
    
    // Fade in transition
    if (clip.transitions?.in && clip.transitions.in !== 'none') {
      const fadeIn = new PIXI.Graphics();
      
      // Create gradient effect for fade in
      if (clip.transitions.in === 'fade') {
        fadeIn.beginFill(0xffffff, 0.3);
        fadeIn.moveTo(0, 4);
        fadeIn.lineTo(transitionWidth, 4);
        fadeIn.lineTo(0, 4 + height);
        fadeIn.closePath();
        fadeIn.endFill();
        
        // Add fade icon
        const fadeIcon = new PIXI.Text('↗', {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        fadeIcon.x = 2;
        fadeIcon.y = 6;
        container.addChild(fadeIcon);
      }
      
      container.addChild(fadeIn);
    }
    
    // Fade out transition
    if (clip.transitions?.out && clip.transitions.out !== 'none') {
      const fadeOut = new PIXI.Graphics();
      
      if (clip.transitions.out === 'fade') {
        fadeOut.beginFill(0xffffff, 0.3);
        fadeOut.moveTo(width - transitionWidth, 4);
        fadeOut.lineTo(width, 4);
        fadeOut.lineTo(width, 4 + height);
        fadeOut.closePath();
        fadeOut.endFill();
        
        // Add fade out icon
        const fadeOutIcon = new PIXI.Text('↙', {
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xffffff,
          fontWeight: 'bold',
        });
        fadeOutIcon.x = width - 15;
        fadeOutIcon.y = height - 16;
        container.addChild(fadeOutIcon);
      }
      
      container.addChild(fadeOut);
    }
  }
} 