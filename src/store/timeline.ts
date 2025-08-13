import { create } from 'zustand';

export type SceneClip = { id: string; start: number; duration: number; thumb: string; templatePath: string; name?: string };
export type AudioClip = { id: string; start: number; duration: number; src: string; muted: boolean };

export type TimelineState = {
  fps: number;
  zoom: number; // pixels per second
  currentTime: number;
  playing: boolean;
  scenes: SceneClip[];
  audio?: AudioClip | null;

  // helpers
  timeToPixel: (t: number) => number;
  pixelToTime: (x: number) => number;
  getActiveSceneAt: (t: number) => SceneClip | undefined;

  // actions
  setTime: (t: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setZoom: (z: number) => void;
  addScene: (from?: Partial<SceneClip>) => void;
  duplicateScene: (id: string) => void;
  moveScene: (id: string, newIndex: number) => void;
  trimScene: (id: string, edge: 'start' | 'end', toTime: number) => void;
  splitScene: (id: string, atTime: number) => void;
  deleteScene: (id: string) => void;
  setAudio: (clip: AudioClip | null) => void;
};

function normalizeScenes(scenes: SceneClip[]): SceneClip[] {
  let cur = 0;
  return scenes.map((s) => {
    const duration = Math.max(0.5, s.duration);
    const out: SceneClip = { ...s, start: cur, duration };
    cur += duration;
    return out;
  });
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  fps: 30,
  zoom: 80, // 80px per second default
  currentTime: 0,
  playing: false,
  scenes: [],
  audio: null,

  timeToPixel: (t) => t * get().zoom,
  pixelToTime: (x) => x / get().zoom,
  getActiveSceneAt: (t) => {
    const s = get().scenes;
    return s.find((c) => t >= c.start && t < c.start + c.duration) || s[s.length - 1];
  },

  setTime: (t) => set({ currentTime: Math.max(0, t) }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setZoom: (z) => set({ zoom: Math.min(400, Math.max(25, z)) }),

  addScene: (from) => set((s) => {
    const clip: SceneClip = {
      id: `scene-${Date.now()}`,
      name: from?.name || 'Scene',
      thumb: from?.thumb || '/default-template.png',
      templatePath: from?.templatePath || '',
      start: 0,
      duration: Math.max(0.5, from?.duration || 3),
    } as SceneClip;
    const scenes = normalizeScenes([...s.scenes, clip]);
    return { scenes } as Partial<TimelineState> as TimelineState;
  }),

  duplicateScene: (id) => set((s) => {
    const idx = s.scenes.findIndex((x) => x.id === id);
    if (idx < 0) return {} as any;
    const src = s.scenes[idx];
    const dup: SceneClip = { ...src, id: `scene-${Date.now()}` };
    const scenes = normalizeScenes([...s.scenes.slice(0, idx + 1), dup, ...s.scenes.slice(idx + 1)]);
    return { scenes } as any;
  }),

  moveScene: (id, newIndex) => set((s) => {
    const idx = s.scenes.findIndex((x) => x.id === id);
    if (idx < 0) return {} as any;
    const next = [...s.scenes];
    const [clip] = next.splice(idx, 1);
    next.splice(Math.max(0, Math.min(newIndex, next.length)), 0, clip);
    return { scenes: normalizeScenes(next) } as any;
  }),

  trimScene: (id, edge, toTime) => set((s) => {
    const idx = s.scenes.findIndex((x) => x.id === id);
    if (idx < 0) return {} as any;
    const scenes = [...s.scenes];
    const clip = { ...scenes[idx] };
    if (edge === 'start') {
      const newDur = Math.max(0.5, clip.duration - (toTime - clip.start));
      clip.duration = newDur;
    } else {
      const newDur = Math.max(0.5, toTime - clip.start);
      clip.duration = newDur;
    }
    scenes[idx] = clip;
    return { scenes: normalizeScenes(scenes) } as any;
  }),

  splitScene: (id, atTime) => set((s) => {
    const idx = s.scenes.findIndex((x) => x.id === id);
    if (idx < 0) return {} as any;
    const clip = s.scenes[idx];
    const offset = Math.max(0.5, Math.min(clip.duration - 0.5, atTime - clip.start));
    const left: SceneClip = { ...clip, duration: offset };
    const right: SceneClip = { ...clip, id: `scene-${Date.now()}`, duration: clip.duration - offset };
    const scenes = normalizeScenes([...s.scenes.slice(0, idx), left, right, ...s.scenes.slice(idx + 1)]);
    return { scenes } as any;
  }),

  deleteScene: (id) => set((s) => ({ scenes: normalizeScenes(s.scenes.filter((x) => x.id !== id)) })),
  setAudio: (clip) => set({ audio: clip }),
}));

export function getTotalDuration(state: TimelineState): number {
  const lastSceneEnd = state.scenes.reduce((acc, s) => Math.max(acc, s.start + s.duration), 0);
  const audioEnd = state.audio ? state.audio.start + state.audio.duration : 0;
  return Math.max(lastSceneEnd, audioEnd);
}


