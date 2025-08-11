import * as React from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useUser } from '../studio/_auth/useUser';

export default function StorageSmoke() {
  const { user, loading } = useUser();
  const [log, setLog] = React.useState<string[]>([]);
  const add = (m: string) => setLog((l)=>[...l, m]);

  const run = async () => {
    if (loading) return;
    if (!user) { add('Please sign in first.'); return; }
    try {
      const path = `users/${user.uid}/assets/templates/smoke-${Date.now()}.txt`;
      add('Uploading 1KB test to ' + path);
      const r = ref(storage, path);
      const blob = new Blob(['hello from smoke test'], { type: 'text/plain' });
      await uploadBytes(r, blob);
      const url = await getDownloadURL(r);
      add('✅ Storage OK → ' + url);
    } catch (e: any) {
      console.error(e);
      add('❌ Storage error: ' + (e?.code || '') + ' ' + (e?.message || e));
    }
  };

  return (
    <div style={{padding:24,fontFamily:'Inter,ui-sans-serif',color:'#e5e7eb',background:'#0b0f17',minHeight:'100vh'}}>
      <h1 style={{marginTop:0}}>Storage Smoke</h1>
      <p>Uploads a tiny text file to <code>users/&lt;uid&gt;/assets/templates/</code>.</p>
      <button onClick={run} style={{padding:'8px 12px',border:'1px solid #334155',borderRadius:8,background:'#111827',color:'#e5e7eb'}}>Run storage test</button>
      <pre style={{marginTop:16, background:'#0f172a', padding:12, borderRadius:8}}>{log.join('\n') || 'Logs…'}</pre>
    </div>
  );
}
