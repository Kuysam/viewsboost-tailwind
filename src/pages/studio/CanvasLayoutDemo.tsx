import React from 'react';

export default function CanvasLayoutDemo() {
  return (
    <div className="min-h-screen text-white grid grid-cols-[280px_1fr_320px] grid-rows-[56px_1fr]">
      {/* Top Bar */}
      <div className="col-span-3 h-14 flex items-center gap-2 px-4 bg-black/60 backdrop-blur border-b border-white/10">
        <button className="px-3 py-1 rounded bg-white/10 text-sm">New</button>
        <button className="px-3 py-1 rounded bg-white/10 text-sm">Open</button>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-3 py-1 rounded bg-white/10 text-sm">Undo</button>
          <button className="px-3 py-1 rounded bg-white/10 text-sm">Redo</button>
          <button className="px-3 py-1 rounded bg-yellow-400 text-black text-sm font-semibold">Export</button>
        </div>
      </div>

      {/* Left Panel */}
      <aside className="row-span-1 bg-black/30 border-r border-white/10 p-3 space-y-2 overflow-y-auto">
        <div className="text-xs text-white/60 mb-2">Tools</div>
        {['Move','Text','Shape','Image','Video','Styles','Templates'].map(i => (
          <button key={i} className="w-full text-left px-3 py-2 rounded bg-white/10 hover:bg-white/15 text-sm">{i}</button>
        ))}
      </aside>

      {/* Canvas Area */}
      <main className="bg-[#0f1115] flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded shadow-inner" style={{ width: 1080/2, height: 1920/2 }} />
      </main>

      {/* Right Panel */}
      <aside className="bg-black/30 border-l border-white/10 p-3 overflow-y-auto">
        <div className="text-xs text-white/60 mb-2">Properties</div>
        {['Position','Fill','Stroke','Typography','Effects','Arrange'].map(s => (
          <div key={s} className="mb-3">
            <div className="text-[11px] text-white/70 mb-1">{s}</div>
            <div className="h-20 rounded bg-white/5 border border-white/10" />
          </div>
        ))}
      </aside>
    </div>
  );
}


