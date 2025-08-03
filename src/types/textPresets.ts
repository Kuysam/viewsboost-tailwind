export interface TextPreset {
  id: string;
  name: string;
  category: TextPresetCategory;
  platform: Platform;
  style: TextStyle;
  animation?: TextAnimation;
  sampleText: string;
  tags: string[];
  isPremium?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  thumbnail?: string;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  backgroundImage?: string;
  textAlign: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  lineHeight?: string;
  textShadow?: string;
  borderRadius?: string;
  border?: string;
  padding?: string;
  margin?: string;
  gradient?: {
    type: 'linear' | 'radial';
    direction?: string;
    colors: string[];
  };
  outline?: {
    width: string;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  glow?: {
    color: string;
    intensity: number;
    blur: number;
  };
  shadow?: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  transform?: {
    rotate?: number;
    scale?: number;
    skew?: number;
  };
  filter?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
  };
}

export interface TextAnimation {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export type AnimationType = 
  | 'fadeIn' 
  | 'slideIn' 
  | 'zoomIn' 
  | 'bounce' 
  | 'pulse' 
  | 'shake' 
  | 'typewriter' 
  | 'neon' 
  | 'glitch' 
  | 'rainbow' 
  | 'wave' 
  | 'flip' 
  | 'scale' 
  | 'rotate' 
  | 'elastic'
  | 'flash'
  | 'rubberBand'
  | 'wobble'
  | 'jello'
  | 'heartBeat'
  | 'infinite-spin'
  | 'ping'
  | 'float';

export type TextPresetCategory = 
  | 'neon'
  | 'vintage'
  | 'modern'
  | 'bold'
  | 'cursive'
  | 'minimal'
  | 'shadow'
  | 'outline'
  | 'gradient'
  | 'glitch'
  | 'retro'
  | 'script'
  | 'professional'
  | 'playful'
  | 'artistic'
  | 'gaming'
  | 'tech'
  | 'luxury'
  | 'handwritten'
  | 'grunge'
  | 'elegant'
  | 'futuristic'
  | 'kawaii'
  | 'corporate'
  | 'festive'
  | 'spooky'
  | 'summer'
  | 'winter';

export type Platform = 
  | 'canva'
  | 'capcut'
  | 'createvista'
  | 'adobeexpress'
  | 'viewsboost'
  | 'universal';

export interface TextElement {
  id: string;
  presetId: string;
  text: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: TextStyle;
  animation?: TextAnimation;
  zIndex: number;
  isSelected: boolean;
  isEditing: boolean;
  rotation: number;
  scale: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextPresetFilter {
  category?: TextPresetCategory;
  platform?: Platform;
  search?: string;
  tags?: string[];
  isPremium?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  sortBy?: 'name' | 'usage' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

export interface RecentPreset {
  presetId: string;
  usedAt: Date;
  usageCount: number;
}

export interface TextPresetState {
  presets: TextPreset[];
  filteredPresets: TextPreset[];
  selectedPreset?: TextPreset;
  recentPresets: RecentPreset[];
  searchQuery: string;
  selectedCategory?: TextPresetCategory;
  selectedPlatform?: Platform;
  filter: TextPresetFilter;
  loading: boolean;
  error?: string;
  viewMode: 'grid' | 'list';
  showFilters: boolean;
  showSearch: boolean;
}

export interface TextEditorState {
  textElements: TextElement[];
  selectedElements: string[];
  clipboard: TextElement[];
  history: TextElement[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  isEditing: boolean;
  selectedTool: 'select' | 'text' | 'move' | 'resize';
  snapToGrid: boolean;
  showGuides: boolean;
  gridSize: number;
  canvasSize: {
    width: number;
    height: number;
  };
  zoom: number;
  pan: {
    x: number;
    y: number;
  };
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
}