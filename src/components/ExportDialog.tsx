import { useEffect, useState } from "react";
import type { ExportFormat } from "@/canvas/host";

export default function ExportDialog({
  open,
  onClose,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (fmt: ExportFormat, scale: number, transparent: boolean) => void;
}) {
  const [fmt, setFmt] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Only PNG supports transparency here
  useEffect(() => {
    if (fmt !== "png" && transparent) setTransparent(false);
  }, [fmt, transparent]);

  if (!open) return null;

  const Btn: React.FC<{v: ExportFormat; children: React.ReactNode}> = ({ v, children }) => (
    <button
      onClick={() => setFmt(v)}
      className={`h-10 rounded-xl border px-3 ${fmt===v ? "border-indigo-500 bg-indigo-50" : "hover:bg-slate-50"} focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500`}
    >{children}</button>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onMouseDown={(e)=>{ if (e.target===e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal className="w-[560px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold">Export</h2>
          <button aria-label="Close" onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Btn v="png">PNG</Btn>
          <Btn v="jpg">JPG</Btn>
          <Btn v="pdf">PDF</Btn>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm">Scale</label>
          <input type="range" min={1} max={4} value={scale} onChange={(e)=>setScale(+e.target.value)} />
          <span className="text-sm w-8 text-center">{scale}×</span>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e)=>setTransparent(e.target.checked)}
            disabled={fmt!=="png"}
          />
          Transparent background (PNG only)
        </label>

        {fmt==="pdf" && (
          <p className="mt-2 text-[11px] text-slate-500">
            PDF exports a single page sized to your canvas.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-xl border">Cancel</button>
          <button
            onClick={()=>onExport(fmt, scale, transparent)}
            className="h-10 px-4 rounded-xl bg-indigo-600 text-white focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
