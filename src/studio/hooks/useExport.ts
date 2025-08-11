import { useFabric } from '../FabricCanvasProvider';
export function useExport() {
  const { canvas } = useFabric();
  const exportImage = (format: 'png'|'jpeg'='png', scale=1) => {
    if (!canvas) throw new Error('Canvas not ready');
    return canvas.toDataURL({ format, multiplier: scale });
  };
  return { exportImage };
}
