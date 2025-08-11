import { useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useUser } from '../_auth/useUser';
import FabricCanvasProvider from '../FabricCanvasProvider';
import StudioTopbar from '../components/StudioTopbar';
import StudioSidebar from '../components/StudioSidebar';
import { useStudio } from '../state/studioStore';

export default function StudioEditor() {
  const [params] = useSearchParams();
  const { docId } = useParams();
  const { user } = useUser();
  const { setDocFull } = useStudio();

  useEffect(() => {
    const size = params.get('size')?.split('x').map(Number) || [1080, 1920];
    if (!docId) {
      setDocFull({
        ownerId: user?.uid || 'anon',
        title: 'Untitled',
        width: size[0], height: size[1], bg: '#ffffff',
        layers: [], schemaVersion: 1, status: 'draft',
      });
    } else {
      // TODO: load from Firestore designs/:docId and setDocFull(...)
    }
  }, [docId]);

  const { useAutosave } = await import('../hooks/useAutosave'); // dynamic to avoid SSR complaints
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
