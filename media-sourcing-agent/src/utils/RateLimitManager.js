import PQueue from 'p-queue';
import pLimit from 'p-limit';
import { config } from '../config/config.js';

export class RateLimitManager {
  constructor(logger) {
    this.logger = logger;
    this.queues = new Map();
    this.limiters = new Map();
    this.stats = new Map();
    this.resetTimers = new Map();
    
    this.initializeDefaults();
  }

  initializeDefaults() {
    // Initialize rate limiters for different services
    this.createLimiter('pexels', {
      concurrency: 5,
      interval: 1000,
      intervalCap: 5,
      timeout: 30000
    });

    this.createLimiter('unsplash', {
      concurrency: 3,
      interval: 1000,
      intervalCap: 3,
      timeout: 30000
    });

    this.createLimiter('download', {
      concurrency: config.queue.concurrency,
      interval: 500,
      intervalCap: 2,
      timeout: 120000
    });
  }

  createLimiter(name, options) {
    const queue = new PQueue({
      concurrency: options.concurrency,
      interval: options.interval,
      intervalCap: options.intervalCap,
      timeout: options.timeout
    });

    const limiter = pLimit(options.concurrency);
    
    this.queues.set(name, queue);
    this.limiters.set(name, limiter);
    this.stats.set(name, {
      requests: 0,
      successful: 0,
      failed: 0,
      rateLimited: 0,
      lastReset: Date.now(),
      avgResponseTime: 0,
      totalResponseTime: 0
    });

    this.logger.debug(`Created rate limiter for ${name}: ${JSON.stringify(options)}`);
  }

  async execute(limiterName, operation, retryOptions = {}) {
    const queue = this.queues.get(limiterName);
    const limiter = this.limiters.get(limiterName);
    const stats = this.stats.get(limiterName);

    if (!queue || !limiter || !stats) {
      throw new Error(`Rate limiter '${limiterName}' not found`);
    }

    const defaultRetryOptions = {
      maxRetries: config.queue.retryAttempts,
      retryDelay: config.queue.retryDelay,
      exponentialBackoff: true
    };
    
    const options = { ...defaultRetryOptions, ...retryOptions };
    
    return queue.add(async () => {
      return this.executeWithRetry(limiterName, operation, limiter, stats, options);
    });
  }

  async executeWithRetry(limiterName, operation, limiter, stats, options) {
    let lastError;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        stats.requests++;
        const startTime = Date.now();
        
        const result = await limiter(async () => {
          return await operation();
        });
        
        const responseTime = Date.now() - startTime;
        stats.successful++;
        stats.totalResponseTime += responseTime;
        stats.avgResponseTime = stats.totalResponseTime / stats.successful;
        
        this.logger.debug(`${limiterName} request succeeded in ${responseTime}ms (attempt ${attempt + 1})`);
        return result;
        
      } catch (error) {
        lastError = error;
        stats.failed++;
        
        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          stats.rateLimited++;
          this.logger.warn(`Rate limit hit for ${limiterName}: ${error.message}`);
          
          // Extract wait time from error if available
          const waitTime = this.extractWaitTime(error) || this.calculateBackoffDelay(attempt, options);
          
          if (attempt < options.maxRetries) {
            this.logger.info(`Waiting ${waitTime}ms before retry ${attempt + 1}/${options.maxRetries}`);
            await this.delay(waitTime);
            continue;
          }
        } else {
          // Non-rate-limit errors
          this.logger.error(`${limiterName} request failed: ${error.message}`);
          
          if (attempt < options.maxRetries) {
            const waitTime = this.calculateBackoffDelay(attempt, options);
            this.logger.info(`Retrying in ${waitTime}ms (attempt ${attempt + 1}/${options.maxRetries})`);
            await this.delay(waitTime);
            continue;
          }
        }
      }
    }
    
    throw lastError;
  }

  isRateLimitError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.response?.status;
    
    // Common rate limit indicators
    return (
      code === 429 ||
      code === 503 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      message.includes('throttle')
    );
  }

  extractWaitTime(error) {
    // Try to extract wait time from various headers or error messages
    const response = error.response;
    if (!response) return null;

    // Retry-After header (in seconds)
    const retryAfter = response.headers?.['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000;
    }

    // X-RateLimit-Reset header (Unix timestamp)
    const rateLimitReset = response.headers?.['x-ratelimit-reset'];
    if (rateLimitReset) {
      const resetTime = parseInt(rateLimitReset) * 1000;
      const waitTime = resetTime - Date.now();
      return Math.max(waitTime, 1000); // At least 1 second
    }

    return null;
  }

  calculateBackoffDelay(attempt, options) {
    if (!options.exponentialBackoff) {
      return options.retryDelay;
    }
    
    // Exponential backoff with jitter
    const baseDelay = options.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    
    return Math.min(exponentialDelay + jitter, 60000); // Max 1 minute
  }

  async delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  getStats(limiterName) {
    if (limiterName) {
      return this.stats.get(limiterName);
    }
    
    // Return all stats
    const allStats = {};
    for (const [name, stats] of this.stats) {
      allStats[name] = { ...stats };
    }
    return allStats;
  }

  getQueueStatus(limiterName) {
    if (limiterName) {
      const queue = this.queues.get(limiterName);
      return queue ? {
        pending: queue.pending,
        size: queue.size,
        isPaused: queue.isPaused
      } : null;
    }
    
    // Return all queue statuses
    const allStatuses = {};
    for (const [name, queue] of this.queues) {
      allStatuses[name] = {
        pending: queue.pending,
        size: queue.size,
        isPaused: queue.isPaused
      };
    }
    return allStatuses;
  }

  pauseQueue(limiterName) {
    const queue = this.queues.get(limiterName);
    if (queue) {
      queue.pause();
      this.logger.info(`Paused queue: ${limiterName}`);
    }
  }

  resumeQueue(limiterName) {
    const queue = this.queues.get(limiterName);
    if (queue) {
      queue.start();
      this.logger.info(`Resumed queue: ${limiterName}`);
    }
  }

  clearQueue(limiterName) {
    const queue = this.queues.get(limiterName);
    if (queue) {
      queue.clear();
      this.logger.info(`Cleared queue: ${limiterName}`);
    }
  }

  pauseAllQueues() {
    for (const [name, queue] of this.queues) {
      queue.pause();
    }
    this.logger.info('Paused all queues');
  }

  resumeAllQueues() {
    for (const [name, queue] of this.queues) {
      queue.start();
    }
    this.logger.info('Resumed all queues');
  }

  resetStats(limiterName) {
    if (limiterName) {
      const stats = this.stats.get(limiterName);
      if (stats) {
        Object.assign(stats, {
          requests: 0,
          successful: 0,
          failed: 0,
          rateLimited: 0,
          lastReset: Date.now(),
          avgResponseTime: 0,
          totalResponseTime: 0
        });
        this.logger.info(`Reset stats for: ${limiterName}`);
      }
    } else {
      // Reset all stats
      for (const stats of this.stats.values()) {
        Object.assign(stats, {
          requests: 0,
          successful: 0,
          failed: 0,
          rateLimited: 0,
          lastReset: Date.now(),
          avgResponseTime: 0,
          totalResponseTime: 0
        });
      }
      this.logger.info('Reset all stats');
    }
  }

  // Advanced rate limiting features
  createAdaptiveLimiter(name, options, adaptiveOptions = {}) {
    this.createLimiter(name, options);
    
    const defaultAdaptiveOptions = {
      successRateThreshold: 0.9, // 90% success rate
      adjustmentFactor: 0.8,     // Reduce by 20% when below threshold
      recoveryFactor: 1.1,       // Increase by 10% when recovering
      checkInterval: 60000       // Check every minute
    };
    
    const adaptiveConfig = { ...defaultAdaptiveOptions, ...adaptiveOptions };
    
    // Set up adaptive adjustment
    const intervalId = setInterval(() => {
      this.adjustRateLimit(name, adaptiveConfig);
    }, adaptiveConfig.checkInterval);
    
    this.resetTimers.set(name, intervalId);
    
    this.logger.info(`Created adaptive rate limiter for ${name}`);
  }

  adjustRateLimit(limiterName, config) {
    const stats = this.stats.get(limiterName);
    const queue = this.queues.get(limiterName);
    
    if (!stats || !queue || stats.requests === 0) return;
    
    const successRate = stats.successful / stats.requests;
    const currentConcurrency = queue.concurrency;
    
    if (successRate < config.successRateThreshold) {
      // Reduce concurrency due to poor success rate
      const newConcurrency = Math.max(1, Math.floor(currentConcurrency * config.adjustmentFactor));
      if (newConcurrency !== currentConcurrency) {
        queue.concurrency = newConcurrency;
        this.logger.info(`Reduced ${limiterName} concurrency from ${currentConcurrency} to ${newConcurrency} (success rate: ${(successRate * 100).toFixed(1)}%)`);
      }
    } else if (successRate > config.successRateThreshold && stats.rateLimited === 0) {
      // Increase concurrency due to good performance
      const newConcurrency = Math.floor(currentConcurrency * config.recoveryFactor);
      if (newConcurrency !== currentConcurrency) {
        queue.concurrency = newConcurrency;
        this.logger.info(`Increased ${limiterName} concurrency from ${currentConcurrency} to ${newConcurrency} (success rate: ${(successRate * 100).toFixed(1)}%)`);
      }
    }
  }

  destroy(limiterName) {
    if (limiterName) {
      const timer = this.resetTimers.get(limiterName);
      if (timer) {
        clearInterval(timer);
        this.resetTimers.delete(limiterName);
      }
      
      this.queues.delete(limiterName);
      this.limiters.delete(limiterName);
      this.stats.delete(limiterName);
      
      this.logger.info(`Destroyed rate limiter: ${limiterName}`);
    }
  }

  destroyAll() {
    for (const timer of this.resetTimers.values()) {
      clearInterval(timer);
    }
    
    this.queues.clear();
    this.limiters.clear();
    this.stats.clear();
    this.resetTimers.clear();
    
    this.logger.info('Destroyed all rate limiters');
  }
}