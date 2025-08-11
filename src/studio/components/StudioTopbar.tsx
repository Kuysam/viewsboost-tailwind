import { useStudio } from '../state/studioStore';
import { useExport } from '../hooks/useExport';

export default function StudioTopbar() {
  const { doc, ui } = useStudio();
  const { exportImage } = useExport();

  const download = (fmt: 'png'|'jpeg', scale: 1|2, transparent=false) => {
    const url = exportImage(fmt, scale, { transparent });
    const a = document.createElement('a');
    a.href = url; a.download = `${doc?.title || 'design'}.${fmt}`;
    a.click();
  };

  return (
    <div className="h-12 px-3 border-b bg-white flex items-center gap-2">
      <div className="font-medium">{doc?.title || 'Untitled'}</div>
      <div className="text-xs text-neutral-500">{ui.saving ? 'Saving…' : ui.dirty ? 'Edited' : 'Saved'}</div>
      <div className="ml-auto flex gap-2">
        <button className="btn" onClick={() => download('png', 1)}>Export PNG</button>
        <button className="btn" onClick={() => download('png', 1, true)}>PNG (transparent)</button>
        <button className="btn" onClick={() => download('jpeg', 2)}>Export 2× JPEG</button>
      </div>
    </div>
  );
}
