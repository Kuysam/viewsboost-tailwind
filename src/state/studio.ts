// src/state/studio.ts
import { create } from "zustand";

type StudioState = {
  canvasSize: { w: number; h: number } | null;
  dirty: boolean;
  setSize: (w:number,h:number)=>void;
  setDirty: (v:boolean)=>void;
};

export const useStudio = create<StudioState>((set)=>({
  canvasSize: null,
  dirty: false,
  setSize: (w,h)=> set({ canvasSize: { w, h }, dirty: false }),
  setDirty: (v)=> set({ dirty: v }),
}));
