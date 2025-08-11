import AutosaveStatus from "@/components/AutosaveStatus";
import { useHotkeys } from "@/hooks/useHotkeys";
import { toast } from "@/lib/toast";

export default function TopBar({
  onUndo, onRedo, onNew, onExport, dirty,
}: {
  onUndo: () => void; onRedo: () => void; onNew: () => void; onExport: () => void; dirty: boolean;
}) {
  useHotkeys({
    "mod+z": (e) => { e.preventDefault(); onUndo(); },
    "mod+shift+z": (e) => { e.preventDefault(); onRedo(); },
    "mod+n": (e) => { e.preventDefault(); onNew(); },
    "mod+k": (e) => { e.preventDefault(); document.dispatchEvent(new Event("open-cmdk")); },
    "/": (e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    },
    "?": () => toast("Pro tip: ⌘/Ctrl+K opens the command palette"),
  });

  const btn = "h-9 px-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-500";
  const icon = "h-9 w-9 grid place-items-center rounded-xl hover:bg-slate-100 "+btn;

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b bg-white/70 backdrop-blur">
      <div className="flex items-center gap-2" role="toolbar" aria-label="Canvas actions">
        <button aria-label="Undo" onClick={onUndo} className={icon}>↶</button>
        <button aria-label="Redo" onClick={onRedo} className={icon}>↷</button>
      </div>
      <AutosaveStatus dirty={dirty} />
      <div className="flex items-center gap-2">
        <button onClick={onExport} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>Export</button>
        <button onClick={onNew} className={`${btn} bg-slate-900 text-white hover:bg-slate-800`}>New design</button>
      </div>
    </header>
  );
}
