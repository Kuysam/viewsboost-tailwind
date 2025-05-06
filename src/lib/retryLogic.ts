import { APIError } from './errorHandling';

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000,    // 10 seconds
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...defaultRetryOptions, ...options };
  let lastError: Error | null = null;
  let delay = retryOptions.initialDelay;

  for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry based on the error
      if (!shouldRetry(error, retryOptions)) {
        throw error;
      }

      // Don't wait on the last attempt
      if (attempt === retryOptions.maxRetries) {
        break;
      }

      // Wait with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * retryOptions.backoffFactor, retryOptions.maxDelay);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

function shouldRetry(error: any, options: RetryOptions): boolean {
  // Retry on network errors
  if (error.name === 'NetworkError') return true;

  // Retry on specific HTTP status codes
  if (error instanceof APIError && error.status) {
    return options.retryableStatuses.includes(error.status);
  }

  // Don't retry on other errors
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 