import { useEditorStore } from "../store/useEditorStore";
import { useState } from "react";

export default function Timeline() {
  const pages = useEditorStore(s => s.pages);
  const active = useEditorStore(s => s.activePage);
  const setDuration = useEditorStore(s => s.setPageDuration);
  const load = useEditorStore(s => s.loadPage);
  const play = useEditorStore(s => s.playPreview);
  const stop = useEditorStore(s => s.stopPreview);
  const exporting = useEditorStore(s => s.exporting);
  const exportWebM = useEditorStore(s => s.exportWebM);
  const [fps, setFps] = useState(30);

  return (
    <div className="p-2 text-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-700">Timeline</div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-600">FPS</span>
          <input className="w-14 border rounded px-1 py-0.5 text-sm" type="number" min={10} max={60} value={fps} onChange={e=>setFps(parseInt(e.target.value||'30',10))}/>
          <button className="px-2 py-1 text-xs rounded bg-emerald-600 text-white" onClick={()=>play()}>Preview</button>
          <button className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-800" onClick={()=>stop()}>Stop</button>
          <button disabled={exporting} className="px-2 py-1 text-xs rounded bg-indigo-600 text-white disabled:opacity-60" onClick={()=>exportWebM({ fps })}>
            {exporting ? "Exporting..." : "Export Video (WebM)"}
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {pages.map((p,i)=>(
          <div key={p.id} className={`grid grid-cols-[1fr_90px] items-center gap-2 px-2 py-1 rounded ${i===active?'bg-indigo-50':'bg-gray-50'}`}>
            <button className="text-left text-sm text-gray-800" onClick={()=>load(i)}>{p.name}</button>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-gray-600">sec</span>
              <input type="number" min={1} max={30} className="w-16 border rounded px-1 py-0.5 text-sm" value={p.durationSec as any} onChange={e=>setDuration(i, Math.max(1, Math.min(30, parseInt(e.target.value||'5',10))))}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


