✅ Patch 1 — stop stage from causing “teleport”

File: src/new-editor/pages/Editor2.tsx
Find (Stage props block):

draggable={!isSelecting}


Replace with:

// only allow panning when nothing is selected (prevents “teleport-like” feeling)
draggable={!isSelecting && selectedIds.length === 0}


✅ Patch 2 — fix all spread typos that break state

File: src/new-editor/pages/Editor2.tsx
Do these search→replace edits (they appear multiple times):

return [.prev, r]; → return [...prev, r]; 

return [.prev, c]; → return [...prev, c]; 

return [.prev, txt]; → return [...prev, txt]; 

commit(prev => [.prev, el]); → commit(prev => [...prev, el]); (APITemplate add) 

const copy = [.prev]; → const copy = [...prev]; (Layers reorder) 

Also fix this JSX spread typo in the Text block:

{.common} → {...common} 

These tiny typos were likely causing the weird selection/group behavior and random jumps because React state updates were failing silently or returning wrong shapes.

✅ Patch 3 — shrink presets to 4 (until catalog)

File: src/new-editor/pages/Editor2.tsx
Find (starts at “Presets (50)” header and the whole IIFE below it):

<div className="font-semibold text-sm opacity-80 mt-6">Presets (50)</div>
{(() => {
  const palette = [ ... ];
  // builds 50 templates
  ...
})()}


Replace that entire block with:

<div className="font-semibold text-sm opacity-80 mt-6">Presets (4)</div>
{(() => {
  type Preset = { kind: "rect"|"circle"|"text"; label: string; fill?: string; width?: number; height?: number; cornerRadius?: number; text?: string; fontSize?: number; };
  const templates: Preset[] = [
    { kind: "rect",   label: "Card",   fill: "#10b981", width: 320, height: 180, cornerRadius: 24 },
    { kind: "circle", label: "Circle", fill: "#3b82f6", width: 160, height: 160 },
    { kind: "rect",   label: "Badge",  fill: "#f59e0b", width: 200, height: 60,  cornerRadius: 999 },
    { kind: "text",   label: "Text",   fill: "#111827", text: "Your text", fontSize: 36, width: 300, height: 60 },
  ];
  const addPreset = (t: Preset) => {
    commit(prev => {
      if (t.kind === "rect") {
        const r = makeRect();
        (r as any).fill = t.fill ?? (r as any).fill;
        if (t.cornerRadius !== undefined) (r as any).cornerRadius = t.cornerRadius;
        if (t.width) r.width = t.width; if (t.height) r.height = t.height;
        return [...prev, r];
      }
      if (t.kind === "circle") {
        const c = makeCircle();
        (c as any).fill = t.fill ?? (c as any).fill;
        if (t.width) c.width = t.width; if (t.height) c.height = t.height;
        return [...prev, c];
      }
      if (t.kind === "text") {
        const txt = makeText(t.text || "Text");
        (txt as any).fill = t.fill ?? (txt as any).fill;
        if (t.fontSize) (txt as any).fontSize = t.fontSize;
        if (t.width) txt.width = t.width; if (t.height) txt.height = t.height;
        return [...prev, txt];
      }
      return prev;
    });
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {templates.map((t, idx) => (
        <button key={idx} onClick={() => addPreset(t)} className="rounded-md border border-white/10 px-2 py-2 hover:bg-white/5 text-left text-xs" title={t.label}>
          {t.label}
        </button>
      ))}
    </div>
  );
})()}


✅ Patch 4 — fix elements render for Circle + Text (no disappear, proper scaling)

File: src/new-editor/pages/Editor2.tsx
Locate: inside the big {elements.map((el) => { ... })} render block. Replace only the Circle and Text branches with the snippets below.

Circle (replace the whole circle branch):

// ---- Circle (render as rounded-rect for stable scaling) ----
if (el.kind === "circle") {
  const c = el as CircleEl;
  const rr = Math.max(1, Math.floor(Math.min(el.width, el.height) / 2));
  return (
    <Rect
      key={el.id}
      {...common}
      width={el.width}
      height={el.height}
      fill={c.fill}
      cornerRadius={rr}
    />
  );
}


Text (replace the whole text branch):

// ---- Text (centered + proportional scaling on transform) ----
if (el.kind === "text") {
  const t = el as TextEl;
  return (
    <KText
      key={el.id}
      {...common}
      width={Math.max(10, t.width)}
      height={Math.max(10, t.height)}
      text={t.text}
      fontSize={t.fontSize}
      fill={t.fill}
      align={t.align}                  // 'left' | 'center' | 'right'
      verticalAlign={"middle" as any}  // keep visually centered in box
      listening={true}
      onTransformEnd={(evt: any) => {
        const node = evt.target as Konva.Text;
        const sx = Math.abs(node.scaleX());
        const sy = Math.abs(node.scaleY());
        const avg = (sx + sy) / 2;

        const nextW = Math.max(10, node.width() * sx);
        const nextH = Math.max(10, node.height() * sy);
        const nextFont = Math.max(6, (t.fontSize || 16) * avg);

        node.scaleX(1);
        node.scaleY(1);

        updateEl(el.id, {
          x: node.x(),
          y: node.y(),
          width: nextW,
          height: nextH,
          rotation: node.rotation(),
          ...( { fontSize: nextFont } as any ),
        } as any);
      }}
    />
  );
}


This keeps text centered in its selection box and scales font size proportionally when you drag anchors.

✅ Patch 5 — (optional) small selection polish

File: src/new-editor/pages/Editor2.tsx
Find (Stage props):

width={canvasW * scale}
height={canvasH * scale}


Change to (optional but cleaner math):

// let Konva handle transform math; stage DOM stays at canvas size
width={canvasW}
height={canvasH}


You already invert transforms correctly for marquee; this just avoids double mental math while debugging. Leave as-is if you prefer.