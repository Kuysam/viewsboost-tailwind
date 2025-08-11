import { useEffect, useMemo, useRef, useState } from "react";
import { CANVAS_PRESETS } from "@/constants/canvasPresets";

export default function NewDesignModal({
  open, onClose, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (w: number, h: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState({ w: 1080, h: 1920 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canCreate = useMemo(() => {
    const { w, h } = custom;
    return Number.isFinite(w) && Number.isFinite(h) && w >= 16 && h >= 16 && w <= 8192 && h <= 8192;
  }, [custom]);

  if (!open) return null;

  const handleCreate = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      onCreate(w, h);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      aria-hidden={!open}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-design-title"
        className="w-[560px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 id="new-design-title" className="text-xl font-semibold">New design</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
          >✕</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 motion-safe:animate-in motion-safe:fade-in">
          {CANVAS_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => p.w ? handleCreate(p.w, p.h) : null}
              className="relative aspect-[9/12] rounded-xl border hover:border-indigo-400 hover:shadow-sm p-3 text-left focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
            >
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {p.w ? `${p.w}×${p.h}` : "Pick custom size below"}
              </div>
              {p.w === 1080 && p.h === 1920 && (
                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white">Popular</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-end gap-2">
          <div className="grow">
            <label className="block text-xs text-slate-500 mb-1">Custom size</label>
            <div className="flex gap-2">
              <input
                type="number" inputMode="numeric" min={16} max={8192}
                value={custom.w} onChange={(e)=>setCustom(s=>({...s,w:Math.max(16, Math.min(8192, +e.target.value||0))}))}
                className="w-full rounded-xl border px-3 h-10 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
                placeholder="Width"
              />
              <input
                type="number" inputMode="numeric" min={16} max={8192}
                value={custom.h} onChange={(e)=>setCustom(s=>({...s,h:Math.max(16, Math.min(8192, +e.target.value||0))}))}
                className="w-full rounded-xl border px-3 h-10 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
                placeholder="Height"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Allowed range: 16–8192 px.</p>
          </div>
          <button
            onClick={()=>{ if (canCreate) { handleCreate(custom.w, custom.h); } }}
            disabled={!canCreate}
            className="h-10 px-4 rounded-xl bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
          >Create</button>
          <button onClick={onClose} className="h-10 px-4 rounded-xl border">Cancel</button>
        </div>
      </div>
    </div>
  );
}
