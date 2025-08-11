import { useFabric } from '../FabricCanvasProvider';

export function useExport() {
  const { canvas } = useFabric();

  const exportImage = (format: 'png'|'jpeg' = 'png', scale = 1, opts?: { transparent?: boolean }) => {
    if (!canvas) throw new Error('Canvas not ready');
    const transparent = !!opts?.transparent && format === 'png';
    const prevBg = canvas.backgroundColor;
    if (transparent) {
      canvas.setBackgroundColor('rgba(0,0,0,0)', undefined as any);
      canvas.renderAll();
    }
    const url = canvas.toDataURL({ format, multiplier: scale });
    if (transparent) {
      canvas.setBackgroundColor(prevBg as any, undefined as any);
      canvas.renderAll();
    }
    return url;
  };

  return { exportImage };
}
