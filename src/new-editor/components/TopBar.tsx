import { useEditorStore } from "../store/useEditorStore";
import { saveAs } from "file-saver";
import { listProjects, saveProject, loadProject, lastProjectName } from "../utils/persist";

export default function TopBar() {
  const exportPNG = useEditorStore(s => s.exportPNG);
  const exportJSON = useEditorStore(s => s.exportJSON);
  const savePage = useEditorStore(s => s.savePage);
  const pages = useEditorStore(s => s.pages);
  const importProject = useEditorStore(s => s.importProject);

  async function onSaveProject() {
    await savePage();
    const suggested = lastProjectName() || "My Project";
    const name = window.prompt("Save project as:", suggested);
    if (!name) return;
    saveProject(name, pages);
    window.alert("Saved ✓");
  }

  async function onOpenProject() {
    const names = listProjects();
    if (!names.length) { window.alert("No saved projects yet."); return; }
    const picked = window.prompt("Type a project name to open:\n" + names.join("\n"));
    if (!picked) return;
    const data = loadProject(picked);
    if (!data) { window.alert("Project not found."); return; }
    await importProject(data);
  }

  return (
    <div className="flex items-center justify-between p-2 border-b bg-white">
      <div className="font-semibold">ViewsBoost Editor v2</div>
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-gray-100 text-gray-800" onClick={onOpenProject}>Open</button>
        <button className="px-3 py-1 rounded bg-gray-100 text-gray-800" onClick={onSaveProject}>Save</button>
        <button className="px-3 py-1 rounded bg-gray-100 text-gray-800" onClick={async()=>{ const blob = await exportPNG(); if (blob) saveAs(blob, "design.png"); }}>Export PNG</button>
        <button className="px-3 py-1 rounded bg-gray-100 text-gray-800" onClick={()=>{ const json = exportJSON(); const blob=new Blob([JSON.stringify(json,null,2)],{type:"application/json"}); saveAs(blob,"design.json"); }}>Export JSON</button>
      </div>
    </div>
  );
}
