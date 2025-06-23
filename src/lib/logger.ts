// src/lib/logger.ts
export const logger = {
    info: (...args: any[]) => {
      if (import.meta.env.DEV) console.log('[INFO]', ...args);
    },
    error: (...args: any[]) => {
      if (import.meta.env.DEV) console.error('[ERROR]', ...args);
    },
    warn: (...args: any[]) => {
      if (import.meta.env.DEV) console.warn('[WARN]', ...args);
    },
    debug: (...args: any[]) => {
      if (import.meta.env.DEV && import.meta.env.VITE_LOG_LEVEL === 'debug') {
        console.debug('[DEBUG]', ...args);
      }
    }
  };
  