import React, { useMemo } from 'react';

type Tmpl = {
  id?: string;
  title?: string;
  name?: string;
  category?: string;
  tags?: string[];
  previewURL?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
};

type Variant = {
  label: string;
  accentFrom: string;
  accentTo: string;
  chipBg: string;
  chipText: string;
  pattern?: 'confetti' | 'diagonal' | 'dots' | 'grid' | 'none';
  platformIcon?: string; // path in public/platform-logos
};

function pickVariant(category: string | undefined, tags: string[] | undefined): Variant {
  const hay = `${(category || '').toLowerCase()} ${(tags || []).join(' ').toLowerCase()}`;

  const choose = (v: Variant) => v;

  // Platform / media first
  if (/instagram|reel|story|carousel/.test(hay))
    return choose({ label: 'Instagram', accentFrom: '#fd1d1d', accentTo: '#833ab4', chipBg: 'bg-pink-600', chipText: 'text-white', platformIcon: '/platform-logos/instagram.svg', pattern: 'diagonal' });
  if (/youtube|thumb|banner/.test(hay))
    return choose({ label: 'YouTube', accentFrom: '#ff4d4f', accentTo: '#b91c1c', chipBg: 'bg-red-600', chipText: 'text-white', platformIcon: '/platform-logos/youtube.svg', pattern: 'diagonal' });
  if (/tiktok/.test(hay))
    return choose({ label: 'TikTok', accentFrom: '#00f0ff', accentTo: '#ff0050', chipBg: 'bg-black', chipText: 'text-white', platformIcon: '/platform-logos/tiktok.svg', pattern: 'diagonal' });
  if (/facebook/.test(hay))
    return choose({ label: 'Facebook', accentFrom: '#1877f2', accentTo: '#0b5cd5', chipBg: 'bg-blue-600', chipText: 'text-white', platformIcon: '/platform-logos/facebook.svg', pattern: 'grid' });
  if (/twitter|x\b/.test(hay))
    return choose({ label: 'X', accentFrom: '#0a0a0a', accentTo: '#2d2d2d', chipBg: 'bg-neutral-900', chipText: 'text-white', platformIcon: '/platform-logos/twitter.svg', pattern: 'diagonal' });
  if (/linkedin/.test(hay))
    return choose({ label: 'LinkedIn', accentFrom: '#0a66c2', accentTo: '#004182', chipBg: 'bg-sky-700', chipText: 'text-white', platformIcon: '/platform-logos/linkedin.svg', pattern: 'grid' });
  if (/pinterest/.test(hay))
    return choose({ label: 'Pinterest', accentFrom: '#e60023', accentTo: '#b0001a', chipBg: 'bg-red-700', chipText: 'text-white', platformIcon: '/platform-logos/pinterest.svg', pattern: 'diagonal' });

  // Content types
  if (/short|reel|story|9:16/.test(hay))
    return choose({ label: 'Shorts/Story', accentFrom: '#10b981', accentTo: '#06b6d4', chipBg: 'bg-emerald-600', chipText: 'text-white', pattern: 'diagonal' });
  if (/thumb/.test(hay))
    return choose({ label: 'Thumbnail', accentFrom: '#ef4444', accentTo: '#f97316', chipBg: 'bg-red-600', chipText: 'text-white', pattern: 'diagonal' });
  if (/document|doc|report|resume|proposal|invoice/.test(hay))
    return choose({ label: 'Document', accentFrom: '#3b82f6', accentTo: '#6366f1', chipBg: 'bg-blue-600', chipText: 'text-white', pattern: 'grid' });
  if (/poster|flyer|print|brochure|business card/.test(hay))
    return choose({ label: 'Print', accentFrom: '#22c55e', accentTo: '#84cc16', chipBg: 'bg-green-600', chipText: 'text-white', pattern: 'dots' });
  if (/marketing|promo|sale|coupon|product/.test(hay))
    return choose({ label: 'Promo', accentFrom: '#f59e0b', accentTo: '#d946ef', chipBg: 'bg-amber-500', chipText: 'text-black', pattern: 'diagonal' });
  if (/business|branding|logo/.test(hay))
    return choose({ label: 'Business', accentFrom: '#06b6d4', accentTo: '#3b82f6', chipBg: 'bg-cyan-600', chipText: 'text-white', pattern: 'grid' });

  // From templates list doc specifics
  if (/birthday/.test(hay))
    return choose({ label: 'Birthday', accentFrom: '#f472b6', accentTo: '#f59e0b', chipBg: 'bg-pink-500', chipText: 'text-white', pattern: 'confetti' });
  if (/fashion/.test(hay))
    return choose({ label: 'Fashion', accentFrom: '#a855f7', accentTo: '#ec4899', chipBg: 'bg-fuchsia-600', chipText: 'text-white', pattern: 'diagonal' });
  if (/food|menu/.test(hay))
    return choose({ label: 'Food', accentFrom: '#fb923c', accentTo: '#ef4444', chipBg: 'bg-orange-500', chipText: 'text-black', pattern: 'dots' });
  if (/social/.test(hay))
    return choose({ label: 'Social', accentFrom: '#60a5fa', accentTo: '#a78bfa', chipBg: 'bg-blue-500', chipText: 'text-white', pattern: 'diagonal' });
  if (/ads|iab|display/.test(hay))
    return choose({ label: 'Ads', accentFrom: '#f59e0b', accentTo: '#ef4444', chipBg: 'bg-amber-500', chipText: 'text-black', pattern: 'diagonal' });
  if (/web|newsletter|infographic|timeline|portfolio|moodboard|presentation/.test(hay))
    return choose({ label: 'Web/Content', accentFrom: '#38bdf8', accentTo: '#22d3ee', chipBg: 'bg-sky-500', chipText: 'text-black', pattern: 'grid' });
  if (/docs|resume|report|proposal|invoice|contract|letterhead|certificate|checklist|guide|ebook/.test(hay))
    return choose({ label: 'Docs', accentFrom: '#3b82f6', accentTo: '#6366f1', chipBg: 'bg-blue-600', chipText: 'text-white', pattern: 'grid' });
  if (/events|invitation|program|schedule|announcement/.test(hay))
    return choose({ label: 'Events', accentFrom: '#fb7185', accentTo: '#f59e0b', chipBg: 'bg-rose-500', chipText: 'text-white', pattern: 'confetti' });
  if (/commerce|coupon|sale banner|product showcase|promo/.test(hay))
    return choose({ label: 'Commerce', accentFrom: '#f59e0b', accentTo: '#facc15', chipBg: 'bg-amber-400', chipText: 'text-black', pattern: 'diagonal' });

  return choose({ label: 'Template', accentFrom: '#64748b', accentTo: '#0ea5e9', chipBg: 'bg-slate-600', chipText: 'text-white' });
}

function patternStyle(v: Variant): React.CSSProperties | undefined {
  switch (v.pattern) {
    case 'confetti':
      return {
        backgroundImage:
          'radial-gradient(#fff 1px, transparent 1px), radial-gradient(#fff 1px, transparent 1px)',
        backgroundPosition: '0 0, 8px 8px',
        backgroundSize: '16px 16px',
        opacity: 0.15,
      } as React.CSSProperties;
    case 'diagonal':
      return {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,.15) 0, rgba(255,255,255,.15) 6px, transparent 6px, transparent 12px)',
        opacity: 0.6,
      } as React.CSSProperties;
    case 'dots':
      return {
        backgroundImage: 'radial-gradient(rgba(255,255,255,.25) 1px, transparent 1px)',
        backgroundSize: '6px 6px',
        opacity: 0.6,
      } as React.CSSProperties;
    case 'grid':
      return {
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
        opacity: 0.5,
      } as React.CSSProperties;
    default:
      return undefined;
  }
}

export default function TemplateCard({ template, dark, aspect = '4/3', onClick }: { template: Tmpl; dark: boolean; aspect?: string; onClick?: () => void }) {
  const title = template.title || template.name || 'Untitled';
  const img = template.previewURL || template.thumbnail || '';
  const variant = useMemo(() => pickVariant(template.category, template.tags), [template.category, template.tags]);

  const border = dark ? 'border-white/10' : 'border-black/10';
  const labelText = dark ? 'text-white' : 'text-zinc-900';
  const subText = dark ? 'text-white/80' : 'text-zinc-700';

  return (
    <button
      onClick={onClick}
      className={`group relative w-full h-full rounded-lg overflow-hidden border ${border} focus:outline-none focus:ring-2 focus:ring-yellow-400`}
      style={{ aspectRatio: aspect as any }}
      title={title}
    >
      {/* Background layer (image or gradient for placeholder) */}
      {img ? (
        <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${variant.accentFrom} 0%, ${variant.accentTo} 100%)`,
          }}
        />
      )}
      {/* Accent gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${variant.accentFrom}44 0%, ${variant.accentTo}66 100%)`,
          mixBlendMode: 'soft-light',
        }}
      />
      {/* Pattern overlay */}
      {variant.pattern && variant.pattern !== 'none' && (
        <div className="absolute inset-0 pointer-events-none" style={patternStyle(variant)} />
      )}
      {/* Bottom label bar */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
        <div className={`text-[12px] font-medium truncate ${labelText}`}>{title}</div>
        <div className={`text-[10px] ${subText}`}>{variant.label}</div>
      </div>
      {/* Category chip */}
      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold ${variant.chipBg} ${variant.chipText} shadow-sm`}>{variant.label}</div>
      {/* Platform icon if any */}
      {variant.platformIcon && (
        <img src={variant.platformIcon} alt="platform" className="absolute top-2 right-2 h-4 w-4 opacity-90" />
      )}
    </button>
  );
}


