export type Size = { width: number; height: number };

export type Page = {
  id: string;
  name: string;
  size: Size;
};

export type ClipType = 'video' | 'image' | 'audio' | 'effect';

export type Clip = {
  id: string;
  type: ClipType;
  src?: string;
  thumb?: string;
  start: number; // seconds
  duration: number; // seconds
  muted?: boolean;
  speed?: number; // 0.25-3
  label?: string;
};

export type TrackType = 'video' | 'image' | 'audio' | 'effect';

export type Track = {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
};

export type Project = {
  id: string;
  title: string;
  pages: Page[];
  currentPageId: string;
};

export type PreviewMedia = { type: 'image' | 'video' | 'pdf'; url: string } | null;


