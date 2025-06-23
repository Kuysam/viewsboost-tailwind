/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_YOUTUBE_API_KEY_1: string
  readonly VITE_YOUTUBE_API_KEY_2: string
  readonly VITE_YOUTUBE_API_KEY_3: string
  readonly VITE_YOUTUBE_API_KEY_4: string
  readonly VITE_YOUTUBE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  // External API Keys for multi-platform template discovery
  readonly VITE_PEXELS_API_KEY: string
  readonly VITE_PIXABAY_API_KEY: string
  readonly VITE_UNSPLASH_ACCESS_KEY: string
  readonly VITE_FREEPIK_API_KEY: string
  readonly VITE_DEV_MODE: string
  readonly VITE_LOG_LEVEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Add Node.js process types for browser compatibility
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly VITE_YOUTUBE_API_KEY_1: string
    readonly VITE_YOUTUBE_API_KEY_2: string
    readonly VITE_YOUTUBE_API_KEY_3: string
    readonly VITE_YOUTUBE_API_KEY_4: string
    readonly VITE_YOUTUBE_API_BASE_URL: string
    readonly VITE_PEXELS_API_KEY: string
    readonly VITE_PIXABAY_API_KEY: string
    readonly VITE_UNSPLASH_ACCESS_KEY: string
    readonly ALLOWED_ORIGINS: string
  }
}

declare var process: {
  env: NodeJS.ProcessEnv
}
