import { useEffect, useMemo, useState } from "react";
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

export default function StudioPage() {
  const { dirty, setSize, canvasSize } = useStudio() as any;
  const [newOpen, setNewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Demo data for templates (replace with your real fetch)
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TemplateItem[]>([]);

  // Mock layers state for UI plumbing (replace with your canvas wiring)
  const [layers, setLayers] = useState<Layer[]>([
    { id: "1", name: "Background", visible: true,  locked: true,  selected: false },
    { id: "2", name: "Main Image", visible: true,  locked: false, selected: true },
    { id: "3", name: "Headline",   visible: true,  locked: false, selected: false },
  ]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const demo: TemplateItem[] = Array.from({ length: 12 }).map((_, i) => ({
        id: String(i + 1),
        name: ["Story Poster", "Bold Title", "Gradient Reel", "Clean Promo"][i % 4] + " " + (i + 1),
        thumb: \`https://picsum.photos/seed/viewsboost-\${i}/540/960\`,
      }));
      setItems(demo);
      setLoading(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  const select = (id: string) => {
    setLayers((ls) => ls.map((l) => ({ ...l, selected: l.id === id })));
    const name = layers.find((l)=>l.id===id)?.name ?? id;
    announce(\`Selected layer \${name}\`);
  };

  const toggleVis = (id: string) => {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
    announce("Toggled visibility");
  };

  const toggleLock = (id: string) => {
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
    announce("Toggled lock");
  };

  const onAction = (id: string, action: "group" | "duplicate" | "bringToFront" | "delete") => {
    setLayers((ls) => {
      const idx = ls.findIndex((l) => l.id === id);
      if (idx === -1) return ls;

      if (action === "duplicate") {
        const src = ls[idx];
        const clone: Layer = { ...src, id: String(Date.now()), name: src.name + " copy", selected: true, locked: false };
        announce(\`Duplicated \${src.name}\`);
        return ls.map((l) => ({ ...l, selected: false })).toSpliced(idx + 1, 0, clone);
      }

      if (action === "bringToFront") {
        const moved = ls[idx];
        const rest = ls.toSpliced(idx, 1);
        announce(\`Brought \${moved.name} to front\`);
        return [...rest, { ...moved, selected: true }];
      }

      if (action === "delete") {
        const name = ls[idx].name;
        const rest = ls.toSpliced(idx, 1);
        announce(\`Deleted \${name}\`);
        return rest;
      }

      if (action === "group") {
        announce("Grouped selection");
        return ls;
      }
      return ls;
    });
  };

  const selectedId = useMemo(()=> layers.find(l=>l.selected)?.id ?? null, [layers]);

  const defaultName = useMemo(() => {
    const d = new Date();
    const date = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
    const size = canvasSize ? \`\${canvasSize.w}x\${canvasSize.h}\` : "design";
    return \`viewsboost-\${size}-\${date}\`;
  }, [canvasSize]);

  async function doExport(fmt: ExportFormat, scale: number, transparent: boolean) {
    try {
      toast.loading("Exporting…", { id: "export" });
      const blob = await CanvasHost.export(fmt, scale, transparent);
      const filename = \`\${defaultName}.\${fmt}\`;
      downloadBlob(blob, filename);
      toast.success("Export complete", { id: "export" });
      announce(\`Exported \${filename}\`);
    } catch (e) {
      console.error(e);
      toast.error("Export failed", { id: "export" });
      announce("Export failed");
    } finally {
      setExportOpen(false);
    }
  }

  // Commands for the palette
  const commands: Cmd[] = useMemo(() => ([
    { id: "new",       title: "New design",           hint: "⌘N", run: () => setNewOpen(true) },
    { id: "export",    title: "Export…",              hint: "⌘E", run: () => setExportOpen(true) },
    { id: "dup",       title: "Duplicate selected layer", disabled: !selectedId, run: () => { if (selectedId) onAction(selectedId, "duplicate"); } },
    { id: "front",     title: "Bring selected to front", disabled: !selectedId, run: () => { if (selectedId) onAction(selectedId, "bringToFront"); } },
    { id: "delete",    title: "Delete selected layer",  disabled: !selectedId, run: () => { if (selectedId) onAction(selectedId, "delete"); } },
    { id: "group",     title: "Group selection",        run: () => onAction(selectedId ?? "", "group") },
    { id: "align-c",   title: "Align center",           run: () => announce("Aligned center") },
    { id: "togglegrid",title: (showGrid ? "Hide" : "Show") + " grid", run: () => setShowGrid(v=>!v) },
    { id: "templates", title: "Browse templates",       run: () => document.getElementById("templates-section")?.scrollIntoView({ behavior: "smooth" }) },
  ]), [selectedId, showGrid]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        dirty={dirty}
        onUndo={()=>CanvasHost.undo()}
        onRedo={()=>CanvasHost.redo()}
        onExport={()=>setExportOpen(true)}
        onNew={()=>setNewOpen(true)}
      />

      <LiveRegion />

      {/* Command palette mounted once; opens on ⌘/Ctrl+K */}
      <CommandPalette commands={commands} />

      <NewDesignModal
        open={newOpen}
        onClose={()=>setNewOpen(false)}
        onCreate={(w,h)=>{ setSize(w,h); CanvasHost.newDesign(w,h); announce(\`Canvas set to \${w}×\${h}\`); }}
      />

      <ExportDialog
        open={exportOpen}
        onClose={()=>setExportOpen(false)}
        onExport={doExport}
      />

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: toolbar + templates */}
          <div className="lg:col-span-9 space-y-4">
            <CanvasToolbar />
            <section id="templates-section">
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Templates</h3>
                  <p className="text-sm text-slate-500">Pick a starting point—sizes apply automatically.</p>
                </div>
              </div>
              <TemplateGrid
                items={items}
                loading={loading}
                onSelect={(t)=>{
                  setSize(1080, 1920);
                  CanvasHost.newDesign(1080, 1920);
                  announce(\`Opened template: \${t.name}\`);
                }}
              />
            </section>
          </div>

          {/* Right: layers panel */}
          <div className="lg:col-span-3">
            <LayersPanel
              layers={layers}
              onSelect={(id)=>select(id)}
              onToggleVis={(id)=>toggleVis(id)}
              onToggleLock={(id)=>toggleLock(id)}
              onAction={(id,action)=>onAction(id,action)}
            />
          </div>
        </div>

        {/* Optional visual grid overlay toggle */}
        {showGrid && (
          <div className="pointer-events-none fixed inset-0 z-[60] bg-[linear-gradient(to_right,rgba(0,0,0,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.06)_1px,transparent_1px)] bg-[length:16px_16px]" />
        )}
      </main>
    </div>
  );
}
