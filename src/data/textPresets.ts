import { TextPreset, TextPresetCategory, Platform } from '../types/textPresets';
import { generateCompletePresetCollection } from './extendedTextPresets';

// Use the extended collection with 200+ presets
export const textPresets: TextPreset[] = generateCompletePresetCollection();

// Legacy smaller collection for reference
export const originalTextPresets: TextPreset[] = [
  // NEON & GLOW STYLES (CapCut Inspired)
  {
    id: 'neon-electric-blue',
    name: 'Electric Blue Neon',
    category: 'neon',
    platform: 'capcut',
    style: {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '3rem',
      fontWeight: '900',
      color: '#00ffff',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      glow: {
        color: '#00ffff',
        intensity: 3,
        blur: 15
      },
      shadow: {
        x: 0,
        y: 0,
        blur: 20,
        color: '#00ffff'
      },
      textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff'
    },
    animation: {
      type: 'neon',
      duration: 2,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'NEON VIBES',
    tags: ['neon', 'glow', 'electric', 'gaming', 'tech'],
    isTrending: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    usageCount: 2847
  },
  
  {
    id: 'neon-pink-pulse',
    name: 'Pink Pulse Neon',
    category: 'neon',
    platform: 'capcut',
    style: {
      fontFamily: 'Impact, sans-serif',
      fontSize: '2.5rem',
      fontWeight: '900',
      color: '#ff00ff',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      glow: {
        color: '#ff00ff',
        intensity: 4,
        blur: 20
      },
      textShadow: '0 0 15px #ff00ff, 0 0 30px #ff00ff, 0 0 45px #ff00ff'
    },
    animation: {
      type: 'pulse',
      duration: 1.5,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'ELECTRIC DREAMS',
    tags: ['neon', 'pink', 'pulse', 'nightlife', 'party'],
    isNew: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    usageCount: 1263
  },

  // VINTAGE & RETRO STYLES (Canva Inspired)
  {
    id: 'vintage-serif-gold',
    name: 'Golden Vintage Serif',
    category: 'vintage',
    platform: 'canva',
    style: {
      fontFamily: 'Playfair Display, serif',
      fontSize: '2.8rem',
      fontWeight: '700',
      color: '#d4af37',
      textAlign: 'center',
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      lineHeight: '1.2',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      border: '3px solid #d4af37',
      borderRadius: '10px',
      padding: '20px 40px',
      backgroundColor: '#1a1a1a'
    },
    sampleText: 'Classic Elegance',
    tags: ['vintage', 'elegant', 'gold', 'luxury', 'classic'],
    isPremium: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    usageCount: 3451
  },

  {
    id: 'retro-80s-gradient',
    name: 'Retro 80s Gradient',
    category: 'retro',
    platform: 'canva',
    style: {
      fontFamily: 'Orbitron, monospace',
      fontSize: '3.2rem',
      fontWeight: '900',
      color: 'transparent',
      backgroundImage: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      textShadow: '0 4px 8px rgba(0,0,0,0.3)',
      filter: {
        contrast: 1.2,
        saturate: 1.3
      }
    },
    animation: {
      type: 'rainbow',
      duration: 3,
      repeat: 'infinite',
      easing: 'linear'
    },
    sampleText: 'RETRO WAVE',
    tags: ['retro', '80s', 'gradient', 'synthwave', 'colorful'],
    isTrending: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    usageCount: 4182
  },

  // MODERN & MINIMAL STYLES (Adobe Express Inspired)
  {
    id: 'modern-clean-sans',
    name: 'Clean Modern Sans',
    category: 'modern',
    platform: 'adobeexpress',
    style: {
      fontFamily: 'Helvetica Neue, sans-serif',
      fontSize: '2.5rem',
      fontWeight: '300',
      color: '#2c3e50',
      textAlign: 'left',
      textTransform: 'none',
      letterSpacing: '0.01em',
      lineHeight: '1.4',
      backgroundColor: '#ffffff',
      padding: '30px',
      borderRadius: '8px',
      shadow: {
        x: 0,
        y: 4,
        blur: 20,
        color: 'rgba(0,0,0,0.1)'
      }
    },
    sampleText: 'Modern Typography',
    tags: ['modern', 'clean', 'minimal', 'professional', 'sans-serif'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    usageCount: 2976
  },

  {
    id: 'minimal-bold-statement',
    name: 'Minimal Bold Statement',
    category: 'minimal',
    platform: 'adobeexpress',
    style: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: '4rem',
      fontWeight: '900',
      color: '#000000',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: '0.9'
    },
    sampleText: 'IMPACT',
    tags: ['minimal', 'bold', 'statement', 'black', 'powerful'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    usageCount: 3847
  },

  // SCRIPT & HANDWRITTEN STYLES (Create Vista Inspired)
  {
    id: 'elegant-script-purple',
    name: 'Elegant Purple Script',
    category: 'script',
    platform: 'createvista',
    style: {
      fontFamily: 'Dancing Script, cursive',
      fontSize: '3.5rem',
      fontWeight: '700',
      color: '#8e44ad',
      textAlign: 'center',
      textTransform: 'none',
      letterSpacing: '0.02em',
      lineHeight: '1.2',
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
      transform: {
        rotate: -2
      }
    },
    animation: {
      type: 'fadeIn',
      duration: 1.5,
      easing: 'ease-out'
    },
    sampleText: 'Beautiful Script',
    tags: ['script', 'elegant', 'purple', 'handwritten', 'wedding'],
    isPremium: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    usageCount: 1567
  },

  {
    id: 'handwritten-marker',
    name: 'Casual Marker Style',
    category: 'handwritten',
    platform: 'createvista',
    style: {
      fontFamily: 'Kalam, cursive',
      fontSize: '2.8rem',
      fontWeight: '700',
      color: '#e74c3c',
      textAlign: 'center',
      textTransform: 'none',
      letterSpacing: '0.01em',
      lineHeight: '1.3',
      textShadow: '2px 2px 0px #c0392b',
      transform: {
        rotate: 1
      }
    },
    sampleText: 'Hand Drawn Fun',
    tags: ['handwritten', 'marker', 'casual', 'fun', 'red'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    usageCount: 2134
  },

  // SHADOW & OUTLINE STYLES
  {
    id: 'bold-shadow-white',
    name: 'Bold White Shadow',
    category: 'shadow',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '3.5rem',
      fontWeight: '900',
      color: '#ffffff',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      textShadow: '4px 4px 0px #000000, 8px 8px 0px #333333',
      outline: {
        width: '3px',
        color: '#000000',
        style: 'solid'
      }
    },
    animation: {
      type: 'bounce',
      duration: 2,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'BOLD IMPACT',
    tags: ['shadow', 'bold', 'white', 'impact', 'strong'],
    isTrending: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    usageCount: 3298
  },

  {
    id: 'outline-rainbow',
    name: 'Rainbow Outline',
    category: 'outline',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Impact, sans-serif',
      fontSize: '3rem',
      fontWeight: '900',
      color: 'transparent',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      outline: {
        width: '5px',
        color: '#ff6b6b',
        style: 'solid'
      },
      textShadow: '-5px -5px 0 #4ecdc4, 5px -5px 0 #45b7d1, -5px 5px 0 #96ceb4, 5px 5px 0 #feca57'
    },
    animation: {
      type: 'rainbow',
      duration: 2,
      repeat: 'infinite',
      easing: 'linear'
    },
    sampleText: 'RAINBOW STYLE',
    tags: ['outline', 'rainbow', 'colorful', 'fun', 'vibrant'],
    isNew: true,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
    usageCount: 987
  },

  // GRADIENT STYLES
  {
    id: 'sunset-gradient',
    name: 'Sunset Gradient',
    category: 'gradient',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Poppins, sans-serif',
      fontSize: '3.2rem',
      fontWeight: '700',
      color: 'transparent',
      backgroundImage: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      textAlign: 'center',
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      lineHeight: '1.2',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    animation: {
      type: 'slideIn',
      duration: 1.2,
      easing: 'ease-out'
    },
    sampleText: 'Sunset Dreams',
    tags: ['gradient', 'sunset', 'pink', 'warm', 'romantic'],
    isPremium: true,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
    usageCount: 2756
  },

  {
    id: 'ocean-gradient',
    name: 'Ocean Wave Gradient',
    category: 'gradient',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: '2.8rem',
      fontWeight: '600',
      color: 'transparent',
      backgroundImage: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
      textAlign: 'center',
      textTransform: 'none',
      letterSpacing: '0.03em',
      lineHeight: '1.3',
      textShadow: '0 1px 3px rgba(0,0,0,0.3)'
    },
    animation: {
      type: 'wave',
      duration: 3,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'Ocean Waves',
    tags: ['gradient', 'ocean', 'blue', 'purple', 'calm'],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    usageCount: 1845
  },

  // GLITCH & TECH STYLES
  {
    id: 'glitch-cyber',
    name: 'Cyber Glitch',
    category: 'glitch',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Courier New, monospace',
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#00ff00',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      backgroundColor: '#000000',
      padding: '20px',
      borderRadius: '5px',
      textShadow: '2px 0 #ff0000, -2px 0 #00ffff'
    },
    animation: {
      type: 'glitch',
      duration: 0.8,
      repeat: 'infinite',
      easing: 'steps(10, end)'
    },
    sampleText: 'GLITCH ERROR',
    tags: ['glitch', 'cyber', 'tech', 'hacker', 'digital'],
    isTrending: true,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
    usageCount: 2341
  },

  // LUXURY & PROFESSIONAL STYLES
  {
    id: 'luxury-gold-serif',
    name: 'Luxury Gold Serif',
    category: 'luxury',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Playfair Display, serif',
      fontSize: '3rem',
      fontWeight: '700',
      color: '#ffd700',
      textAlign: 'center',
      textTransform: 'capitalize',
      letterSpacing: '0.05em',
      lineHeight: '1.2',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      backgroundColor: '#2c3e50',
      padding: '30px 50px',
      borderRadius: '15px',
      border: '2px solid #ffd700'
    },
    animation: {
      type: 'fadeIn',
      duration: 2,
      easing: 'ease-in-out'
    },
    sampleText: 'Luxury Brand',
    tags: ['luxury', 'gold', 'elegant', 'premium', 'brand'],
    isPremium: true,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
    usageCount: 4567
  },

  {
    id: 'corporate-modern',
    name: 'Corporate Modern',
    category: 'corporate',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Open Sans, sans-serif',
      fontSize: '2.2rem',
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'left',
      textTransform: 'none',
      letterSpacing: '0.02em',
      lineHeight: '1.4',
      backgroundColor: '#ecf0f1',
      padding: '25px 35px',
      borderRadius: '8px',
      border: '1px solid #bdc3c7'
    },
    sampleText: 'Professional Text',
    tags: ['corporate', 'professional', 'modern', 'business', 'clean'],
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    usageCount: 3712
  },

  // PLAYFUL & KAWAII STYLES
  {
    id: 'kawaii-bubble',
    name: 'Kawaii Bubble',
    category: 'kawaii',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Comic Neue, cursive',
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#ff69b4',
      textAlign: 'center',
      textTransform: 'lowercase',
      letterSpacing: '0.03em',
      lineHeight: '1.3',
      backgroundColor: '#ffe4e6',
      padding: '20px 30px',
      borderRadius: '25px',
      border: '3px solid #ff69b4',
      textShadow: '1px 1px 2px rgba(255,105,180,0.3)'
    },
    animation: {
      type: 'bounce',
      duration: 1.5,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'kawaii desu',
    tags: ['kawaii', 'cute', 'pink', 'bubble', 'japanese'],
    isNew: true,
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
    usageCount: 1432
  },

  // GAMING & ESPORTS STYLES
  {
    id: 'gaming-neon-green',
    name: 'Gaming Neon Green',
    category: 'gaming',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '3rem',
      fontWeight: '700',
      color: '#39ff14',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      backgroundColor: '#000000',
      padding: '20px',
      borderRadius: '10px',
      border: '2px solid #39ff14',
      textShadow: '0 0 10px #39ff14, 0 0 20px #39ff14',
      glow: {
        color: '#39ff14',
        intensity: 2,
        blur: 10
      }
    },
    animation: {
      type: 'pulse',
      duration: 1,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'GAME ON',
    tags: ['gaming', 'neon', 'green', 'esports', 'tech'],
    isTrending: true,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    usageCount: 2987
  },

  // SEASONAL & THEMED STYLES
  {
    id: 'summer-beach',
    name: 'Summer Beach Vibes',
    category: 'summer',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Pacifico, cursive',
      fontSize: '2.8rem',
      fontWeight: '400',
      color: '#ff6b35',
      textAlign: 'center',
      textTransform: 'none',
      letterSpacing: '0.02em',
      lineHeight: '1.2',
      textShadow: '2px 2px 4px rgba(255,107,53,0.3)',
      backgroundColor: '#fff3cd',
      padding: '25px 40px',
      borderRadius: '20px',
      border: '3px solid #ff6b35'
    },
    animation: {
      type: 'float',
      duration: 3,
      repeat: 'infinite',
      easing: 'ease-in-out'
    },
    sampleText: 'Summer Vibes',
    tags: ['summer', 'beach', 'vacation', 'orange', 'fun'],
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
    usageCount: 1789
  },

  {
    id: 'winter-frost',
    name: 'Winter Frost',
    category: 'winter',
    platform: 'viewsboost',
    style: {
      fontFamily: 'Cinzel, serif',
      fontSize: '2.6rem',
      fontWeight: '600',
      color: '#87ceeb',
      textAlign: 'center',
      textTransform: 'capitalize',
      letterSpacing: '0.04em',
      lineHeight: '1.2',
      textShadow: '0 0 10px #87ceeb, 1px 1px 2px rgba(135,206,235,0.5)',
      backgroundColor: '#f0f8ff',
      padding: '25px 35px',
      borderRadius: '15px',
      border: '2px solid #87ceeb'
    },
    animation: {
      type: 'fadeIn',
      duration: 2,
      easing: 'ease-out'
    },
    sampleText: 'Winter Frost',
    tags: ['winter', 'frost', 'blue', 'cold', 'elegant'],
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
    usageCount: 1234
  }
];

export const presetCategories: { [key in TextPresetCategory]: string } = {
  neon: 'Neon & Glow',
  vintage: 'Vintage & Classic',
  modern: 'Modern & Clean',
  bold: 'Bold & Strong',
  cursive: 'Cursive & Script',
  minimal: 'Minimal & Simple',
  shadow: 'Shadow & Depth',
  outline: 'Outline & Stroke',
  gradient: 'Gradient & Rainbow',
  glitch: 'Glitch & Digital',
  retro: 'Retro & 80s',
  script: 'Script & Handwritten',
  professional: 'Professional & Business',
  playful: 'Playful & Fun',
  artistic: 'Artistic & Creative',
  gaming: 'Gaming & Esports',
  tech: 'Tech & Futuristic',
  luxury: 'Luxury & Premium',
  handwritten: 'Handwritten & Casual',
  grunge: 'Grunge & Distressed',
  elegant: 'Elegant & Refined',
  futuristic: 'Futuristic & Sci-Fi',
  kawaii: 'Kawaii & Cute',
  corporate: 'Corporate & Professional',
  festive: 'Festive & Party',
  spooky: 'Spooky & Halloween',
  summer: 'Summer & Beach',
  winter: 'Winter & Holiday'
};

export const platformColors: { [key in Platform]: string } = {
  canva: '#00c4cc',
  capcut: '#ff6b6b',
  createvista: '#8e44ad',
  adobeexpress: '#ff0000',
  viewsboost: '#ffd700',
  universal: '#6c757d'
};

export const getPresetsByCategory = (category: TextPresetCategory): TextPreset[] => {
  return textPresets.filter(preset => preset.category === category);
};

export const getPresetsByPlatform = (platform: Platform): TextPreset[] => {
  return textPresets.filter(preset => preset.platform === platform);
};

export const getTrendingPresets = (): TextPreset[] => {
  return textPresets.filter(preset => preset.isTrending);
};

export const getNewPresets = (): TextPreset[] => {
  return textPresets.filter(preset => preset.isNew);
};

export const getPremiumPresets = (): TextPreset[] => {
  return textPresets.filter(preset => preset.isPremium);
};

export const getMostUsedPresets = (): TextPreset[] => {
  return textPresets.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
};

export const searchPresets = (query: string): TextPreset[] => {
  const lowercaseQuery = query.toLowerCase();
  return textPresets.filter(preset =>
    preset.name.toLowerCase().includes(lowercaseQuery) ||
    preset.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    preset.sampleText.toLowerCase().includes(lowercaseQuery)
  );
};