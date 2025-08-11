import { useEffect } from 'react';
import { fabric } from 'fabric';
import { useFabric } from '../FabricCanvasProvider';
import { useStudio } from '../state/studioStore';
import { resolveImageProps } from '../lib/resolveImage';

function toProps(obj: fabric.Object) {
  const base: any = obj.toObject(['left','top','scaleX','scaleY','angle','width','height','fill','stroke','opacity','rx','ry']);
  if ((obj as any).text != null) base.text = (obj as any).text;
  const el = (obj as any)._element as HTMLImageElement | undefined;
  if (el?.src) base.src = el.src;
  return base;
}

export function useFabricBinding() {
  const { canvas } = useFabric();
  const { doc, updateLayer } = useStudio();

  useEffect(() => {
    if (!canvas || !doc) return;

    canvas.clear();
    canvas.setBackgroundColor(doc.bg, undefined as any);

    const addObj = (l: any) => {
      if (l.type === 'text') {
        const { text = 'Text', ...rest } = l.props ?? {};
        const t = new fabric.Textbox(text, { ...rest });
        (t as any).data = { id: l.id };
        canvas.add(t);
        return;
      }
      if (l.type === 'rect') {
        const r = new fabric.Rect({ ...l.props });
        (r as any).data = { id: l.id };
        canvas.add(r);
        return;
      }
      if (l.type === 'image') {
        (async () => {
          const props = await resolveImageProps(l.props);
          if (!props?.src) { console.warn('Image layer missing src/url/path', l); return; }
          fabric.Image.fromURL(
            props.src,
            (img) => {
              const { fit, ...rest } = props || {};
              img.set({ ...rest });
              if (fit === 'cover') {
                const cw = doc.width, ch = doc.height;
                const sw = img.width ?? 1, sh = img.height ?? 1;
                const scale = Math.max(cw / sw, ch / sh);
                img.set({
                  scaleX: scale, scaleY: scale,
                  left: (cw - sw * scale) / 2,
                  top:  (ch - sh * scale) / 2,
                });
              }
              (img as any).data = { id: l.id };
              canvas.add(img);
              canvas.requestRenderAll();
            },
            { crossOrigin: 'anonymous' }
          );
        })().catch((e) => console.error('Image hydrate error', e, l));
      }
    };

    (doc.layers || []).forEach(addObj);
    canvas.requestRenderAll();

    const onModified = (e: fabric.IEvent<MouseEvent>) => {
      const obj = e.target as fabric.Object | undefined;
      const id = (obj as any)?.data?.id;
      if (!obj || !id) return;
      updateLayer(id, toProps(obj));
    };

    canvas.on('object:modified', onModified);
    return () => { canvas.off('object:modified', onModified); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, doc?.id, JSON.stringify(doc?.layers), doc?.bg]);
}
