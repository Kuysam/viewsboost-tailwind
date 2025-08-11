import { useEffect, useState } from 'react';
import { searchTemplates } from '../services/templates';
import { useNavigate } from 'react-router-dom';
const QUICK = [{ label:'1080×1920', w:1080, h:1920 },{ label:'1080×1080', w:1080, h:1080 },{ label:'1280×720', w:1280, h:720 }];
export default function StudioHome() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [q, setQ] = useState(''); const nav = useNavigate();
  useEffect(() => { searchTemplates(q).then(setTemplates); }, [q]);
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Studio</h1>
      <div className="mb-6 flex gap-2">
        {QUICK.map(s => <button key={s.label} className="btn" onClick={() => nav(`/studio/new?size=${s.w}x${s.h}`)}>{s.label}</button>)}
        <input className="input ml-auto" placeholder="Search templates…" value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {templates.map(t => (
          <div key={t.id} className="border rounded p-2 cursor-pointer" onClick={() => nav(`/studio/new?tmpl=${t.id}`)}>
            <img src={t.previewURL} className="w-full aspect-[4/3] object-cover rounded" />
            <div className="text-sm mt-1">{t.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
