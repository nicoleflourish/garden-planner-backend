/**
 * Simple in-memory cache middleware
 * Caches API responses to reduce external API calls and improve performance
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const { data, timestamp, duration } = item;
    const age = Date.now() - timestamp;

    // Check if cache entry has expired
    if (age > duration) {
      this.cache.delete(key);
      return null;
    }

    return { data, age };
  }

  set(key, data, duration) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }

  // Get all cache keys for debugging
  keys() {
    return Array.from(this.cache.keys());
  }
}

// Create singleton instance
const cache = new MemoryCache();

/**
 * Cache middleware factory
 * @param {number} durationMs - Cache duration in milliseconds
 * @returns Express middleware function
 */
const cacheMiddleware = (durationMs) => {
  return (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    if (cached) {
      const ageSeconds = Math.round(cached.age / 1000);
      const ageMinutes = Math.round(ageSeconds / 60);
      
      console.log(`✓ Cache HIT: ${key} (age: ${ageMinutes}m ${ageSeconds % 60}s)`);
      
      // Add cache headers for debugging
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', ageSeconds.toString());
      
      return res.json(cached.data);
    }

    console.log(`✗ Cache MISS: ${key}`);
    res.setHeader('X-Cache', 'MISS');

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = (data) => {
      cache.set(key, data, durationMs);
      console.log(`📝 Cached: ${key} (TTL: ${Math.round(durationMs / 1000 / 60)}m)`);
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  cache
};