import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTimelineStore, getTotalDuration } from '../../store/timeline';

function formatTime(s: number) {
  const sec = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function Timeline() {
  const {
    fps, zoom, currentTime, playing, scenes, audio,
    setTime, togglePlay, setZoom, addScene, duplicateScene, deleteScene,
    moveScene, trimScene, splitScene, timeToPixel, pixelToTime,
  } = useTimelineStore();

  const total = useMemo(() => getTotalDuration(useTimelineStore.getState()), [scenes, audio]);
  const [height, setHeight] = useState(160);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if ((e.metaKey || e.ctrlKey) && e.key === '+') { e.preventDefault(); setZoom(zoom * 1.25); }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') { e.preventDefault(); setZoom(zoom / 1.25); }
      if (e.key === 'ArrowRight') { setTime(currentTime + (e.shiftKey ? 1 : 0.1)); }
      if (e.key === 'ArrowLeft') { setTime(currentTime - (e.shiftKey ? 1 : 0.1)); }
      if (e.key.toLowerCase() === 's') { const sc = scenes.find(s=> currentTime>=s.start && currentTime < s.start+s.duration); if(sc) splitScene(sc.id, currentTime); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTime, scenes, setTime, togglePlay, setZoom, zoom, splitScene]);

  // playhead tick (visual only)
  useEffect(() => {
    let raf = 0; let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (useTimelineStore.getState().playing) {
        useTimelineStore.setState((s) => ({ currentTime: Math.min(total, s.currentTime + dt) }));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const playheadLeft = `${(currentTime / Math.max(1e-3, total)) * 100}%`;

  const onRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left + (e.currentTarget.parentElement?.scrollLeft || 0);
    setTime(pixelToTime(x));
    const onMove = (ev: MouseEvent) => {
      const x2 = ev.clientX - rect.left + ((e.currentTarget.parentElement as HTMLDivElement).scrollLeft || 0);
      setTime(pixelToTime(x2));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="border-t border-gray-200 bg-[#0b0e11] text-white" style={{ height }} ref={containerRef}>
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111318] border-b border-white/10">
        <div className="flex items-center gap-2 text-xs">
          <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
          <div className="opacity-80">{formatTime(currentTime)} / {formatTime(total)}</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-2 py-1 rounded bg-white/10" onClick={() => setZoom(zoom / 1.25)}>-</button>
          <div className="w-16 text-center">{Math.round(zoom)}px/s</div>
          <button className="px-2 py-1 rounded bg-white/10" onClick={() => setZoom(zoom * 1.25)}>+</button>
        </div>
      </div>

      {/* Ruler + tracks */}
      <div className="relative overflow-x-auto overflow-y-hidden" style={{ height: height - 40 }}>
        {/* Ruler */}
        <div className="h-6 bg-[#111318] border-b border-white/10 relative min-w-full" onMouseDown={onRulerMouseDown}>
          {Array.from({ length: Math.ceil(total) + 1 }).map((_, i) => (
            <div key={i} className="absolute top-0 h-full border-l border-white/20 text-[10px] text-white/70 px-1"
                 style={{ left: timeToPixel(i) }}>
              {i}s
            </div>
          ))}
        </div>

        {/* Scenes track */}
        <div className="relative h-10 bg-[#0f1217] border-b border-white/10">
          {scenes.map((s, idx) => (
            <div key={s.id}
                 className="absolute top-1 bottom-1 rounded bg-white/10 border border-white/20 cursor-pointer"
                 style={{ left: timeToPixel(s.start), width: timeToPixel(s.duration) }}
                 title={`${s.name || 'Scene'} — ${s.duration.toFixed(1)}s`}
                 onDoubleClick={() => duplicateScene(s.id)}
                 onClick={() => setTime(s.start)}
            >
              <div className="absolute inset-0 flex items-center gap-2 px-2 text-xs">
                <img src={s.thumb} alt="thumb" className="w-10 h-6 object-cover rounded" />
                <span className="truncate">{s.name || 'Scene'}</span>
                <span className="opacity-70">{s.duration.toFixed(1)}s</span>
              </div>
              {/* trim handles */}
              <div className="absolute left-0 top-0 h-full w-1.5 bg-white/40 cursor-col-resize"
                   onMouseDown={(e) => {
                     const startX = e.clientX; const start = s.start; const dur = s.duration;
                     const onMove = (ev: MouseEvent) => {
                       const dx = ev.clientX - startX; const t = start + dx / useTimelineStore.getState().zoom;
                       useTimelineStore.getState().trimScene(s.id, 'start', t);
                     };
                     const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                     window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                   }} />
              <div className="absolute right-0 top-0 h-full w-1.5 bg-white/40 cursor-col-resize"
                   onMouseDown={(e) => {
                     const startX = e.clientX; const st = s.start; const dur = s.duration;
                     const onMove = (ev: MouseEvent) => {
                       const dx = ev.clientX - startX; const t = st + dur + dx / useTimelineStore.getState().zoom;
                       useTimelineStore.getState().trimScene(s.id, 'end', t);
                     };
                     const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                     window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
                   }} />
            </div>
          ))}
        </div>

        {/* Audio track (placeholder) */}
        <div className="relative h-10 bg-[#0f1217]">
          <div className="absolute left-2 top-2 text-[11px] text-white/70">Audio</div>
        </div>

        {/* Playhead */}
        <div className="pointer-events-none absolute top-0 bottom-0 border-l-2 border-yellow-400" style={{ left: playheadLeft }} />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-[11px] bg-[#111318] border-t border-white/10">
        <div>Total: {formatTime(total)}</div>
        <div>Zoom: {Math.round(zoom)}px/s</div>
        <div>Pages: {scenes.length}</div>
      </div>
    </div>
  );
}


