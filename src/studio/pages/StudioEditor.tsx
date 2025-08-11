import { useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { doc as fsDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useUser } from '../_auth/useUser';
import FabricCanvasProvider from '../FabricCanvasProvider';
import StudioTopbar from '../components/StudioTopbar';
import StudioSidebar from '../components/StudioSidebar';
import { useStudio } from '../state/studioStore';
import { getTemplate } from '../services/templates';

export default function StudioEditor() {
  const [params] = useSearchParams();
  const { docId } = useParams();
  const nav = useNavigate();
  const { user } = useUser();
  const { setDocFull } = useStudio();

  // initial load
  useEffect(() => {
    (async () => {
      const fromTmpl = params.get('tmpl');
      if (fromTmpl && !docId) {
        const tmpl = await getTemplate(fromTmpl);
        if (tmpl?.baseDoc) {
          setDocFull({
            ...tmpl.baseDoc,
            ownerId: user?.uid || 'anon',
            title: tmpl.title || 'From template',
            schemaVersion: 1,
            status: 'draft',
          });
          return;
        }
      }

      if (docId) {
        const ref = fsDoc(db, 'designs', docId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          nav('/studio', { replace: true });
          return;
        }
        setDocFull(snap.data() as any);
        return;
      }

      const size = params.get('size')?.split('x').map(Number) || [1080, 1920];
      setDocFull({
        ownerId: user?.uid || 'anon',
        title: 'Untitled',
        width: size[0], height: size[1], bg: '#ffffff',
        layers: [],
        schemaVersion: 1,
        status: 'draft',
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // autosave
  const { useAutosave } = require('../hooks/useAutosave');
  useAutosave(user?.uid);

  return (
    <div className="flex flex-col h-full">
      <StudioTopbar />
      <div className="flex flex-1 min-h-0">
        <StudioSidebar />
        <div className="flex-1 min-h-0">
          <FabricCanvasProvider>{/* rulers/guides later */}</FabricCanvasProvider>
        </div>
      </div>
    </div>
  );
}
