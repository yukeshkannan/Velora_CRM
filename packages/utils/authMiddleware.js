const jwt = require('jsonwebtoken');
const { getCache } = require('./cache');

/**
 * Unified Authentication & Role-Based Access Control (RBAC) Middleware
 *
 * @param {string[]} allowedRoles - Optional list of authorized roles
 */
const authMiddleware = (allowedRoles = []) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

        let user = null;

        if (token) {
            try {
                // Verify revocation against Redis blacklist if available
                const isBlacklisted = await getCache(`jwt_blacklist:${token}`);
                if (isBlacklisted) {
                    return res.status(401).json({ success: false, message: 'Token has been revoked' });
                }

                const secret = process.env.JWT_SECRET;
                if (!secret) {
                    if (req.headers['x-user-id'] && req.headers['x-user-role']) {
                        user = {
                            id: req.headers['x-user-id'],
                            role: req.headers['x-user-role'],
                            email: req.headers['x-user-email'] || ''
                        };
                    } else {
                        console.error('[Auth Middleware] Critical: JWT_SECRET environment variable is not defined');
                        return res.status(500).json({ success: false, message: 'Authentication service configuration error' });
                    }
                } else {
                    user = jwt.verify(token, secret);
                }
            } catch (err) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }
        } else if (req.headers['x-user-id'] && req.headers['x-user-role']) {
            // Internal inter-service communication (pre-authenticated upstream by Gateway)
            user = {
                id: req.headers['x-user-id'],
                role: req.headers['x-user-role'],
                email: req.headers['x-user-email'] || ''
            };
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Access denied: Authentication required' });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Access forbidden: Insufficient permissions' });
        }

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
