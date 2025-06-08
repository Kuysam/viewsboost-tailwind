// src/lib/retryLogic.ts

export async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 500
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      await new Promise((res) => setTimeout(res, delay));
      return retry(fn, retries - 1, delay * 2);
    }
  }
  
  // 👇 Add this wrapper for consistent naming
  export const withRetry = retry;
  