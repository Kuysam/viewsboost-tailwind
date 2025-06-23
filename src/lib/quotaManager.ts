// src/lib/quotaManager.ts

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface QuotaUsage {
  [key: string]: {
    used: number;
    errors: number;
    lastReset: any;
  };
}

class QuotaManager {
  private dailyQuota = 10000; // YouTube API daily quota
  private quotaUsage: QuotaUsage = {};

  async initializeQuota(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'quotaUsage', today);
    
    try {
      const quotaDoc = await getDoc(quotaRef);
      
      if (quotaDoc.exists()) {
        this.quotaUsage = quotaDoc.data().keys || {};
      } else {
        // Initialize quota for the day
        await setDoc(quotaRef, {
          date: today,
          keys: {},
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error initializing quota:', error);
    }
  }

  async recordUsage(apiKey: string, requestCost: number = 1): Promise<void> {
    if (!this.quotaUsage[apiKey]) {
      this.quotaUsage[apiKey] = {
        used: 0,
        errors: 0,
        lastReset: serverTimestamp()
      };
    }

    this.quotaUsage[apiKey].used += requestCost;
    
    // Update Firestore
    const today = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'quotaUsage', today);
    
    try {
      await updateDoc(quotaRef, {
        [`keys.${apiKey}`]: this.quotaUsage[apiKey]
      });
    } catch (error) {
      console.error('Error logging quota usage:', error);
    }
  }

  async recordError(apiKey: string): Promise<void> {
    if (!this.quotaUsage[apiKey]) {
      this.quotaUsage[apiKey] = {
        used: 0,
        errors: 0,
        lastReset: serverTimestamp()
      };
    }

    this.quotaUsage[apiKey].errors += 1;
    
    // Update Firestore
    const today = new Date().toISOString().slice(0, 10);
    const quotaRef = doc(db, 'quotaUsage', today);
    
    try {
      await updateDoc(quotaRef, {
        [`keys.${apiKey}.errors`]: this.quotaUsage[apiKey].errors
      });
    } catch (error) {
      console.error('Error logging quota error:', error);
    }
  }

  getUsage(apiKey: string): { used: number; remaining: number; errors: number } {
    const usage = this.quotaUsage[apiKey] || { used: 0, errors: 0 };
    
    return {
      used: usage.used,
      remaining: this.dailyQuota - usage.used,
      errors: usage.errors
    };
  }

  canMakeRequest(apiKey: string, requestCost: number = 1): boolean {
    const usage = this.getUsage(apiKey);
    return usage.remaining >= requestCost;
  }

  getAllUsage(): QuotaUsage {
    return { ...this.quotaUsage };
  }
}

export const quotaManager = new QuotaManager();
