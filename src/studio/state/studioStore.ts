import { create } from 'zustand';
import { DesignDoc, Layer } from '../../types/studio';
type UI = { zoom: number; saving: boolean; dirty: boolean; };
interface StudioState {
  doc: DesignDoc|null; ui: UI;
  setDoc(p: Partial<DesignDoc>): void;
  setDocFull(d: DesignDoc|null): void;
  addLayer(l: Layer): void; updateLayer(id: string, props: any): void; removeLayer(id: string): void;
  setDirty(d: boolean): void; setSaving(s: boolean): void; setZoom(z: number): void;
}
export const useStudio = create<StudioState>((set) => ({
  doc: null, ui: { zoom: 1, saving: false, dirty: false },
  setDoc: (p) => set(s => s.doc ? ({ doc: { ...s.doc, ...p }, ui: { ...s.ui, dirty: true } }) : s),
  setDocFull: (d) => set(() => ({ doc: d })),
  addLayer: (l) => set(s => s.doc ? ({ doc: { ...s.doc, layers: [...s.doc.layers, l] }, ui: { ...s.ui, dirty: true } }) : s),
  updateLayer: (id, props) => set(s => {
    if (!s.doc) return s;
    const layers = s.doc.layers.map(x => x.id === id ? { ...x, props: { ...x.props, ...props } } : x);
    return { doc: { ...s.doc, layers }, ui: { ...s.ui, dirty: true } };
  }),
  removeLayer: (id) => set(s => s.doc ? ({ doc: { ...s.doc, layers: s.doc.layers.filter(x => x.id !== id) }, ui: { ...s.ui, dirty: true } }) : s),
  setDirty: (d) => set(s => ({ ui: { ...s.ui, dirty: d } })), setSaving: (sv) => set(s => ({ ui: { ...s.ui, saving: sv } })),
  setZoom: (z) => set(s => ({ ui: { ...s.ui, zoom: z } })),
}));
