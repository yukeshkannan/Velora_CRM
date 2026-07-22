const memoryStore = new Map();
const memoryTTLs = new Map();

/**
 * Universal Cache Utility with Redis Support & Memory Fallback
 */
let redisClient = null;
let isRedisAvailable = false;

// Attempt optional Redis connection if ioredis or redis package is available
try {
    const Redis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false
    });

    redisClient.connect().then(() => {
        isRedisAvailable = true;
        console.log('[Cache] [REDIS] Connected successfully to Redis server');
    }).catch(() => {
        isRedisAvailable = false;
        console.log('[Cache] [MEMORY FALLBACK] Redis server offline. Using ultra-fast in-memory cache.');
    });

    redisClient.on('error', () => {
        isRedisAvailable = false;
    });
} catch (e) {
    console.log('[Cache] [MEMORY FALLBACK] ioredis module not loaded. Operating in high-performance memory cache mode.');
}

/**
 * Get item from Cache (Redis or Memory Fallback)
 */
const getCache = async (key) => {
    try {
        if (isRedisAvailable && redisClient) {
            const data = await redisClient.get(key);
            if (data) return JSON.parse(data);
        }
    } catch (err) {
        // Fallback to memory
    }

    // Memory Store Fallback
    if (memoryStore.has(key)) {
        const expiry = memoryTTLs.get(key);
        if (expiry && Date.now() > expiry) {
            memoryStore.delete(key);
            memoryTTLs.delete(key);
            return null;
        }
        return memoryStore.get(key);
    }
    return null;
};

/**
 * Set item in Cache (Redis or Memory Fallback)
 */
const setCache = async (key, value, ttlSeconds = 300) => {
    try {
        if (isRedisAvailable && redisClient) {
            await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        }
    } catch (err) {
        // Fallback to memory
    }

    // Always keep memory fallback synced
    memoryStore.set(key, value);
    memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
};

/**
 * Delete item from Cache
 */
const delCache = async (key) => {
    try {
        if (isRedisAvailable && redisClient) {
            await redisClient.del(key);
        }
    } catch (err) {}

    memoryStore.delete(key);
    memoryTTLs.delete(key);
};

/**
 * Clear keys matching a pattern (e.g. "products:*")
 */
const delCachePattern = async (pattern) => {
    const prefix = pattern.replace('*', '');
    for (const k of memoryStore.keys()) {
        if (k.startsWith(prefix)) {
            memoryStore.delete(k);
            memoryTTLs.delete(k);
        }
    }
    try {
        if (isRedisAvailable && redisClient) {
            const keys = await redisClient.keys(pattern);
            if (keys && keys.length > 0) {
                await redisClient.del(...keys);
            }
        }
    } catch (err) {}
};

/**
 * Sliding Window Rate Limiter Middleware
 */
const rateLimiter = (maxRequests = 100, windowSeconds = 60) => {
    return async (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const key = `ratelimit:${ip}:${req.path}`;
        
        const now = Date.now();
        let requests = await getCache(key) || [];
        
        // Filter requests outside the current time window
        requests = requests.filter(time => now - time < windowSeconds * 1000);
        
        if (requests.length >= maxRequests) {
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('Retry-After', windowSeconds);
            return res.status(429).json({
                success: false,
                message: `Too many requests from IP ${ip}. Rate limit exceeded. Try again in ${windowSeconds} seconds.`
            });
        }
        
        requests.push(now);
        await setCache(key, requests, windowSeconds);
        
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
        next();
    };
};

module.exports = {
    getCache,
    setCache,
    delCache,
    delCachePattern,
    rateLimiter
};
