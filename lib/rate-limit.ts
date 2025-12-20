/**
 * Simple in-memory rate limiter
 * Limits users to a certain number of requests per hour
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (userId -> entry)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a user has exceeded their rate limit
 * @param userId - The user ID to check
 * @param limit - Maximum number of requests per hour (default: 30)
 * @returns RateLimitResult with allowed status and remaining count
 */
export function checkRateLimit(userId: string, limit: number = 30): RateLimitResult {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;

  let entry = rateLimitStore.get(userId);

  // If no entry or reset time has passed, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + hourInMs,
    };
    rateLimitStore.set(userId, entry);
  }

  // Increment the count
  entry.count++;

  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;

  return {
    allowed,
    limit,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a user (useful for testing or admin actions)
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}
