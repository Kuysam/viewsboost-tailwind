import { create } from 'zustand';
import { Clip, Page, PreviewMedia, Project, Track } from './types';

type EditorState = {
  project: Project;
  tracks: Track[];
  playhead: number; // seconds
  fps: number;
  preview: PreviewMedia;
  selected: { trackId?: string; clipId?: string } | null;
  // actions
  setPlayhead: (t: number) => void;
  addTrack: (t: Track) => void;
  addClip: (trackId: string, c: Clip) => void;
  moveClip: (trackId: string, clipId: string, start: number) => void;
  resizeClip: (trackId: string, clipId: string, duration: number) => void;
  setClipProps: (trackId: string, clipId: string, props: Partial<Clip>) => void;
  removeClip: (trackId: string, clipId: string) => void;
  setPageSize: (size: { width: number; height: number }) => void;
  setPreview: (p: PreviewMedia) => void;
  setSelected: (sel: { trackId?: string; clipId?: string } | null) => void;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  project: {
    id: 'proj-v2',
    title: 'Untitled',
    pages: [{ id: 'page-1', name: 'Page 1', size: { width: 1080, height: 1920 } }],
    currentPageId: 'page-1',
  },
  tracks: [
    { id: 'track-v', type: 'video', name: 'Video', clips: [] },
    { id: 'track-i', type: 'image', name: 'Image', clips: [] },
    { id: 'track-a', type: 'audio', name: 'Audio', clips: [] },
  ],
  playhead: 0,
  fps: 30,
  preview: null,
  selected: null,
  setPlayhead: (t) => set({ playhead: Math.max(0, t) }),
  addTrack: (t) => set((s) => ({ tracks: [...s.tracks, t] })),
  addClip: (trackId, c) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, c] } : t)),
  })),
  moveClip: (trackId, clipId, start) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? {
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, start: Math.max(0, start) } : c)),
    } : t)),
  })),
  resizeClip: (trackId, clipId, duration) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? {
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, duration: Math.max(0.1, duration) } : c)),
    } : t)),
  })),
  setClipProps: (trackId, clipId, props) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? {
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...props } : c)),
    } : t)),
  })),
  removeClip: (trackId, clipId) => set((s) => ({
    tracks: s.tracks.map((t) => (t.id === trackId ? {
      ...t,
      clips: t.clips.filter((c) => c.id !== clipId),
    } : t)),
  })),
  setPageSize: (size) => set((s) => ({
    project: {
      ...s.project,
      pages: s.project.pages.map((p) => (p.id === s.project.currentPageId ? { ...p, size } : p)),
    },
  })),
  setPreview: (p) => set({ preview: p }),
  setSelected: (sel) => set({ selected: sel }),
}));


