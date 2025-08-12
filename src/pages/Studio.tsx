import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../lib/useTemplates';

type TemplateItem = any;

function Row({
  title,
  items,
  onBrowseAll,
  itemWidth = 168,
  aspect = '4/3',
}: {
  title: string;
  items: TemplateItem[];
  onBrowseAll: () => void;
  itemWidth?: number;
  aspect?: string;
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
        <h3 className="text-base font-medium text-white/90">{title}</h3>
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
            className="rounded-lg bg-zinc-900 border border-white/10 shrink-0 snap-start overflow-hidden"
            style={{ width: itemWidth, aspectRatio: aspect as any }}
            title={t.title || t.name}
          >
            <img
              loading="lazy"
              src={t.previewURL || t.thumbnail || '/default-template.png'}
              className="w-full h-full object-cover"
              alt={t.title || t.name || 'template'}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Studio() {
  const navigate = useNavigate();
  const filterTabs = useMemo(
    () => ['All', 'Logo', 'Video', 'Poster', 'Instagram story', 'Flyer', 'Presentation'],
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const { templates: allTemplates, loading: loadingAll } = useTemplates(null);

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
    <div className="min-h-screen w-full bg-[#0f1115] text-white">
      <header className="sticky top-0 z-20 backdrop-blur bg-[#0f1115]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-2xl font-extrabold text-yellow-400">ViewsBoost Studio</div>
          <div className="ml-auto flex items-center gap-2">
            <input
              className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm w-72"
              placeholder="Search…"
            />
            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-red-500 text-black font-semibold">
              Create
            </button>
          </div>
        </div>
        {/* Top filter bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={
                  'px-3 py-1 rounded-full text-sm whitespace-nowrap border ' +
                  (selectedFilter === tab
                    ? 'bg-yellow-400 text-black border-yellow-500'
                    : 'bg-zinc-900/60 text-white/80 border-white/10 hover:bg-zinc-800')
                }
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
          <h2 className="text-lg font-semibold mb-3 text-white/90">Quick start</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[{w:1080,h:1080,label:'1080x1080'},{w:1080,h:1920,label:'1080x1920'},{w:1280,h:720,label:'1280x720'},{w:1920,h:1080,label:'1920x1080'}].map((s) => (
              <button key={s.label} className="aspect-video rounded-lg bg-zinc-900 border border-white/10 flex items-end justify-center p-2">
                <span className="text-xs text-white/70">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured based on filter */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium text-white/90">Browse templates</h3>
            <button
              onClick={() => navigate('/templates/Shorts')}
              className="text-xs text-yellow-300 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(loadingAll ? Array.from({ length: 12 }) : featured).map((t: any, i: number) => (
              <div
                key={t?.id || i}
                className="rounded-lg bg-zinc-900 border border-white/10 overflow-hidden aspect-[4/3]"
              >
                {loadingAll ? (
                  <div className="w-full h-full animate-pulse bg-zinc-800" />
                ) : (
                  <img
                    loading="lazy"
                    src={t.previewURL || t.thumbnail || '/default-template.png'}
                    className="w-full h-full object-cover"
                    alt={t.title || 'template'}
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        {catsData.map(({ cat, templates }) => (
          <Row
            key={cat}
            title={cat}
            items={templates || []}
            onBrowseAll={() => navigate(`/templates/${encodeURIComponent(cat)}`)}
            itemWidth={cat.toLowerCase().includes('short') ? 118 : 168}
            aspect={cat.toLowerCase().includes('short') ? '9/16' : '4/3'}
          />
        ))}
      </main>
    </div>
  );
}


