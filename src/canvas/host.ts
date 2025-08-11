export type ExportFormat = "png" | "jpg" | "pdf";
type Impl = {
  undo: () => void;
  redo: () => void;
  export: (fmt: ExportFormat, scale: number, transparent: boolean) => Promise<Blob>;
  newDesign: (w: number, h: number) => void;
};
let impl: Impl | null = null;

export const CanvasHost = {
  bind(newImpl: Impl) { impl = newImpl; },
  undo() { impl?.undo(); },
  redo() { impl?.redo(); },
  async export(fmt: ExportFormat, scale = 2, transparent = true) {
    if (!impl) return new Blob([], { type: "application/octet-stream" });
    return impl.export(fmt, scale, transparent);
  },
  newDesign(w: number, h: number) { impl?.newDesign(w, h); },
};
