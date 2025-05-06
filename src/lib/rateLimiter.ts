interface RateLimiterOptions {
  maxRequests: number;  // Maximum number of requests
  timeWindow: number;   // Time window in milliseconds
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor({ maxRequests, timeWindow }: RateLimiterOptions) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const delay = this.timeWindow - (now - oldestRequest);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.requests.push(Date.now());
  }
}

export const rateLimiters = {
  channels: new RateLimiter({ maxRequests: 60, timeWindow: 60 * 1000 }),
  comments: new RateLimiter({ maxRequests: 30, timeWindow: 30 * 1000 }),
  videos: new RateLimiter({ maxRequests: 45, timeWindow: 45 * 1000 })
};

class DailyQuotaTracker {
  private static instance: DailyQuotaTracker;
  private quotaUsed: number = 0;
  private lastReset: number = Date.now();
  private readonly DAILY_QUOTA = 10000;

  private constructor() {}

  static getInstance(): DailyQuotaTracker {
    if (!DailyQuotaTracker.instance) {
      DailyQuotaTracker.instance = new DailyQuotaTracker();
    }
    return DailyQuotaTracker.instance;
  }

  async checkAndUpdateQuota(cost: number = 1): Promise<void> {
    const now = Date.now();
    if (now - this.lastReset > 24 * 60 * 60 * 1000) {
      this.quotaUsed = 0;
      this.lastReset = now;
    }

    if (this.quotaUsed + cost > this.DAILY_QUOTA) {
      throw new Error('Daily API quota exceeded. Please try again tomorrow.');
    }

    this.quotaUsed += cost;
  }

  getQuotaRemaining(): number {
    return this.DAILY_QUOTA - this.quotaUsed;
  }
}

export const quotaTracker = DailyQuotaTracker.getInstance();

export async function withRateLimit<T>(
  limiter: RateLimiter,
  apiCall: () => Promise<T>,
  quotaCost: number = 1
): Promise<T> {
  await quotaTracker.checkAndUpdateQuota(quotaCost);
  await limiter.throttle();
  return apiCall();
}
