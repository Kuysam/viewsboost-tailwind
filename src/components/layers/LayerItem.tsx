import React from "react";

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  selected?: boolean;
};

type Props = {
  layer: Layer;
  onSelect: (id: string) => void;
  onToggleVis: (id: string) => void;
  onToggleLock: (id: string) => void;
  onContext: (id: string, x: number, y: number) => void;
};

export default function LayerItem({ layer, onSelect, onToggleVis, onToggleLock, onContext }: Props) {
  const { id, name, visible, locked, selected } = layer;

  const rowBase =
    "h-10 px-2 rounded-lg flex items-center justify-between cursor-pointer select-none";
  const rowState = selected ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-slate-50";

  return (
    <div
      role="button"
      aria-pressed={selected || undefined}
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
        if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          const target = e.currentTarget.getBoundingClientRect();
          onContext(id, target.left + target.width / 2, target.top + target.height);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(id, e.clientX, e.clientY);
      }}
      className={[rowBase, rowState].join(" ")}
    >
      <div className="truncate text-sm" title={name}>{name}</div>

      <div className="flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition">
        <button
          aria-label={visible ? "Hide layer" : "Show layer"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVis(id);
          }}
          className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
          title={visible ? "Hide" : "Show"}
        >
          {visible ? "👁️" : "🚫"}
        </button>

        <button
          aria-label={locked ? "Unlock layer" : "Lock layer"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(id);
          }}
          className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500"
          title={locked ? "Unlock" : "Lock"}
        >
          {locked ? "🔒" : "🔓"}
        </button>

        <div className="px-1 text-slate-400" aria-hidden title="Drag to reorder">⋮⋮</div>
      </div>
    </div>
  );
}
