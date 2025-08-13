// Generate thumbnail images for JSON templates
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateCategories = {
  'ads': { colors: ['#ef4444', '#f97316'], name: 'Ads Template' },
  'birthday': { colors: ['#ec4899', '#be185d'], name: 'Birthday Template' },
  'branding': { colors: ['#8b5cf6', '#7c3aed'], name: 'Branding Template' },
  'business': { colors: ['#059669', '#047857'], name: 'Business Template' },
  'commerce_promo': { colors: ['#f59e0b', '#d97706'], name: 'Commerce Promo' },
  'docs': { colors: ['#6366f1', '#4f46e5'], name: 'Document Template' },
  'events_personal': { colors: ['#ec4899', '#be185d'], name: 'Events Template' },
  'facebook': { colors: ['#3b82f6', '#1d4ed8'], name: 'Facebook Template' },
  'fashion': { colors: ['#8b5cf6', '#7c3aed'], name: 'Fashion Template' },
  'food': { colors: ['#f59e0b', '#d97706'], name: 'Food Template' },
  'instagram': { colors: ['#ec4899', '#8b5cf6'], name: 'Instagram Template' },
  'linkedin': { colors: ['#0ea5e9', '#0284c7'], name: 'LinkedIn Template' },
  'print': { colors: ['#6b7280', '#4b5563'], name: 'Print Template' },
  'sale': { colors: ['#ef4444', '#dc2626'], name: 'Sale Template' },
  'shorts_video': { colors: ['#ef4444', '#f97316'], name: 'Shorts Video' },
  'social': { colors: ['#0ea5e9', '#0284c7'], name: 'Social Media' },
  'thumbnails': { colors: ['#111827', '#1f2937'], name: 'YouTube Thumbnail' },
  'tiktok': { colors: ['#0ea5e9', '#111827'], name: 'TikTok Template' },
  'twitch': { colors: ['#8b5cf6', '#7c3aed'], name: 'Twitch Template' },
  'twitter_x': { colors: ['#000000', '#374151'], name: 'Twitter/X Template' },
  'web_content': { colors: ['#059669', '#047857'], name: 'Web Content' },
  'youtube': { colors: ['#ef4444', '#dc2626'], name: 'YouTube Template' }
};

function generateSVGThumbnail(templateKey, templateData) {
  const { colors, name } = templateData;
  const [startColor, endColor] = colors;
  
  return `<svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="300" height="200" fill="url(#bg-gradient)"/>
  <rect x="20" y="20" width="100" height="80" rx="8" ry="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <rect x="140" y="30" width="140" height="20" rx="4" ry="4" fill="rgba(255,255,255,0.9)"/>
  <rect x="140" y="60" width="100" height="12" rx="2" ry="2" fill="rgba(255,255,255,0.6)"/>
  <rect x="140" y="80" width="60" height="16" rx="8" ry="8" fill="rgba(255,255,255,0.8)"/>
  <text x="150" y="140" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="white">${name}</text>
  <text x="150" y="160" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)">JSON Template</text>
</svg>`;
}

// Create thumbnails directory
const thumbnailsDir = path.join(__dirname, '../public/templates/json/thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
  fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Generate SVG thumbnails for each template
Object.entries(templateCategories).forEach(([key, data]) => {
  const svgContent = generateSVGThumbnail(key, data);
  const filePath = path.join(thumbnailsDir, `${key}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Generated thumbnail: ${key}.svg`);
});

console.log(`Generated ${Object.keys(templateCategories).length} thumbnails in ${thumbnailsDir}`);