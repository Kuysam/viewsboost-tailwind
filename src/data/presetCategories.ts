import { TextPresetCategory, Platform } from '../types/textPresets';

// Comprehensive category definitions with descriptions and examples
export const categoryDefinitions: Record<TextPresetCategory, {
  label: string;
  description: string;
  examples: string[];
  inspiration: Platform[];
  color: string;
  icon: string;
}> = {
  neon: {
    label: 'Neon & Glow',
    description: 'Electric, glowing text effects perfect for gaming, nightlife, and tech content',
    examples: ['Electric Blue', 'Pink Pulse', 'Cyber Green', 'Purple Cosmic'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#00ffff',
    icon: '⚡'
  },
  
  vintage: {
    label: 'Vintage & Classic',
    description: 'Timeless elegance with golden accents and classic typography',
    examples: ['Golden Serif', 'Art Deco', 'Victorian', 'Antique Brass'],
    inspiration: ['canva', 'createvista'],
    color: '#d4af37',
    icon: '🏛️'
  },
  
  modern: {
    label: 'Modern & Clean',
    description: 'Contemporary minimalist designs for professional and clean aesthetics',
    examples: ['Clean Sans', 'Swiss Style', 'Bauhaus', 'Geometric'],
    inspiration: ['adobeexpress', 'canva'],
    color: '#2c3e50',
    icon: '📐'
  },
  
  bold: {
    label: 'Bold & Strong',
    description: 'High-impact typography that commands attention and makes statements',
    examples: ['Heavy Impact', 'Block Letters', 'Ultra Bold', 'Power Text'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#e74c3c',
    icon: '💪'
  },
  
  cursive: {
    label: 'Cursive & Script',
    description: 'Flowing script fonts perfect for elegant and personal designs',
    examples: ['Elegant Script', 'Calligraphy', 'Brush Script', 'Handwriting'],
    inspiration: ['createvista', 'canva'],
    color: '#8e44ad',
    icon: '✒️'
  },
  
  minimal: {
    label: 'Minimal & Simple',
    description: 'Less is more - clean, simple typography that speaks volumes',
    examples: ['Ultra Light', 'Simple Sans', 'Clean Minimal', 'Pure Typography'],
    inspiration: ['adobeexpress', 'canva'],
    color: '#95a5a6',
    icon: '⚪'
  },
  
  shadow: {
    label: 'Shadow & Depth',
    description: '3D effects and shadows that add depth and dimension to text',
    examples: ['Drop Shadow', 'Long Shadow', '3D Extrude', 'Soft Shadow'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#34495e',
    icon: '🎭'
  },
  
  outline: {
    label: 'Outline & Stroke',
    description: 'Bold outlines and strokes that make text pop against any background',
    examples: ['Thick Outline', 'Rainbow Stroke', 'Double Outline', 'Neon Border'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#f39c12',
    icon: '⭕'
  },
  
  gradient: {
    label: 'Gradient & Rainbow',
    description: 'Multi-color gradients and rainbow effects for vibrant, eye-catching text',
    examples: ['Sunset Gradient', 'Ocean Wave', 'Rainbow Bright', 'Fire Gradient'],
    inspiration: ['canva', 'capcut'],
    color: '#ff6b6b',
    icon: '🌈'
  },
  
  glitch: {
    label: 'Glitch & Digital',
    description: 'Cyberpunk and digital distortion effects for tech and gaming content',
    examples: ['Cyber Glitch', 'Digital Chaos', 'Matrix Code', 'Data Corruption'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#00ff00',
    icon: '🔀'
  },
  
  retro: {
    label: 'Retro & 80s',
    description: 'Nostalgic 80s and 90s vibes with synthwave and retro aesthetics',
    examples: ['80s Neon', 'Synthwave', 'Retro Futurism', 'Vaporwave'],
    inspiration: ['canva', 'capcut'],
    color: '#ff6b9d',
    icon: '📼'
  },
  
  script: {
    label: 'Script & Handwritten',
    description: 'Artistic handwritten styles and decorative script fonts',
    examples: ['Beautiful Script', 'Hand Lettering', 'Brush Calligraphy', 'Signature Style'],
    inspiration: ['createvista', 'canva'],
    color: '#9b59b6',
    icon: '🖋️'
  },
  
  professional: {
    label: 'Professional & Business',
    description: 'Corporate and business-appropriate typography for formal content',
    examples: ['Corporate Clean', 'Business Formal', 'Executive Style', 'Professional Sans'],
    inspiration: ['adobeexpress', 'canva'],
    color: '#3498db',
    icon: '💼'
  },
  
  playful: {
    label: 'Playful & Fun',
    description: 'Cheerful and energetic text styles perfect for entertainment and kids content',
    examples: ['Bubble Text', 'Comic Style', 'Bouncy Letters', 'Party Vibes'],
    inspiration: ['canva', 'createvista'],
    color: '#f1c40f',
    icon: '🎈'
  },
  
  artistic: {
    label: 'Artistic & Creative',
    description: 'Unique artistic expressions and creative typography experiments',
    examples: ['Abstract Art', 'Paint Splash', 'Watercolor', 'Creative Expression'],
    inspiration: ['createvista', 'viewsboost'],
    color: '#e67e22',
    icon: '🎨'
  },
  
  gaming: {
    label: 'Gaming & Esports',
    description: 'High-energy styles perfect for gaming content and esports branding',
    examples: ['Game Over', 'Level Up', 'Victory Text', 'Esports Pro'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#39ff14',
    icon: '🎮'
  },
  
  tech: {
    label: 'Tech & Futuristic',
    description: 'Cutting-edge technology aesthetics and futuristic design elements',
    examples: ['Sci-Fi Text', 'Future Tech', 'Digital Display', 'Hologram'],
    inspiration: ['viewsboost', 'capcut'],
    color: '#00d4ff',
    icon: '🚀'
  },
  
  luxury: {
    label: 'Luxury & Premium',
    description: 'High-end, sophisticated typography for premium brands and luxury content',
    examples: ['Gold Luxury', 'Diamond Text', 'Premium Brand', 'Exclusive Style'],
    inspiration: ['canva', 'createvista'],
    color: '#ffd700',
    icon: '💎'
  },
  
  handwritten: {
    label: 'Handwritten & Casual',
    description: 'Personal, casual handwriting styles for authentic, human touch',
    examples: ['Marker Style', 'Notebook Writing', 'Casual Hand', 'Personal Note'],
    inspiration: ['createvista', 'canva'],
    color: '#e74c3c',
    icon: '✏️'
  },
  
  grunge: {
    label: 'Grunge & Distressed',
    description: 'Rough, weathered effects for edgy and alternative aesthetic',
    examples: ['Distressed Text', 'Worn Out', 'Street Art', 'Urban Decay'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#7f8c8d',
    icon: '🔥'
  },
  
  elegant: {
    label: 'Elegant & Refined',
    description: 'Sophisticated and graceful typography for upscale content',
    examples: ['Royal Elegance', 'Refined Class', 'Sophisticated Style', 'Grace Text'],
    inspiration: ['createvista', 'canva'],
    color: '#8e44ad',
    icon: '👑'
  },
  
  futuristic: {
    label: 'Futuristic & Sci-Fi',
    description: 'Space-age and futuristic designs for sci-fi and tech content',
    examples: ['Space Age', 'Alien Text', 'Future World', 'Cosmic Style'],
    inspiration: ['viewsboost', 'capcut'],
    color: '#00ffaa',
    icon: '🛸'
  },
  
  kawaii: {
    label: 'Kawaii & Cute',
    description: 'Adorable Japanese-inspired cute aesthetics and bubble styles',
    examples: ['Kawaii Bubble', 'Cute Anime', 'Pastel Sweet', 'Chibi Style'],
    inspiration: ['viewsboost', 'createvista'],
    color: '#ff69b4',
    icon: '🌸'
  },
  
  corporate: {
    label: 'Corporate & Professional',
    description: 'Business-focused typography for corporate communications',
    examples: ['Corporate Identity', 'Company Brand', 'Official Document', 'Business Card'],
    inspiration: ['adobeexpress', 'canva'],
    color: '#2c3e50',
    icon: '🏢'
  },
  
  festive: {
    label: 'Festive & Party',
    description: 'Celebration and party vibes with colorful, energetic designs',
    examples: ['Party Time', 'Celebration', 'Birthday Fun', 'Holiday Cheer'],
    inspiration: ['canva', 'createvista'],
    color: '#ff4757',
    icon: '🎉'
  },
  
  spooky: {
    label: 'Spooky & Halloween',
    description: 'Horror and Halloween-themed typography with dark aesthetics',
    examples: ['Horror Movie', 'Spooky Night', 'Halloween Text', 'Gothic Style'],
    inspiration: ['capcut', 'viewsboost'],
    color: '#ff6348',
    icon: '🎃'
  },
  
  summer: {
    label: 'Summer & Beach',
    description: 'Warm, sunny vibes perfect for vacation and summer content',
    examples: ['Beach Vibes', 'Summer Fun', 'Tropical Style', 'Vacation Mode'],
    inspiration: ['canva', 'createvista'],
    color: '#ff6b35',
    icon: '🏖️'
  },
  
  winter: {
    label: 'Winter & Holiday',
    description: 'Cool, frosty aesthetics for winter and holiday themes',
    examples: ['Winter Frost', 'Holiday Spirit', 'Snow Effect', 'Ice Crystal'],
    inspiration: ['canva', 'createvista'],
    color: '#87ceeb',
    icon: '❄️'
  }
};

// Platform-specific preset counts and specialties
export const platformSpecialties: Record<Platform, {
  name: string;
  color: string;
  specialties: TextPresetCategory[];
  description: string;
  presetCount: number;
}> = {
  canva: {
    name: 'Canva',
    color: '#00c4cc',
    specialties: ['vintage', 'modern', 'professional', 'elegant', 'corporate'],
    description: 'Professional design platform known for clean, business-friendly typography',
    presetCount: 45
  },
  
  capcut: {
    name: 'CapCut',
    color: '#ff6b6b',
    specialties: ['neon', 'glitch', 'gaming', 'bold', 'retro'],
    description: 'Video editing app popular for dynamic, energetic text effects',
    presetCount: 40
  },
  
  createvista: {
    name: 'Create Vista',
    color: '#8e44ad',
    specialties: ['script', 'artistic', 'handwritten', 'luxury', 'kawaii'],
    description: 'Creative platform specializing in artistic and decorative typography',
    presetCount: 35
  },
  
  adobeexpress: {
    name: 'Adobe Express',
    color: '#ff0000',
    specialties: ['modern', 'minimal', 'professional', 'tech', 'corporate'],
    description: 'Adobe\'s platform for clean, professional design tools',
    presetCount: 38
  },
  
  viewsboost: {
    name: 'ViewsBoost',
    color: '#ffd700',
    specialties: ['gradient', 'shadow', 'outline', 'futuristic', 'playful'],
    description: 'ViewsBoost original styles blending the best of all platforms',
    presetCount: 55
  },
  
  universal: {
    name: 'Universal',
    color: '#6c757d',
    specialties: ['minimal', 'modern', 'professional'],
    description: 'Cross-platform compatible styles that work everywhere',
    presetCount: 12
  }
};

// Usage statistics and trending data
export const categoryStats = {
  mostPopular: ['neon', 'gradient', 'shadow', 'modern', 'bold'] as TextPresetCategory[],
  trending: ['glitch', 'kawaii', 'futuristic', 'gaming'] as TextPresetCategory[],
  newest: ['tech', 'artistic', 'spooky', 'festive'] as TextPresetCategory[],
  premium: ['luxury', 'elegant', 'professional', 'corporate'] as TextPresetCategory[]
};

// Quick filter configurations
export const quickFilters = {
  'All Styles': {
    count: 225,
    filter: {},
    color: '#6c757d'
  },
  'Trending Now': {
    count: 45,
    filter: { isTrending: true },
    color: '#ff6b6b'
  },
  'New Arrivals': {
    count: 32,
    filter: { isNew: true },
    color: '#4ecdc4'
  },
  'Premium Collection': {
    count: 28,
    filter: { isPremium: true },
    color: '#ffd700'
  },
  'Most Popular': {
    count: 50,
    filter: { sortBy: 'usage', sortOrder: 'desc' },
    color: '#45b7d1'
  },
  'Gen Z Favorites': {
    count: 38,
    filter: { 
      category: ['neon', 'kawaii', 'gaming', 'glitch', 'retro'] as any,
      tags: ['genz', 'trendy', 'viral'] 
    },
    color: '#ff69b4'
  }
};

export default categoryDefinitions;