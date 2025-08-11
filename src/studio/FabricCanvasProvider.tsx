import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { fabric } from 'fabric';
import { useStudio } from './state/studioStore';
import { useFabricBinding } from './hooks/useFabricBinding';

type Ctx = { canvas: fabric.Canvas | null };
const FabricCtx = createContext<Ctx>({ canvas: null });
export const useFabric = () => useContext(FabricCtx);

export default function FabricCanvasProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { doc } = useStudio();
  const canvas = useMemo(() => {
    if (!ref.current) return null;
    return new fabric.Canvas(ref.current, { backgroundColor: doc?.bg ?? '#ffffff', preserveObjectStacking: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);

  // dispose on unmount
  useEffect(() => () => { canvas?.dispose(); }, [canvas]);

  // resize + bg color
  useEffect(() => {
    if (!canvas || !doc) return;
    canvas.setWidth(doc.width);
    canvas.setHeight(doc.height);
    canvas.setBackgroundColor(doc.bg, undefined as any);
    canvas.renderAll();
  }, [canvas, doc?.width, doc?.height, doc?.bg]);

  // bind layers <-> canvas
  useFabricBinding();

  return (
    <FabricCtx.Provider value={{ canvas }}>
      <div className="flex justify-center items-center w-full h-full overflow-auto bg-neutral-100">
        <canvas ref={ref} />
      </div>
      {children}
    </FabricCtx.Provider>
  );
}
