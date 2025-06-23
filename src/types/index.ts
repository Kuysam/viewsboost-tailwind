// Unified type definitions for ViewsBoost

export interface Template {
  id: string;
  title: string;
  category: string;
  description?: string;
  desc?: string; // Legacy field
  preview?: string;
  imageUrl?: string;
  platform?: string;
  source?: string;
  detectedPlatform?: string;
  usageScore?: number;
  createdAt?: any;
  importedAt?: string;
  approved?: boolean;
  tags?: string[];
  author?: string;
  license?: string;
  sourceUrl?: string;
  [key: string]: any;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  type: 'short' | 'video';
  channelId?: string;
  publishedAt?: string;
  viewCount?: number;
  description?: string;
  tags?: string[];
  createdAt?: any;
  youtubeId?: string;
  creatorId?: string;
  lastSynced?: string;
  [key: string]: any;
}

export interface Creator {
  id: string;
  channelId: string;
  name?: string;
  displayName?: string;
  thumbnail?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  [key: string]: any;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: any;
  lastLogin?: any;
  preferences?: UserPreferences;
  [key: string]: any;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
  autoplay?: boolean;
  quality?: 'auto' | 'high' | 'medium' | 'low';
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  viewers: number;
  likes: number;
  comments: number;
  status: 'live' | 'scheduled' | 'ended';
  startTime?: Date;
  endTime?: Date;
  creatorId: string;
  [key: string]: any;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: Date;
  likes?: number;
  replies?: Comment[];
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}