import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useEditorStore } from './core/state';
import { Clip } from './core/types';

function Header() {
  const { project } = useEditorStore();
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="font-semibold text-gray-900">{project.title} — Editor V2</div>
      <div className="text-xs text-gray-500">alpha scaffold</div>
    </div>
  );
}

function CanvasStub() {
  const page = useEditorStore((s) => s.project.pages.find(p => p.id === s.project.currentPageId));
  const preview = useEditorStore((s) => s.preview);
  if (!page) return null;
  const scale = 360 / page.size.width;
  const w = Math.round(page.size.width * scale);
  const h = Math.round(page.size.height * scale);
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="relative bg-white rounded border border-gray-200 shadow-sm overflow-hidden" style={{ width: w, height: h }}>
        {!preview && <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Drop a video/image to preview</div>}
        {preview?.type === 'image' && (
          <img src={preview.url} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {preview?.type === 'video' && (
          <video src={preview.url} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
        )}
        {preview?.type === 'pdf' && (
          <iframe src={preview.url} className="absolute inset-0 w-full h-full" title="doc" />
        )}
      </div>
    </div>
  );
}

function Timeline() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { tracks, playhead, setPlayhead, addClip, setPreview, selected, setSelected, moveClip, resizeClip } = useEditorStore();
  const videoTrackId = tracks.find(t => t.type === 'video')?.id || tracks[0]?.id;
  const imageTrackId = tracks.find(t => t.type === 'image')?.id;
  const audioTrackId = tracks.find(t => t.type === 'audio')?.id;

  const totalDuration = useMemo(() => {
    const all: Clip[] = tracks.flatMap(t => t.clips);
    return all.length ? Math.max(...all.map(c => c.start + c.duration)) : 0;
  }, [tracks]);

  // Filmstrip cache: clipId -> array of data URLs
  const [filmstrips, setFilmstrips] = useState<Record<string, string[]>>({});

  const ensureFilmstrip = useCallback(async (clip: Clip) => {
    if (!clip.src || filmstrips[clip.id]) return;
    if (clip.type === 'image') {
      // For images, just repeat same src
      setFilmstrips((m) => ({ ...m, [clip.id]: Array.from({ length: 6 }).map(() => clip.src as string) }));
      return;
    }
    if (clip.type !== 'video') return;
    try {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.preload = 'auto';
      v.src = clip.src!;
      await new Promise<void>((resolve, reject) => {
        const onMeta = () => { resolve(); cleanup(); };
        const onErr = () => { reject(new Error('metaerror')); cleanup(); };
        const cleanup = () => { v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('error', onErr); };
        v.addEventListener('loadedmetadata', onMeta, { once: true });
        v.addEventListener('error', onErr, { once: true });
        setTimeout(() => resolve(), 1200); // fallback
      });
      const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : Math.max(clip.duration, 3);
      const sampleCount = 6;
      const samples: string[] = [];
      const canvas = document.createElement('canvas');
      const targetH = 40; // small strip
      const scale = targetH / (v.videoHeight || 180);
      canvas.width = Math.max(1, Math.floor((v.videoWidth || 320) * scale));
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      const seekTo = async (t: number) => {
        return new Promise<void>((resolve) => {
          const onSeek = () => {
            try { ctx?.drawImage(v, 0, 0, canvas.width, canvas.height); samples.push(canvas.toDataURL('image/png')); } catch {}
            resolve();
          };
          v.currentTime = Math.max(0, Math.min(duration - 0.05, t));
          v.onseeked = onSeek;
        });
      };
      for (let i = 0; i < sampleCount; i++) {
        const t = (duration * i) / (sampleCount - 1);
        await seekTo(t);
      }
      setFilmstrips((m) => ({ ...m, [clip.id]: samples.length ? samples : [clip.src as string] }));
    } catch {
      // fallback to first frame single
      setFilmstrips((m) => ({ ...m, [clip.id]: clip.src ? [clip.src] : [] }));
    }
  }, [filmstrips]);

  // Generate filmstrips for new clips
  useEffect(() => {
    tracks.forEach((t) => t.clips.forEach((c) => { if (!filmstrips[c.id]) { ensureFilmstrip(c); } }));
  }, [tracks, ensureFilmstrip, filmstrips]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const url = URL.createObjectURL(f);
    const id = `clip-${Date.now()}`;
    const base: Omit<Clip, 'type'> = { id, src: url, start: totalDuration, duration: 3, label: f.name } as any;
    if (f.type.startsWith('video')) {
      addClip(videoTrackId, { ...base, type: 'video', muted: true, speed: 1 });
      setPreview({ type: 'video', url });
    } else if (f.type.startsWith('image')) {
      addClip(imageTrackId || videoTrackId, { ...base, type: 'image' });
      setPreview({ type: 'image', url });
    } else if (f.type.startsWith('audio')) {
      addClip(audioTrackId || videoTrackId, { ...base, type: 'audio' });
    }
  }, [addClip, audioTrackId, imageTrackId, totalDuration, videoTrackId]);

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-xs font-semibold text-gray-700">Timeline</div>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-xs rounded bg-gray-800 text-white">+</button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>
      <div className="px-4 pb-3 select-none">
        {/* Drop zone */}
        <div className="h-16 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500 mb-2"
             onDragOver={(e) => { e.preventDefault(); }}
             onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
             title="Drag and drop video/image/audio here">
          Drag and drop music, images, or video here
        </div>
        {/* Tracks */}
        <div className="space-y-2">
          {tracks.map((t) => (
            <div key={t.id} className="relative h-14 rounded border border-gray-200 bg-gray-100 overflow-hidden">
              {/* clips */}
              {t.clips.map((c) => {
                const leftPct = totalDuration ? (c.start / totalDuration) * 100 : 0;
                const widthPct = totalDuration ? (c.duration / totalDuration) * 100 : 0;
                const isSel = selected?.clipId === c.id && selected?.trackId === t.id;
                return (
                  <div key={c.id}
                       className={`absolute top-1 bottom-1 rounded border ${isSel ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'} shadow-sm cursor-pointer overflow-hidden`}
                       style={{ left: `${leftPct}%`, width: `${Math.max(1, widthPct)}%` }}
                       onClick={() => setSelected({ trackId: t.id, clipId: c.id })}
                  >
                    {/* filmstrip */}
                    <div className="absolute inset-0 flex">
                      {(filmstrips[c.id] || []).map((src, i) => (
                        <img key={i} src={src} className="h-full object-cover flex-1" alt="frame" />
                      ))}
                    </div>
                    <div className="absolute left-1 bottom-1 px-1 rounded bg-black/50 text-white text-[10px]">
                      {(c.duration || 0).toFixed(1)}s
                    </div>
                    {/* resize handle */}
                    <div className="absolute right-0 top-0 h-full w-1.5 bg-gray-300 cursor-col-resize"
                         onMouseDown={(e) => {
                           e.stopPropagation();
                           const rect = (e.currentTarget.parentElement?.parentElement as HTMLDivElement).getBoundingClientRect();
                           const startX = e.clientX;
                           const startDuration = c.duration;
                           const onMove = (ev: MouseEvent) => {
                             const dx = ev.clientX - startX;
                             const pxPerSec = rect.width / Math.max(1, totalDuration || 1);
                             const dt = dx / Math.max(1, pxPerSec);
                             resizeClip(t.id, c.id, Math.max(0.1, startDuration + dt));
                           };
                           const onUp = () => {
                             window.removeEventListener('mousemove', onMove);
                             window.removeEventListener('mouseup', onUp);
                           };
                           window.addEventListener('mousemove', onMove);
                           window.addEventListener('mouseup', onUp);
                         }}
                    />
                    {/* drag handle (whole clip) */}
                    <div className="absolute inset-0"
                         onMouseDown={(e) => {
                           const rect = (e.currentTarget.parentElement?.parentElement as HTMLDivElement).getBoundingClientRect();
                           const startX = e.clientX;
                           const startStart = c.start;
                           const onMove = (ev: MouseEvent) => {
                             const dx = ev.clientX - startX;
                             const pxPerSec = rect.width / Math.max(1, totalDuration || 1);
                             const dt = dx / Math.max(1, pxPerSec);
                             moveClip(t.id, c.id, Math.max(0, startStart + dt));
                           };
                           const onUp = () => {
                             window.removeEventListener('mousemove', onMove);
                             window.removeEventListener('mouseup', onUp);
                           };
                           window.addEventListener('mousemove', onMove);
                           window.addEventListener('mouseup', onUp);
                         }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <input type="range" className="w-full mt-3" min={0} max={Math.max(1, totalDuration)} step={0.01} value={playhead} onChange={(e) => setPlayhead(parseFloat(e.target.value))} />
      </div>
    </div>
  );
}

export default function EditorV2() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />
      <div className="flex flex-1">
        <CanvasStub />
      </div>
      <Timeline />
    </div>
  );
}


