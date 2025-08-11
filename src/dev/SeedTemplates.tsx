import * as React from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useUser } from '../studio/_auth/useUser';

type SeedT = { slug:string; title:string; tags:string[]; width:number; height:number; bg:string; layers?:any[]; };

const SEEDS: SeedT[] = [
  { slug:'shorts-city',  title:'Shorts — City Bold', tags:['shorts','photo','cover'], width:1080, height:1920, bg:'#000',
    layers:[{ id:'title', type:'text', props:{ text:'Your Big Title', left:60, top:80, fill:'#fff', fontSize:88, fontWeight:700 }}] },
  { slug:'shorts-calm',  title:'Shorts — Calm',      tags:['shorts','minimal'],       width:1080, height:1920, bg:'#0f172a',
    layers:[{ id:'subtitle', type:'text', props:{ text:'Episode 01', left:60, top:1600, fill:'#e2e8f0', fontSize:56, fontWeight:600 }}] },
  { slug:'shorts-desk',  title:'Shorts — Study',     tags:['shorts','creator'],       width:1080, height:1920, bg:'#111827',
    layers:[{ id:'badge', type:'rect', props:{ left:60, top:80, width:300, height:90, rx:14, ry:14, fill:'#f59e0b' }},
            { id:'badgeText', type:'text', props:{ text:'NEW', left:90, top:100, fill:'#111827', fontSize:44, fontWeight:800 }}] },
  { slug:'shorts-stars', title:'Shorts — Night',     tags:['shorts','astro'],         width:1080, height:1920, bg:'#000',
    layers:[{ id:'headline', type:'text', props:{ text:'5 Space Facts', left:80, top:140, fill:'#fff', fontSize:96, fontWeight:800 }}] },
  { slug:'thumb-cliff',  title:'Thumbnail — Cliff',  tags:['thumbnail','photo'],      width:1280, height:720,  bg:'#060606',
    layers:[{ id:'h', type:'text', props:{ text:'Travel Day 12', left:60, top:520, fill:'#fff', fontSize:72, fontWeight:800 }}] },
  { slug:'thumb-bench',  title:'Thumbnail — Bench',  tags:['thumbnail','minimal'],    width:1280, height:720,  bg:'#0b0b0b',
    layers:[{ id:'h', type:'text', props:{ text:'Deep Talk', left:60, top:520, fill:'#e5e7eb', fontSize:80, fontWeight:700 }}] },
  { slug:'thumb-forest', title:'Thumbnail — Forest', tags:['thumbnail','creator'],    width:1280, height:720,  bg:'#0b0b0b',
    layers:[{ id:'h', type:'text', props:{ text:'How I Edit', left:60, top:520, fill:'#fff', fontSize:80, fontWeight:800 }}] },
  { slug:'thumb-rays',   title:'Thumbnail — Rays',   tags:['thumbnail','bright'],     width:1280, height:720,  bg:'#0b0b0b',
    layers:[{ id:'chip', type:'rect', props:{ left:60, top:480, width:380, height:60, rx:12, ry:12, fill:'#fff' }},
            { id:'h', type:'text', props:{ text:'Morning Routine', left:80, top:490, fill:'#111827', fontSize:54, fontWeight:800 }}] },
];

async function uploadFromFile(uid: string, key: string, file: File) {
  const path = `users/${uid}/assets/templates/${key}-${Date.now()}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  const dl = await getDownloadURL(r);
  return { path, url: dl };
}

export default function SeedTemplates() {
  const { user, loading } = useUser();
  const [log, setLog] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const add = (m: string) => setLog((l)=>[...l, m]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []));
    add(`📁 Selected ${e.target.files?.length || 0} local image(s).`);
  };

  const seedLocal = async () => {
    if (loading) return;
    if (!user) { add('Please sign in first.'); return; }
    if (!files.length) { add('Pick 1–8 images first.'); return; }
    if (busy) return;
    setBusy(true);
    try {
      for (let i = 0; i < SEEDS.length; i++) {
        const tmpl = SEEDS[i];
        const file = files[i % files.length];
        add(`Uploading local asset for ${tmpl.slug} → ${file.name}`);
        const asset = await uploadFromFile(user.uid, tmpl.slug, file);

        const baseLayers:any[] = [
          { id:'bg', type:'image', props:{ src: asset.url, path: asset.path, left:0, top:0, fit:'cover' } },
          ...(tmpl.layers || [])
        ];

        const refDoc = doc(collection(db,'templates'), tmpl.slug);
        await setDoc(refDoc, {
          public:true, title:tmpl.title, tags:tmpl.tags, previewURL:asset.url,
          baseDoc:{ width:tmpl.width, height:tmpl.height, bg:tmpl.bg, layers:baseLayers, schemaVersion:1 },
          createdAt:serverTimestamp(), updatedAt:serverTimestamp(),
        }, { merge:true });
        add(`✔ Seeded ${tmpl.slug}`);
      }
      add('✅ Done! Go to /studio and search: "shorts" or "thumbnail".');
    } catch (e:any) {
      console.error(e); add('❌ Error: '+(e?.code||'')+' '+(e?.message||e));
    } finally { setBusy(false); }
  };

  return (
    <div style={{padding:24,fontFamily:'Inter,ui-sans-serif',lineHeight:1.5, color:'#e5e7eb', background:'#0b0f17', minHeight:'100vh'}}>
      <h1 style={{marginTop:0}}>Seed Templates</h1>
      <p>Prefer local images for reliable seeding.</p>

      <div style={{display:'flex', gap:8, alignItems:'center', margin:'12px 0'}}>
        <label style={{border:'1px dashed #475569', padding:'6px 10px', borderRadius:8, cursor:'pointer'}}>
          Use my local photos
          <input type="file" multiple accept="image/*" style={{display:'none'}} onChange={onPick} />
        </label>
        {files.length ? <span style={{fontSize:12, color:'#94a3b8'}}>{files.length} selected</span> : <span style={{fontSize:12, color:'#64748b'}}>0 selected</span>}
        <button disabled={busy || !files.length} onClick={seedLocal}
          style={{padding:'8px 12px',border:'1px solid #334155',borderRadius:8, background: files.length ? '#111827' : '#11182780', color:'#e5e7eb'}}>
          {busy ? 'Seeding…' : 'Seed with selected photos'}
        </button>
      </div>

      <pre style={{marginTop:16, background:'#0f172a', color:'#e2e8f0', padding:12, borderRadius:8, maxHeight:320, overflow:'auto'}}>
{log.join('\n') || 'Logs will appear here…'}
      </pre>
    </div>
  );
}
