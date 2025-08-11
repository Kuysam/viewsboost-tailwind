import React, { useEffect } from "react";
import LayerItem, { Layer } from "./LayerItem";

export type LayerAction = "group" | "duplicate" | "bringToFront" | "delete";

type Props = {
  layers: Layer[];
  onSelect: (id: string) => void;
  onToggleVis: (id: string) => void;
  onToggleLock: (id: string) => void;
  onAction: (id: string, action: LayerAction) => void;
};

export default function LayersPanel({ layers, onSelect, onToggleVis, onToggleLock, onAction }: Props) {
  const [ctx, setCtx] = React.useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const close = () => setCtx(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  return (
    <aside className="w-full lg:w-72 xl:w-80 rounded-2xl border bg-white/70 backdrop-blur p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Layers</h4>
        <span className="text-xs text-slate-500">{layers.length}</span>
      </div>
      <div className="space-y-1">
        {layers.length === 0 && (
          <div className="text-sm text-slate-500 p-3 rounded-lg bg-slate-50">
            No layers yet — add text, images or shapes.
          </div>
        )}
        {layers.map((l) => (
          <LayerItem
            key={l.id}
            layer={l}
            onSelect={onSelect}
            onToggleVis={onToggleVis}
            onToggleLock={onToggleLock}
            onContext={(id, x, y) => setCtx({ id, x, y })}
          />
        ))}
      </div>

      {/* Context menu */}
      {ctx && (
        <div
          role="menu"
          className="fixed z-[60] min-w-40 rounded-xl border bg-white shadow-lg p-1"
          style={{ left: ctx.x, top: ctx.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            onClick={() => { onAction(ctx.id, "group"); setCtx(null); }}>
            Group
          </button>
          <button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            onClick={() => { onAction(ctx.id, "duplicate"); setCtx(null); }}>
            Duplicate
          </button>
          <button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100"
            onClick={() => { onAction(ctx.id, "bringToFront"); setCtx(null); }}>
            Bring to front
          </button>
          <div className="my-1 h-px bg-slate-200" />
          <button role="menuitem" className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
            onClick={() => { onAction(ctx.id, "delete"); setCtx(null); }}>
            Delete
          </button>
        </div>
      )}
    </aside>
  );
}
