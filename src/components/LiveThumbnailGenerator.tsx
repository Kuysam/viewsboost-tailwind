import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LiveThumbnailGeneratorProps {
  template: any;
  width?: number;
  height?: number;
  className?: string;
}

const LiveThumbnailGenerator: React.FC<LiveThumbnailGeneratorProps> = ({
  template,
  width = 320,
  height = 180,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateLiveThumbnail();
  }, [template]);

  const generateLiveThumbnail = async () => {
    if (!canvasRef.current || !template) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    try {
      // Create gradient background based on template category
      const gradient = createCategoryGradient(ctx, template.category);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add template elements simulation
      await drawTemplateElements(ctx, template, width, height);

      // Generate thumbnail URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailUrl(dataUrl);
    } catch (error) {
      console.error('Error generating live thumbnail:', error);
    }

    setIsGenerating(false);
  };

  const createCategoryGradient = (ctx: CanvasRenderingContext2D, category: string) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    
    // Category-based color schemes
    switch (category?.toLowerCase()) {
      case 'tiktok shorts':
      case 'tiktok':
        gradient.addColorStop(0, '#ff0050');
        gradient.addColorStop(1, '#00f2ea');
        break;
      case 'youtube shorts':
      case 'youtube':
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#282828');
        break;
      case 'instagram':
      case 'instagram reel':
        gradient.addColorStop(0, '#f09433');
        gradient.addColorStop(0.5, '#e6683c');
        gradient.addColorStop(1, '#dc2743');
        break;
      case 'facebook':
        gradient.addColorStop(0, '#1877f2');
        gradient.addColorStop(1, '#42a5f5');
        break;
      case 'linkedin':
        gradient.addColorStop(0, '#0077b5');
        gradient.addColorStop(1, '#00a0dc');
        break;
      case 'twitter':
        gradient.addColorStop(0, '#1da1f2');
        gradient.addColorStop(1, '#0d8bd9');
        break;
      default:
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
    }
    
    return gradient;
  };

  const drawTemplateElements = async (ctx: CanvasRenderingContext2D, template: any, w: number, h: number) => {
    // Simulate template elements
    
    // Title text
    if (template.title) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.title.substring(0, 20), w / 2, h / 2 - 20);
    }

    // Category badge
    if (template.category) {
      const badgeWidth = 120;
      const badgeHeight = 24;
      const badgeX = (w - badgeWidth) / 2;
      const badgeY = h / 2 + 10;

      // Badge background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
      ctx.fill();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.category.toUpperCase(), w / 2, badgeY + 16);
    }

    // Platform icon simulation
    if (template.platform) {
      const iconSize = 32;
      const iconX = w - iconSize - 10;
      const iconY = 10;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      
      // Platform initial
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.platform[0].toUpperCase(), iconX + iconSize/2, iconY + iconSize/2 + 5);
    }

    // Quality indicator
    if (template.quality === 'premium' || template.isPremium) {
      const crownSize = 20;
      const crownX = 10;
      const crownY = 10;

      ctx.fillStyle = '#ffd700';
      ctx.font = `${crownSize}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('👑', crownX, crownY + crownSize);
    }

    // Duration indicator for videos
    if (template.duration) {
      const durationBadgeWidth = 50;
      const durationBadgeHeight = 20;
      const durationX = w - durationBadgeWidth - 10;
      const durationY = h - durationBadgeHeight - 10;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.roundRect(durationX, durationY, durationBadgeWidth, durationBadgeHeight, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(template.duration, durationX + durationBadgeWidth/2, durationY + 14);
    }

    // Add some decorative elements
    drawDecorativeElements(ctx, w, h);
  };

  const drawDecorativeElements = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Add some subtle geometric shapes
    ctx.globalAlpha = 0.1;
    
    // Circles
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        Math.random() * w,
        Math.random() * h,
        Math.random() * 30 + 10,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }

    // Triangles
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = Math.random() * 20 + 10;
      ctx.moveTo(x, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x - size, y + size);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  if (template.preview && !isGenerating) {
    // If template has a preview image, use it instead
    return (
      <img
        src={template.preview}
        alt={template.title}
        className={`object-cover ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
        style={{ display: thumbnailUrl ? 'block' : 'none' }}
      />
      
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      )}

      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={template.title}
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
        />
      )}

      {!thumbnailUrl && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg">
          <div className="text-center text-white">
            <div className="text-2xl mb-2">{template.icon || '🎨'}</div>
            <div className="text-sm font-medium">{template.title}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extend CanvasRenderingContext2D to include roundRect if not available
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, width: number, height: number, radius: number): void;
  }
}

// Polyfill for roundRect if not available
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

export default LiveThumbnailGenerator;