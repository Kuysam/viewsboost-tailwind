import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../lib/useTemplates';
import TemplateCard from '../components/TemplateCard';

type TemplateItem = any;

function Row({
  title,
  items,
  onBrowseAll,
  itemWidth = 168,
  aspect = '4/3',
  titleClassName = 'text-base font-bold',
  cardBgClass = 'bg-white',
  borderClass = 'border-black/10',
}: {
  title: string;
  items: TemplateItem[];
  onBrowseAll: () => void;
  itemWidth?: number;
  aspect?: string;
  titleClassName?: string;
  cardBgClass?: string;
  borderClass?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(12);
  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const nearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 200;
    if (nearEnd) setVisible((v) => Math.min(v + 12, items.length));
  }, [items.length]);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className={titleClassName}>{title}</h3>
        <button onClick={onBrowseAll} className="text-xs text-yellow-300 hover:underline">
          Browse all
        </button>
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex gap-3 overflow-x-auto snap-x scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent"
      >
        {items.slice(0, visible).map((t, i) => (
          <div
            key={t.id || i}
            className={`rounded-lg ${cardBgClass} border ${borderClass} shrink-0 snap-start overflow-hidden`}
            style={{ width: itemWidth }}
            title={t.title || t.name}
          >
            <TemplateCard template={t as any} dark={titleClassName.includes('text-white')} aspect={aspect} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Studio() {
  const navigate = useNavigate();
  // --- Theme system ---
  const THEMES = useMemo(
    () => [
      { id: 'polished-dark', name: 'Polished Dark', dark: true, bg: 'linear-gradient(135deg,#17171c 0%,#232438 100%)' },
      { id: 'matte-dark', name: 'Matte Dark', dark: true, bg: 'linear-gradient(135deg,#121318 0%,#1b1d26 100%)' },
      { id: 'midnight', name: 'Midnight', dark: true, bg: 'linear-gradient(135deg,#0b1020 0%,#151a2e 100%)' },
      { id: 'deep-violet', name: 'Deep Violet', dark: true, bg: 'linear-gradient(135deg,#1d1033 0%,#2a1d4a 100%)' },
      { id: 'slate', name: 'Slate', dark: true, bg: 'linear-gradient(135deg,#0f172a 0%,#1f2937 100%)' },
      { id: 'ocean-dark', name: 'Ocean Dark', dark: true, bg: 'linear-gradient(135deg,#0b132b 0%,#1c2541 100%)' },
      { id: 'soft-light', name: 'Soft Light', dark: false, bg: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)' },
      { id: 'warm-sunrise', name: 'Warm Sunrise', dark: false, bg: 'linear-gradient(135deg,#fff7ed 0%,#fde68a 100%)' },
      { id: 'mint-fresh', name: 'Mint Fresh', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#d1fae5 100%)' },
      { id: 'sky-day', name: 'Sky Day', dark: false, bg: 'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)' },
      { id: 'desert-sand', name: 'Sand', dark: false, bg: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)' },
      { id: 'peach', name: 'Peach', dark: false, bg: 'linear-gradient(135deg,#ffe4e6 0%,#fecdd3 100%)' },
      // New light themes
      { id: 'lavender-mist', name: 'Lavender Mist', dark: false, bg: 'linear-gradient(135deg,#f5f3ff 0%,#e9d5ff 100%)' },
      { id: 'citrus-cream', name: 'Citrus Cream', dark: false, bg: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fde68a 100%)' },
      { id: 'aqua-breeze', name: 'Aqua Breeze', dark: false, bg: 'linear-gradient(135deg,#ecfeff 0%,#bae6fd 50%,#a7f3d0 100%)' },
      { id: 'blush-cloud', name: 'Blush Cloud', dark: false, bg: 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 50%,#fbcfe8 100%)' },
    ],
    []
  );
  const [themeId, setThemeId] = useState<string>('soft-light');
  const theme = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [THEMES, themeId]);
  const textPrimary = theme.dark ? 'text-white' : 'text-zinc-900';
  const textSubtle = theme.dark ? 'text-white/90' : 'text-zinc-800';
  const titleStrong = theme.dark ? 'text-white' : 'text-zinc-900';
  const borderSubtle = theme.dark ? 'border-white/10' : 'border-black/10';
  const cardBg = theme.dark ? 'bg-zinc-900' : 'bg-white';
  const chipBg = theme.dark ? 'bg-zinc-900/60' : 'bg-white';
  const filterTabs = useMemo(
    () => ['All', 'Logo', 'Video', 'Poster', 'Instagram story', 'Flyer', 'Presentation'],
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const { templates: allTemplates, loading: loadingAll } = useTemplates(null);

  const createPlaceholders = useCallback((count: number, category?: string) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `ph-${category || 'all'}-${i}`,
      title: category ? `${category} concept ${i + 1}` : `Template idea ${i + 1}`,
      category: category || ['Birthday','Fashion','Food','Social','Docs','Ads','Web/Content','Events','Commerce'][i % 9],
      tags: [],
    }));
  }, []);

  const featured = useMemo(() => {
    const t = (allTemplates || []) as any[];
    const sel = selectedFilter.toLowerCase();
    if (sel === 'all') return t.slice(0, 24);
    return t
      .filter((x) => {
        const cat = (x.category || '').toLowerCase();
        const tags = Array.isArray(x.tags) ? x.tags.map((s: string) => s.toLowerCase()) : [];
        const hay = [cat, ...tags].join(' ');
        return hay.includes(sel) || hay.replace(/-/g, ' ').includes(sel);
      })
      .slice(0, 24);
  }, [allTemplates, selectedFilter]);
  const topCategories = useMemo(
    () => [
      'Shorts',
      'Thumbnails',
      'Documents',
      'Marketing/Promotional',
      'Social Media Posts',
    ],
    []
  );

  // Fetch per category using existing Firestore-only hook
  const catsData = topCategories.map((c) => ({ cat: c, ...useTemplates(c) }));

  return (
    <div className={`min-h-screen w-full ${textPrimary}`} style={{ background: theme.bg }}>
      <header className={`sticky top-0 z-20 backdrop-blur border-b ${borderSubtle}`} style={{ background: theme.dark ? 'rgba(15,17,21,0.65)' : 'rgba(255,255,255,0.65)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-yellow-500">ViewsBoost Studio</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              className={`${chipBg} ${borderSubtle} border rounded-lg px-3 py-2 text-sm w-72 ${theme.dark ? 'text-white' : 'text-zinc-900'}`}
              placeholder="Search…"
            />
            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold">
              Create
            </button>
          </div>
        </div>
        {/* Theme picker */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm whitespace-nowrap border ${borderSubtle} ${themeId===t.id ? 'ring-2 ring-yellow-400' : ''}`}
                style={{ background: t.bg }}
                title={t.name}
              >
                <span className={`px-2 py-0.5 rounded ${t.dark ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-900'}`}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Top filter bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${selectedFilter===tab ? 'bg-yellow-400 text-black border-yellow-500' : `${chipBg} ${borderSubtle} ${theme.dark ? 'text-white/80 hover:bg-zinc-800' : 'text-zinc-800 hover:bg-zinc-100'}`}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Scrollable dashboard content */}
      <main className="max-w-7xl mx-auto px-4 py-6 overflow-y-auto">
        <section className="mb-8">
          <h2 className={`text-[16px] font-bold mb-3 ${titleStrong}`}>Quick start</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[{w:1080,h:1080,label:'1080x1080'},{w:1080,h:1920,label:'1080x1920'},{w:1280,h:720,label:'1280x720'},{w:1920,h:1080,label:'1920x1080'}].map((s) => (
              <button key={s.label} className={`aspect-video rounded-lg ${cardBg} border ${borderSubtle} flex items-end justify-center p-2`}>
                <span className={`text-xs ${theme.dark ? 'text-white/70' : 'text-zinc-700'}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured based on filter */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-[16px] font-bold ${titleStrong}`}>Browse templates</h3>
            <button
              onClick={() => navigate('/templates/Shorts')}
              className="text-xs text-yellow-600 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(loadingAll ? createPlaceholders(12) : (featured.length ? featured : createPlaceholders(12))).map((t: any, i: number) => (
              <div key={t?.id || i} className={`rounded-lg ${cardBg} border ${borderSubtle} overflow-hidden`}>
                <TemplateCard template={t} dark={theme.dark} aspect="4/3" />
              </div>
            ))}
          </div>
        </section>

        {catsData.map(({ cat, templates }) => (
          <Row
            key={cat}
            title={cat}
            titleClassName={`text-[16px] font-bold ${titleStrong}`}
            cardBgClass={cardBg}
            borderClass={borderSubtle}
            items={(templates || []) as any}
            onBrowseAll={() => navigate(`/templates/${encodeURIComponent(cat)}`)}
            itemWidth={cat.toLowerCase().includes('short') ? 118 : 168}
            aspect={cat.toLowerCase().includes('short') ? '9/16' : '4/3'}
          />
        ))}
      </main>
    </div>
  );
}


