export type Preset = { name: string; w: number; h: number };

export const CANVAS_PRESETS: Preset[] = [
  { name: "Instagram Post", w: 1080, h: 1080 },
  { name: "Reel / Story",   w: 1080, h: 1920 },
  { name: "YouTube Thumb",  w: 1280, h: 720 },
  { name: "Custom…",        w: 0,    h: 0 },
];
