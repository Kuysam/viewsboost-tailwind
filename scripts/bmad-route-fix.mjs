import fs from "fs"; import path from "path";
const exts = [".tsx",".jsx",".ts",".js"];
const roots = ["src","app"];
const read = p=>fs.existsSync(p)?fs.readFileSync(p,"utf8"):null;
const write=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);console.log("✅ wrote",p);};
const list=(dir)=>fs.existsSync(dir)?fs.readdirSync(dir).flatMap(n=>{const p=path.join(dir,n);return fs.statSync(p).isDirectory()?list(p):[p];}):[];
const files = roots.flatMap(r=>list(r)).filter(f=>exts.some(e=>f.endsWith(e)));

function ensureStudioPage(){
  const p = "src/pages/studio/StudioPage.tsx";
  if (fs.existsSync(p)) return p;
  write(p,`import { useState } from "react";
import TopBar from "@/components/TopBar";
import { useStudio } from "@/state/studio";
import { CanvasHost } from "@/canvas/host";
import LiveRegion from "@/components/LiveRegion";
import CanvasToolbar from "@/components/CanvasToolbar";
import NewDesignModal from "@/components/NewDesignModal";
import ExportDialog from "@/components/ExportDialog";
import CommandPalette from "@/components/CommandPalette";
import CanvasSurface from "@/canvas/CanvasSurface";
export default function StudioPage(){
  const { dirty, zoom, setZoom, setSize } = useStudio();
  const [newOpen,setNewOpen]=useState(false); const [exportOpen,setExportOpen]=useState(false);
  return (<div className="min-h-screen flex flex-col">
    <TopBar dirty={dirty} onUndo={()=>CanvasHost.undo()} onRedo={()=>CanvasHost.redo()} onExport={()=>setExportOpen(true)} onNew={()=>setNewOpen(true)} />
    <LiveRegion />
    <NewDesignModal open={newOpen} onClose={()=>setNewOpen(false)} onCreate={(w,h)=>{ setSize(w,h); CanvasHost.newDesign(w,h); }} />
    <ExportDialog open={exportOpen} onClose={()=>setExportOpen(false)} onExport={(f,s,t)=>CanvasHost.export(f,s,t).then(()=>setExportOpen(false))} />
    <main className="flex-1 p-4 lg:p-6"><CanvasSurface /><div className="mt-3"><CanvasToolbar zoom={zoom} setZoom={setZoom} /></div></main>
  </div>);
}`);
  return p;
}

function patchProviders(){
  const mains = ["src/main.tsx","src/main.jsx"].filter(fs.existsSync);
  for (const f of mains){
    let s = read(f);
    if (!s) continue;
    if (!/from ['"]@\/state\/studio['"]/.test(s)) s=`import { StudioProvider } from "@/state/studio";\n`+s;
    if (!/from ['"]@\/lib\/toast['"]/.test(s))   s=`import { Toaster } from "@/lib/toast";\n`+s;
    if (/createRoot\([^)]*\)\.render\(/.test(s) && !/StudioProvider>/.test(s)){
      s = s.replace(/createRoot\([^)]*\)\.render\(\s*<React\.StrictMode>\s*([\s\S]*?)<\/React\.StrictMode>\s*\);?/m,
        (m, inner)=>m.replace(inner, `
    <StudioProvider>
      ${inner.trim()}
      <Toaster richColors />
    </StudioProvider>
`));
      write(f,s);
      return true;
    }
  }
  return false;
}

function patchRouters(){
  const routerFiles = files.filter(f=>{
    const s=read(f)??""; return /react-router-dom/.test(s) && (/<Routes>/.test(s)||/createBrowserRouter\(/.test(s));
  });
  if (routerFiles.length===0){ console.log("⚠️ no router file found. If you have a custom router, tell me its path."); return false; }

  for (const f of routerFiles){
    let s = read(f);
    let changed = false;

    // add StudioPage import
    if (!/from ['"]@\/pages\/studio\/StudioPage['"]/.test(s)){
      s = `import StudioPage from "@/pages/studio/StudioPage";\n`+s; changed = true;
    }

    // JSX <Routes> case
    if (/<\/Routes>/.test(s)){
      if (!/path=["']\/studio["']/.test(s)){
        s = s.replace(/<\/Routes>/, `  <Route path="/studio" element={<StudioPage />} />\n</Routes>`);
        changed = true;
      } else {
        // replace any existing element for /studio with our StudioPage
        s = s.replace(/<Route\s+path=["']\/studio["'][^>]*element=\{?<[^}]+>\}?[^/]*\/>/g, `<Route path="/studio" element={<StudioPage />} />`);
        changed = true;
      }
    }

    // createBrowserRouter case
    if (/createBrowserRouter\(/.test(s)){
      if (/path:\s*["']\/studio["']/.test(s)){
        s = s.replace(/path:\s*["']\/studio["'][\s\S]*?element:\s*<[^>]+>/, (m)=>m.replace(/element:\s*<[^>]+>/, `element: <StudioPage />`));
        changed = true;
      } else {
        s = s.replace(/createBrowserRouter\(\s*\[/, `createBrowserRouter([\n  { path: "/studio", element: <StudioPage /> },`);
        changed = true;
      }
    }

    if (changed){ write(f,s); return true; }
  }
  return false;
}

function run(){
  const page = ensureStudioPage();
  const prov = patchProviders();
  const routed = patchRouters();
  console.log("\nSummary:", {page, providersPatched: prov, routerPatched: routed});
  console.log("Next: restart dev server to flush HMR cache.");
}
run();
