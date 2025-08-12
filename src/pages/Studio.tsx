import React from 'react';

export default function Studio() {
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

        {[
          'Shorts',
          'Thumbnails',
          'Docs',
          'Stock Photos',
          'Stock Videos'
        ].map((title) => (
          <section key={title} className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium text-white/90">{title}</h3>
              <button className="text-xs text-yellow-300 hover:underline">Browse all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[160px] aspect-[4/3] rounded-lg bg-zinc-900 border border-white/10 shrink-0 snap-start"
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}


