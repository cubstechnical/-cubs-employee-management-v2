interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset window
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxAttempts) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return this.maxAttempts;
    
    const now = Date.now();
    if (now > entry.resetTime) return this.maxAttempts;
    
    return Math.max(0, this.maxAttempts - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.attempts.get(identifier);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.resetTime) return null;
    
    return entry.resetTime;
  }

  clear(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global rate limiter instances
export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

// Cleanup expired entries every 5 minutes
setInterval(() => {
  authRateLimiter.cleanup();
  apiRateLimiter.cleanup();
}, 5 * 60 * 1000);

export default RateLimiter;
