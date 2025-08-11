import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { fabric } from 'fabric';
import { useStudio } from './state/studioStore';
type Ctx = { canvas: fabric.Canvas|null };
const C = createContext<Ctx>({ canvas: null });
export const useFabric = () => useContext(C);
export default function FabricCanvasProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLCanvasElement|null>(null);
  const { doc } = useStudio();
  const canvas = useMemo(() => ref.current ? new fabric.Canvas(ref.current, { backgroundColor: doc?.bg ?? '#fff' }) : null, [ref.current]);
  useEffect(() => () => { canvas?.dispose(); }, [canvas]);
  useEffect(() => { if (!canvas || !doc) return; canvas.setWidth(doc.width); canvas.setHeight(doc.height); canvas.renderAll(); }, [canvas, doc?.width, doc?.height, doc?.bg]);
  return (<C.Provider value={{ canvas }}><div className="flex justify-center items-center w-full h-full overflow-auto bg-neutral-100"><canvas ref={ref} /></div>{children}</C.Provider>);
}
