import React, { createContext, useContext, useMemo, useState } from "react";

type Size = { w: number; h: number } | null;

type StudioCtx = {
  canvasSize: Size;
  dirty: boolean;
  setSize: (w: number, h: number) => void;
  setDirty: (v: boolean) => void;
};

const Ctx = createContext<StudioCtx | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [canvasSize, setCanvasSize] = useState<Size>(null);
  const [dirty, setDirty] = useState(false);

  const value = useMemo(
    () => ({
      canvasSize,
      dirty,
      setSize: (w: number, h: number) => {
        setCanvasSize({ w, h });
        setDirty(false);
        (window as any).__onSaved?.();
      },
      setDirty,
    }),
    [canvasSize, dirty]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio must be used within <StudioProvider>");
  return ctx;
}
