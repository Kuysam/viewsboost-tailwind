import { useRef } from "react";
import { fabric } from 'fabric';
import { useEditorStore } from '../store/useEditorStore';

export default function Toolbar() {
	const addRect = useEditorStore(s => s.addRect);
	const addText = useEditorStore(s => s.addText);
	const del = useEditorStore(s => s.deleteSelected);
	const bring = useEditorStore(s => s.bringForward);
	const send = useEditorStore(s => s.sendBackward);
	const setZoom = useEditorStore(s => s.setZoom);
	const zoom = useEditorStore(s => s.zoom);
	const uploadImgRef = useRef<HTMLInputElement>(null);
	const uploadVidRef = useRef<HTMLInputElement>(null);
	const addImageFromFile = useEditorStore(s => s.addImageFromFile);
	const requestSafeRender = useEditorStore(s => s.requestSafeRender);
	const getCanvas = () => useEditorStore.getState().canvas;
	const play = useEditorStore(s => s.playPreview);
	const stop = useEditorStore(s => s.stopPreview);
  const addPage = useEditorStore(s => s.addPage);
  const addBlankPage = useEditorStore(s => s.addBlankPage);

async function addVideoFromFile(file: File) {
  if (!file || !file.type.startsWith('video/')) return;

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';

  // wait for some data so width/height exist
  await new Promise<void>((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error('Video load error')); };
    const cleanup = () => {
      video.removeEventListener('loadeddata', ok);
      video.removeEventListener('error', bad);
    };
    video.addEventListener('loadeddata', ok, { once: true });
    video.addEventListener('error', bad, { once: true });
  });

  const canvas = useEditorStore.getState().canvas as any;
  if (!canvas || !canvas.contextContainer) { URL.revokeObjectURL(url); return; }

  const img = new fabric.Image(video, {
    left: 120,
    top: 120,
    selectable: true,
    objectCaching: false, // important for live video
  }) as any;

  // Mark as video for proper detection in layers
  img.__isVideo = true;
  img.__videoElement = video;
  img.__src = url;

  canvas.add(img);
  canvas.setActiveObject(img);
  requestSafeRender();

  // kick playback
  video.play().catch(() => {
    console.log('Autoplay blocked, video will play when user interacts');
  });

  // minimal per-video render tick; cancels when removed
  let alive = true;
  (function tick() {
    if (!alive) return;
    const c: any = useEditorStore.getState().canvas;
    if (c && c.contextContainer) {
      img.dirty = true;        // tell Fabric to re-draw the image
      c.requestRenderAll();    // guarded render
    }
    fabric.util.requestAnimFrame(tick);
  })();

  img.on('removed', () => {
    alive = false;
    video.pause();
    URL.revokeObjectURL(url);
  });

  console.log('Video successfully added to canvas:', {
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    duration: video.duration,
    fabricObject: img
  });
}

	return (
    <div className="flex gap-2 items-center p-2 rounded-xl border bg-white shadow-sm">
      <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white" onClick={addRect}>Rect</button>
      <button className="px-3 py-1 rounded-lg bg-slate-800 text-white" onClick={addText}>Text</button>

      <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={() => uploadImgRef.current?.click()}>Image</button>
      <input ref={uploadImgRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) addImageFromFile(f); }} />

      <button className="px-3 py-1 rounded-lg bg-rose-600 text-white" onClick={() => uploadVidRef.current?.click()}>Video</button>
      <input ref={uploadVidRef} type="file" accept="video/*" className="hidden" onChange={async (e) => {
        const f = e.currentTarget.files?.[0];
        if (f && f.type.startsWith('video/')) {
          try {
            console.log('Uploading video:', f.name, f.type, f.size);
            await addVideoFromFile(f);
            console.log('Video upload completed');
          } catch (error) {
            console.error('Video upload failed:', error);
            alert('Failed to upload video: ' + (error as Error).message);
          }
        }
      }} />

      <div className="mx-2 w-px h-6 bg-gray-200" />
      <button className="px-2 py-1 rounded bg-gray-100 text-gray-800" onClick={bring}>Bring ↑</button>
      <button className="px-2 py-1 rounded bg-gray-100 text-gray-800" onClick={send}>Send ↓</button>
			<button className="px-2 py-1 rounded bg-rose-600 text-white" onClick={del}>Delete</button>
			<div className="ml-3 flex items-center gap-2">
        <span className="text-sm text-gray-700">Zoom</span>
        <input type="range" min={0.25} max={2} step={0.05} value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} />
        <span className="text-sm w-12 text-right text-gray-800">{Math.round(zoom*100)}%</span>
			</div>

      <div className="ml-auto flex gap-2">
        <button className="px-2 py-1 rounded bg-gray-100 text-gray-800" onClick={addBlankPage || addPage}>Create Blank</button>
        <button className="px-2 py-1 rounded bg-emerald-600 text-white" onClick={() => {
          const canvas = getCanvas();
          if (!canvas) return;
          // Play all videos on the canvas
          canvas.getObjects().forEach((obj: any) => {
            if (obj.__isVideo && obj.__videoElement) {
              obj.__videoElement.play().catch(() => {});
            }
          });
        }}>Play Videos</button>
        <button className="px-2 py-1 rounded bg-gray-200 text-gray-800" onClick={() => {
          const canvas = getCanvas();
          if (!canvas) return;
          // Pause all videos on the canvas
          canvas.getObjects().forEach((obj: any) => {
            if (obj.__isVideo && obj.__videoElement) {
              obj.__videoElement.pause();
            }
          });
        }}>Pause Videos</button>
      </div>
		</div>
	);
}


