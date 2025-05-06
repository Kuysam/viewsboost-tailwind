import { logger } from './logger';
import { quotaTracker } from './rateLimiter';
import { db } from './firebase';
import { collection, doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

interface SystemMetrics {
  quotaUsed: number;
  quotaRemaining: number;
  timestamp: Date;
  errors: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

class SystemMonitor {
  private static instance: SystemMonitor;
  private metrics: SystemMetrics;
  private responseTimeSamples: number[] = [];
  private readonly MAX_SAMPLES = 100;

  private constructor() {
    this.metrics = {
      quotaUsed: 0,
      quotaRemaining: 10000,
      timestamp: new Date(),
      errors: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  // Track API call timing
  async trackApiCall(operation: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    try {
      const result = await operation();
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordError();
      throw error;
    }
  }

  private recordSuccess(duration: number) {
    this.metrics.successfulRequests++;
    this.addResponseTimeSample(duration);
  }

  private recordError() {
    this.metrics.errors++;
    this.metrics.failedRequests++;
  }

  private addResponseTimeSample(duration: number) {
    this.responseTimeSamples.push(duration);
    if (this.responseTimeSamples.length > this.MAX_SAMPLES) {
      this.responseTimeSamples.shift();
    }
    this.updateAverageResponseTime();
  }

  private updateAverageResponseTime() {
    const sum = this.responseTimeSamples.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimeSamples.length;
  }

  // Update metrics with current quota information
  async updateQuotaMetrics() {
    this.metrics.quotaUsed = 10000 - quotaTracker.getQuotaRemaining();
    this.metrics.quotaRemaining = quotaTracker.getQuotaRemaining();
    this.metrics.timestamp = new Date();

    // Log metrics
    logger.info('System metrics updated', { metrics: this.metrics });

    // Store metrics in Firestore
    try {
      const metricsRef = doc(collection(db, 'system'), 'metrics');
      await setDoc(metricsRef, {
        ...this.metrics,
        timestamp: serverTimestamp(),
        lastUpdate: serverTimestamp()
      }, { merge: true });

      // Store hourly snapshot
      const hourlyRef = doc(
        collection(db, 'system'), 
        `hourly_metrics_${new Date().toISOString().slice(0, 13)}`
      );
      await setDoc(hourlyRef, {
        quotaUsed: increment(this.metrics.quotaUsed),
        errors: increment(this.metrics.errors),
        requests: increment(this.metrics.successfulRequests + this.metrics.failedRequests),
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      logger.error('Failed to store metrics', { error });
    }
  }

  // Get current metrics
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  // Check system health
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Check quota
    if (this.metrics.quotaRemaining < 1000) {
      issues.push('API quota running low');
    }

    // Check error rate
    const errorRate = this.metrics.failedRequests / 
      (this.metrics.successfulRequests + this.metrics.failedRequests);
    if (errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    // Check response time
    if (this.metrics.averageResponseTime > 2000) {
      issues.push('High average response time');
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'critical' : 'degraded';
    }

    return { status, issues };
  }
}

export const systemMonitor = SystemMonitor.getInstance(); 