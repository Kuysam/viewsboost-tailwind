// src/lib/logger.ts
export const logger = {
    info: (...args: any[]) => {
      if (import.meta.env.DEV) console.log('[INFO]', ...args);
    },
    error: (...args: any[]) => {
      if (import.meta.env.DEV) console.error('[ERROR]', ...args);
    },
  };
  