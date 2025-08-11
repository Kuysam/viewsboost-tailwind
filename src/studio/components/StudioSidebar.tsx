import { useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { useUser } from '../_auth/useUser';
import { useStudio } from '../state/studioStore';

export default function StudioSidebar() {
  const fileRef = useRef<HTMLInputElement|null>(null);
  const { user } = useUser();
  const { addLayer } = useStudio();

  const pickFile = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    const path = `users/${user.uid}/assets/${Date.now()}-${f.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, f);
    const url = await getDownloadURL(r);
    addLayer({
      id: crypto.randomUUID(),
      type: 'image',
      props: { src: url, path, left: 100, top: 100, scaleX: 1, scaleY: 1 }
    });
    e.currentTarget.value = ''; // reset input
  };

  return (
    <aside className="w-64 border-r bg-white p-3 space-y-3">
      <div className="font-semibold">Elements</div>
      <button className="btn" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'text', props: { text: 'Headline', left: 100, top: 100, fontSize: 48, fill: '#111827' } })}>Text</button>
      <button className="btn" onClick={() => addLayer({ id: crypto.randomUUID(), type: 'rect', props: { left: 80, top: 80, width: 200, height: 120, fill: '#111827' } })}>Rectangle</button>

      <div className="pt-4">
        <div className="font-semibold mb-2">Uploads</div>
        <button className="btn" onClick={pickFile}>Upload image</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </aside>
  );
}
