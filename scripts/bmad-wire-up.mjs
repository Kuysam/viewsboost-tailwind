import fs from "fs"; import path from "path";

const log = (...a)=>console.log(...a);
const read = (p)=> fs.existsSync(p) ? fs.readFileSync(p,"utf8") : null;
const write = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); log("✅ wrote",p); };

function findFile(cands){
  for (const f of cands) if (fs.existsSync(f)) return f;
  return null;
}

function ensureProviders(){
  const main = findFile(["src/main.tsx","src/main.jsx"]);
  if (!main) return log("⚠️  main.tsx not found—skip provider patch");
  let src = read(main);

  if (!/from\s+["']@\/state\/studio["']/.test(src)) src = `import { StudioProvider } from "@/state/studio";\n`+src;
  if (!/from\s+["']@\/lib\/toast["']/.test(src))   src = `import { Toaster } from "@/lib/toast";\n`+src;

  if (/createRoot\([^)]*\)\.render\(/.test(src) && !/StudioProvider>/.test(src)){
    src = src.replace(
      /createRoot\([^)]*\)\.render\(\s*<React\.StrictMode>\s*([\s\S]*?)<\/React\.StrictMode>\s*\);?/m,
      (m, inner)=>{
        if (/StudioProvider>/.test(inner)) return m;
        const wrapped = `
  <React.StrictMode>
    <StudioProvider>
      ${inner.trim()}
      <Toaster richColors />
    </StudioProvider>
  </React.StrictMode>`.trim();
        return m.replace(inner, wrapped);
      }
    );
    write(main, src);
  } else {
    log("ℹ️  Providers already present or non-standard entry—skipped");
  }
}

function ensureAlias(){
  const vite = findFile(["vite.config.ts","vite.config.js"]);
  if (!vite) return;
  let vsrc = read(vite);
  if (!/@\/\*/.test(vsrc)){
    // ensure tsconfig too
    const tsf = findFile(["tsconfig.json","tsconfig.app.json"]) || "tsconfig.json";
    let ts = read(tsf) || `{"compilerOptions":{}}`;
    try {
      const j = JSON.parse(ts);
      j.compilerOptions ||= {};
      j.compilerOptions.baseUrl = ".";
      j.compilerOptions.paths = j.compilerOptions.paths || { "@/*": ["src/*"] };
      write(tsf, JSON.stringify(j,null,2));
    } catch {}
  }
}

function ensureNetlify(){
  const nf = "netlify.toml";
  if (fs.existsSync(nf)) return;
  write(nf, `[[redirects]]
from="/*"
to="/index.html"
status=200
`);
}

function ensureStudioPage(){
  const page = "src/pages/studio/StudioPage.tsx";
  if (fs.existsSync(page)) return page;
  write(page, `import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/TopBar";
import { useStudio } from "@/state/studio";
import { CanvasHost, type ExportFormat } from "@/canvas/host";
import NewDesignModal from "@/components/NewDesignModal";
import TemplateGrid, { TemplateItem } from "@/components/TemplateGrid";
import LiveRegion from "@/components/LiveRegion";
import CanvasToolbar from "@/components/CanvasToolbar";
import { announce } from "@/lib/a11y";
import LayersPanel from "@/components/layers/LayersPanel";
import type { Layer } from "@/components/layers/LayerItem";
import ExportDialog from "@/components/ExportDialog";
import { downloadBlob } from "@/lib/download";
import { toast } from "@/lib/toast";
import CommandPalette, { type Cmd } from "@/components/CommandPalette";
import UploadsPanel from "@/components/UploadsPanel";
import MobileDock from "@/components/MobileDock";
import { usePersistentState } from "@/hooks/usePersistentState";
import CanvasSurface from "@/canvas/CanvasSurface";

export default function StudioPage() {
  const { dirty, setSize, canvasSize, zoom, setZoom } = useStudio();
  const [newOpen, setNewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showGrid, setShowGrid] = usePersistentState<boolean>("studio.showGrid", false);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);

  useEffect(() => {
    const onLayers = (e: Event) => setLayers((e as CustomEvent<Layer[]>).detail);
    document.addEventListener("studio-layers", onLayers as EventListener);
    return () => document.removeEventListener("studio-layers", onLayers as EventListener);
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const demo: TemplateItem[] = Array.from({ length: 12 }).map((_, i) => ({
        id: String(i+1),
        name: ["Story Poster","Bold Title","Gradient Reel","Clean Promo"][i%4]+" "+(i+1),
        thumb: \`https://picsum.photos/seed/viewsboost-\${i}/540/960\`,
      }));
      setItems(demo); setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const selectedId = useMemo(()=> layers.find(l=>l.selected)?.id ?? null, [layers]);
  const defaultName = useMemo(()=> {
    const d = new Date();
    const date = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
    const size = canvasSize ? \`\${canvasSize.w}x\${canvasSize.h}\` : "design";
    return \`viewsboost-\${size}-\${date}\`;
  }, [canvasSize]);

  async function doExport(fmt: ExportFormat, scale: number, transparent: boolean) {
    try {
      toast.loading("Exporting…",{id:"export"});
      const blob = await CanvasHost.export(fmt, scale, transparent);
      const filename = \`\${defaultName}.\${fmt}\`;
      downloadBlob(blob, filename);
      toast.success("Export complete",{id:"export"}); announce(\`Exported \${filename}\`);
    } catch(e){ console.error(e); toast.error("Export failed",{id:"export"}); announce("Export failed"); }
    finally{ setExportOpen(false); }
  }

  const commands: Cmd[] = useMemo(()=>[
    { id:"new", title:"New design", hint:"⌘N", run:()=>setNewOpen(true) },
    { id:"export", title:"Export…", hint:"⌘E", run:()=>setExportOpen(true) },
    { id:"dup", title:"Duplicate selected layer", disabled:!selectedId, run:()=>selectedId && CanvasHost.duplicate(selectedId) },
  ],[selectedId]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar dirty={dirty} onUndo={()=>CanvasHost.undo()} onRedo={()=>CanvasHost.redo()} onExport={()=>setExportOpen(true)} onNew={()=>setNewOpen(true)} />
      <LiveRegion />
      <CommandPalette commands={commands} />
      <NewDesignModal open={newOpen} onClose={()=>setNewOpen(false)} onCreate={(w,h)=>{ setSize(w,h); CanvasHost.newDesign(w,h); announce(\`Canvas set to \${w}×\${h}\`); }} />
      <ExportDialog open={exportOpen} onClose={()=>setExportOpen(false)} onExport={doExport} />
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9 space-y-4">
            <CanvasSurface />
            <CanvasToolbar zoom={zoom} setZoom={setZoom} />
            <section id="templates-section">
              <div className="mb-3"><h3 className="text-lg font-semibold">Templates</h3><p className="text-sm text-slate-500">Pick a starting point.</p></div>
              <TemplateGrid items={items} loading={loading} onSelect={(t)=>{ setSize(1080,1920); CanvasHost.newDesign(1080,1920); announce(\`Opened template: \${t.name}\`); }} />
            </section>
            <UploadsPanel />
          </div>
          <div id="layers-section" className="lg:col-span-3">
            <LayersPanel layers={layers}
              onSelect={(id)=>CanvasHost.selectLayer(id)}
              onToggleVis={(id)=>CanvasHost.setLayerVisibility(id, !(layers.find(l=>l.id===id)?.visible))}
              onToggleLock={(id)=>CanvasHost.setLayerLocked(id, !(layers.find(l=>l.id===id)?.locked))}
              onAction={(id,a)=>{ if(a==="duplicate")CanvasHost.duplicate(id); if(a==="bringToFront")CanvasHost.bringToFront(id); if(a==="delete")CanvasHost.delete(id); if(a==="group")CanvasHost.groupSelection(); }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
`);
  return page;
}

function ensureRoute(){
  const app = findFile(["src/App.tsx","src/App.jsx"]);
  if (!app) return log("⚠️  Could not find src/App to patch routes. If you use another router file, add /studio manually.");
  let src = read(app);
  if (!/from\s+["']react-router-dom["']/.test(src)) {
    log("⚠️  App.tsx doesn't look like React Router. If you're using a different router, wire /studio manually.");
    return;
  }
  if (!/from\s+["']@\/pages\/studio\/StudioPage["']/.test(src)) {
    src = `import StudioPage from "@/pages/studio/StudioPage";\n` + src;
  }
  if (/<\/Routes>/.test(src) && !/path=["']\/studio["']/.test(src)) {
    src = src.replace(/<\/Routes>/, `  <Route path="/studio" element={<StudioPage />} />\n</Routes>`);
    write(app, src);
  } else if (/path=["']\/studio["']/.test(src)) {
    log("ℹ️  /studio route already present.");
  } else {
    log("⚠️  Could not locate <Routes> in App.tsx. Please add route manually.");
  }
}

function run(){
  ensureAlias();
  ensureNetlify();
  ensureProviders();
  const page = ensureStudioPage();
  ensureRoute();
  log("\n🔎 Wire-up complete. If you still don't see the UI, run:");
  log("   npm run dev   → open /studio");
  log("   or build & deploy to Netlify");
}
run();
