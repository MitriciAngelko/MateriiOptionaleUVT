/**
 * Rate limiting middleware for API protection
 */

// Simple in-memory rate limiter (for production, use Redis)
class SimpleRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.max || 100;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.message = options.message || 'Too many requests from this IP, please try again later.';
    
    this.hits = new Map();
    this.resetTime = new Map();
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      
      // Initialize or get existing data
      if (!this.hits.has(key) || now > this.resetTime.get(key)) {
        this.hits.set(key, 0);
        this.resetTime.set(key, now + this.windowMs);
      }
      
      const hits = this.hits.get(key);
      
      // Check if limit exceeded
      if (hits >= this.maxRequests) {
        const resetTime = this.resetTime.get(key);
        const remainingTime = Math.ceil((resetTime - now) / 1000);
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: this.message,
          retryAfter: remainingTime
        });
      }
      
      // Increment counter
      this.hits.set(key, hits + 1);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests,
        'X-RateLimit-Remaining': Math.max(0, this.maxRequests - hits - 1),
        'X-RateLimit-Reset': new Date(this.resetTime.get(key)).toISOString()
      });
      
      next();
    };
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        this.hits.delete(key);
        this.resetTime.delete(key);
      }
    }
  }

  // Method to reset rate limit for a specific key (for development/testing)
  reset(key = null) {
    if (key) {
      this.hits.delete(key);
      this.resetTime.delete(key);
    } else {
      // Reset all if no key specified
      this.hits.clear();
      this.resetTime.clear();
    }
  }
}

// Predefined rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter
  general: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP, please try again in 15 minutes.'
  }),
  
  // Strict rate limiter for sensitive operations
  strict: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: 'Too many requests for this operation, please try again in 15 minutes.'
  }),
  
  // Authentication rate limiter
  auth: new SimpleRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 auth requests per window
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  }),
  
  // Mass operations rate limiter (very strict)
  massOperations: new SimpleRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1, // Only 1 mass operation per hour
    message: 'Mass operations are limited to once per hour for security reasons.'
  })
};

module.exports = {
  SimpleRateLimiter,
  rateLimiters,
  
  // Export middleware functions
  generalLimit: rateLimiters.general.middleware(),
  strictLimit: rateLimiters.strict.middleware(),
  authLimit: rateLimiters.auth.middleware(),
  massOperationsLimit: rateLimiters.massOperations.middleware(),
  
  // Development utility to reset rate limiters
  resetRateLimiter: (limiterName = 'massOperations', key = null) => {
    if (rateLimiters[limiterName]) {
      rateLimiters[limiterName].reset(key);
      console.log(`Rate limiter '${limiterName}' reset for key: ${key || 'all keys'}`);
    }
  }
}; 