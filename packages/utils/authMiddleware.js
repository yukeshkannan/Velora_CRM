const jwt = require('jsonwebtoken');
const { getCache } = require('./cache');

/**
 * Central Unified Auth & RBAC Middleware
 * Verifies JWT token and checks user permissions.
 * 
 * @param {string[]} allowedRoles - List of roles permitted to access the route
 */
const authMiddleware = (allowedRoles = []) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

        let user = null;

        if (token) {
            try {
                // Check if token was blacklisted on logout via Redis
                const isBlacklisted = await getCache(`jwt_blacklist:${token}`);
                if (isBlacklisted) {
                    return res.status(401).json({ success: false, message: 'Token has been revoked/logged out' });
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
                user = decoded; // { id, role }
            } catch (err) {
                console.warn(`[Auth Middleware] Blocked request to ${req.originalUrl || req.url}: Invalid token (${err.message})`);
                return res.status(401).json({ success: false, message: 'Invalid or Expired Token' });
            }
        } else if (req.headers['x-user-id'] && req.headers['x-user-role']) {
            // Support gateway-forwarded identity headers (fast path for microservices behind gateway)
            user = {
                id: req.headers['x-user-id'],
                role: req.headers['x-user-role'],
                email: req.headers['x-user-email']
            };
        }

        if (!user) {
            console.warn(`[Auth Middleware] Blocked request to ${req.originalUrl || req.url}: No authorization credentials provided`);
            return res.status(401).json({ success: false, message: 'Access Denied: No Token or Identity Headers Provided' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            console.warn(`[Auth Middleware] Blocked request to ${req.originalUrl || req.url}: User role ${user.role} not authorized for roles: [${allowedRoles.join(', ')}]`);
            return res.status(403).json({ success: false, message: 'Access Forbidden: Insufficient Permissions' });
        }

        // Set req.user and forward headers for downstream microservices
        req.user = user;
        req.headers['x-user-id'] = user.id || user._id;
        req.headers['x-user-role'] = user.role;
        if (user.email) {
            req.headers['x-user-email'] = user.email;
        }

        next();
    };
};

module.exports = authMiddleware;
