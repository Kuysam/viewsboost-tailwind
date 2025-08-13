import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, getCategories, TemplateManifestItem } from '../lib/templates/registry';
import TemplateCard from '../components/TemplateCard';
import CanvaEditor from '../components/CanvaEditor/CanvaEditor';
import { viewsBoostTemplateService } from '../components/CanvaEditor/services/ViewsBoostTemplateService';

type TemplateItem = any;

function Row({
  title,
  items,
  onBrowseAll,
  itemWidth = 220,
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
            className={`rounded-lg bg-white border ${borderClass} shrink-0 snap-start overflow-hidden`}
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
    () => ['All', 'Social Media Posts', 'Thumbnails', 'Shorts', 'Business', 'Marketing/Promotional', 'Documents'],
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('[Studio] Loading enhanced templates...');
        const enhancedTemplates = await viewsBoostTemplateService.getTemplates();
        if (!mounted) return;
        
        // Convert to the format expected by the UI
        const formattedTemplates = enhancedTemplates.map(template => ({
          id: template.id,
          title: template.title,
          name: template.title,
          category: template.category,
          preview: template.thumbnail,
          previewURL: template.thumbnail,
          thumbnail: template.thumbnail,
          jsonPath: template.thumbnail,
          width: template.dimensions?.width || 1152,
          height: template.dimensions?.height || 768,
          templateData: template // Store full template data
        }));
        
        console.log(`[Studio] Loaded ${formattedTemplates.length} enhanced templates`);
        setAllTemplates(formattedTemplates);
      } catch (error) {
        console.error('[Studio] Failed to load enhanced templates:', error);
        // Fallback to demo templates so user sees something
        setAllTemplates(demoTemplates);
        console.log('[Studio] Using demo templates as fallback');
      } finally {
        if (mounted) setLoadingAll(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const createPlaceholders = useCallback((count: number, category?: string) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `ph-${category || 'all'}-${i}`,
      title: category ? `${category} concept ${i + 1}` : `Template idea ${i + 1}`,
      category: category || ['Birthday','Fashion','Food','Social','Docs','Ads','Web/Content','Events','Commerce'][i % 9],
      tags: [],
    }));
  }, []);

  // Use enhanced templates instead of manifest
  const allFromManifest = useMemo(() => {
    return allTemplates;
  }, [allTemplates]);

  const featured = useMemo(() => {
    const t = allFromManifest;
    const sel = selectedFilter.toLowerCase();
    if (sel === 'all') return t.slice(0, 24);
    return t
      .filter((x) => {
        const hay = `${x.category || ''} ${x.title || ''}`.toLowerCase();
        return hay.includes(sel) || hay.replace(/-/g, ' ').includes(sel);
      })
      .slice(0, 24);
  }, [allFromManifest, selectedFilter]);

  // Demo editable templates (image, video, and docs)
  const demoTemplates = useMemo(() => [
    {
      id: 'demo-image-1080',
      title: 'Modern Poster A',
      category: 'Poster',
      width: 1080,
      height: 1350,
      studioEditor: {
        canvasType: 'image',
        dimensions: { width: 1080, height: 1350 },
        layers: [
          { type: 'background', asset: '/images/viewer.jpg', editable: false },
          { type: 'shape', element: 'rectangle', position: { x: 60, y: 1040 }, style: { width: 320, height: 140, fill: '#f59e0b', opacity: 0.9 } },
          { type: 'text', content: 'Modern Poster A', position: { x: 80, y: 1065 }, style: { fontSize: 42, color: '#111827', fontFamily: 'Arial', textAlign: 'left' } },
        ],
      },
      tags: ['image', 'poster']
    },
    {
      id: 'demo-video-shorts',
      title: 'Shorts Template',
      category: 'Shorts',
      width: 1080,
      height: 1920,
      studioEditor: {
        canvasType: 'video',
        dimensions: { width: 1080, height: 1920 },
        layers: [
          { type: 'video', url: '/assets/videos/video20.mp4', w: 1080, autoplay: true, loop: true, muted: true },
          { type: 'text', content: 'Your Headline', position: { x: 80, y: 1600 }, style: { fontSize: 72, color: '#ffffff', fontFamily: 'Arial', textAlign: 'left' } },
        ],
      },
      tags: ['video', 'shorts']
    },
    {
      id: 'demo-doc',
      title: 'Simple Resume',
      category: 'Docs',
      width: 1240,
      height: 1754,
      studioEditor: {
        canvasType: 'document',
        dimensions: { width: 1240, height: 1754 },
        layers: [
          { type: 'shape', element: 'rectangle', position: { x: 0, y: 0 }, style: { width: 1240, height: 1754, fill: '#ffffff' } },
          { type: 'shape', element: 'rectangle', position: { x: 0, y: 0 }, style: { width: 340, height: 1754, fill: '#0ea5e9', opacity: 0.12 } },
          { type: 'text', content: 'Jane Doe', position: { x: 420, y: 120 }, style: { fontSize: 64, color: '#0f172a', fontFamily: 'Arial', textAlign: 'left' } },
          { type: 'text', content: 'Product Designer', position: { x: 420, y: 200 }, style: { fontSize: 28, color: '#334155', fontFamily: 'Arial', textAlign: 'left' } },
          { type: 'text', content: 'Experience\n• Company A — Senior Designer\n• Company B — Designer', position: { x: 420, y: 320 }, style: { fontSize: 20, color: '#1f2937', fontFamily: 'Arial', textAlign: 'left' } },
        ],
      },
      tags: ['document', 'resume']
    },
  ], []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const openTemplate = (tpl: any) => { setSelectedTemplate(tpl); setEditorOpen(true); };
  const topCategories = useMemo(() => {
    // Extract unique categories from all templates
    const categories = [...new Set(allTemplates.map(t => t.category).filter(Boolean))];
    return categories.slice(0, 8); // Limit to first 8 categories
  }, [allTemplates]);

  // Build per-category lists from manifest
  const catsData = useMemo(() => {
    return topCategories.map((cat) => ({
      cat,
      templates: allFromManifest.filter((t) => (t.category || '').toLowerCase() === cat.toLowerCase()),
    }));
  }, [topCategories, allFromManifest]);

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
          <div className="flex gap-2 items-center">
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
      <main className="w-full px-4 py-6 overflow-y-auto">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {(loadingAll ? createPlaceholders(12) : (featured.length ? featured : demoTemplates)).map((t: any, i: number) => (
              <div key={t?.id || i} className={`rounded-lg bg-white border ${borderSubtle} overflow-hidden w-full h-48`}>
                <TemplateCard template={t} dark={theme.dark} aspect="4/3" onClick={() => openTemplate(t)} />
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
            items={((templates || []) as any).slice(0, 12)}
            onBrowseAll={() => navigate(`/templates/${encodeURIComponent(cat)}`)}
            itemWidth={cat.toLowerCase().includes('short') ? 118 : 168}
            aspect={cat.toLowerCase().includes('short') ? '9/16' : '4/3'}
                    />
                  ))}
        </main>

      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur">
          <div className="h-screen w-full relative">
            <button
              onClick={() => setEditorOpen(false)}
              className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Close
            </button>
            <CanvaEditor initialTemplate={selectedTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}


