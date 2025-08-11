import { useStudio } from '../state/studioStore';
export default function StudioSidebar() {
  const { addLayer } = useStudio();
  return (
    <aside className="w-64 border-r bg-white p-3 space-y-3">
      <div className="font-semibold">Elements</div>
      <button className="btn" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'text', props: { text: 'Headline', left: 100, top: 100, fontSize: 48 } })}>Text</button>
      <button className="btn" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'rect', props: { left: 80, top: 80, width: 200, height: 120, fill: '#111827' } })}>Rectangle</button>
    </aside>
  );
}
