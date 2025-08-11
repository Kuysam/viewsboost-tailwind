import { useEffect, useMemo, useRef, useState } from "react";

export type Cmd = {
  id: string;
  title: string;
  hint?: string;
  disabled?: boolean;
  run: () => void;
};

export default function CommandPalette({ commands }: { commands: Cmd[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Open via custom event (TopBar dispatches "open-cmdk")
  useEffect(() => {
    const onOpen = () => { setOpen(true); setTimeout(()=>inputRef.current?.focus(), 0); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("open-cmdk", onOpen);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("open-cmdk", onOpen); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => { if (!open) { setQ(""); setIdx(0); } }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const pool = commands;
    if (!query) return pool;
    // simple fuzzy-ish includes on words
    return pool
      .map(c => ({ c, score: score(c.title.toLowerCase(), query) }))
      .filter(x => x.score > -Infinity)
      .sort((a,b)=>b.score - a.score)
      .map(x => x.c);
  }, [q, commands]);

  useEffect(() => { if (idx >= results.length) setIdx(results.length - 1); }, [results.length, idx]);

  const runActive = () => {
    const item = results[idx];
    if (item && !item.disabled) { item.run(); setOpen(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40" onMouseDown={(e)=>{ if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="mx-auto pt-24 max-w-[680px] px-3">
        <div className="rounded-2xl bg-white shadow-2xl border p-2">
          <input
            ref={inputRef}
            value={q}
            onChange={(e)=>{ setQ(e.target.value); setIdx(0); }}
            placeholder="Type a command…"
            className="w-full h-12 px-4 rounded-xl outline-none border"
            onKeyDown={(e)=>{
              if (e.key === "Enter") { e.preventDefault(); runActive(); }
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i=>Math.min(i+1, results.length-1)); scrollIntoView(idx+1); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i=>Math.max(i-1, 0)); scrollIntoView(idx-1); }
            }}
          />
          <div ref={listRef} className="max-h-80 overflow-auto mt-2 divide-y">
            {results.length === 0 && (
              <div className="px-4 py-6 text-sm text-slate-500">No commands match “{q}”.</div>
            )}
            {results.map((cmd, i)=>(
              <button
                key={cmd.id}
                disabled={cmd.disabled}
                onClick={()=>{ if (!cmd.disabled){ cmd.run(); setOpen(false); } }}
                className={`w-full text-left px-4 py-3 flex justify-between items-center
                  ${i===idx ? "bg-indigo-50" : "hover:bg-slate-50"}
                  ${cmd.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onMouseEnter={()=>setIdx(i)}
              >
                <span className="truncate">{cmd.title}</span>
                {cmd.hint && <kbd className="text-xs text-slate-500">{cmd.hint}</kbd>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  function scrollIntoView(nextIndex: number) {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[nextIndex] as HTMLElement | undefined;
    if (!item) return;
    const { top, bottom } = item.getBoundingClientRect();
    const { top: lTop, bottom: lBottom } = list.getBoundingClientRect();
    if (top < lTop) item.scrollIntoView({ block: "nearest" });
    if (bottom > lBottom) item.scrollIntoView({ block: "nearest" });
  }
}

// very small fuzzy scoring (prefix > word-contains > anywhere)
function score(text: string, q: string): number {
  if (text.startsWith(q)) return 3;
  if (text.split(/\s+/).some(w => w.startsWith(q))) return 2;
  if (text.includes(q)) return 1;
  return 0;
}
