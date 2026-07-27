const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const dotenv = require('dotenv');
const { authMiddleware, rateLimiter } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(cors());

const STAFF_ROLES = ['Admin', 'Employee', 'Sales', 'HR'];

app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || `corr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    req.correlationId = correlationId;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
});

app.use(rateLimiter(150, 60));

const SERVICES = {
    AUTH: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    CONTACT: process.env.CONTACT_SERVICE_URL || 'http://localhost:5002',
    OPPORTUNITY: process.env.OPPORTUNITY_SERVICE_URL || 'http://localhost:5003',
    TASK: process.env.TASK_SERVICE_URL || 'http://localhost:5004',
    NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005',
    ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5006',
    DOCUMENT: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:5007',
    PRODUCT: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5008',
    INVOICE: process.env.INVOICE_SERVICE_URL || 'http://localhost:5009',
    TICKET: process.env.TICKET_SERVICE_URL || 'http://localhost:5010',
    SEARCH: process.env.SEARCH_SERVICE_URL || 'http://localhost:5011',
    HR: process.env.HR_SERVICE_URL || 'http://localhost:5012'
};

const mountProxy = (path, target, middleware = null) => {
    const middlewareChain = middleware ? (Array.isArray(middleware) ? middleware : [middleware]) : [];
    
    app.use(path, ...middlewareChain, proxy(target, {
        parseReqBody: false,
        proxyReqPathResolver: (req) => {
            const pathPart = req.originalUrl.split('?')[0];
            return pathPart;
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers['x-correlation-id'] = srcReq.correlationId;
            return proxyReqOpts;
        },
        proxyErrorHandler: (err, res, next) => {
            console.error(`[Gateway Exception] Path: ${path} | Error: ${err.message}`);
            res.status(502).json({ success: false, message: 'Upstream Service Temporarily Unavailable' });
        }
    }));
};

mountProxy('/api/auth/login', SERVICES.AUTH);
mountProxy('/api/auth/register', SERVICES.AUTH);
mountProxy('/api/auth/google-login', SERVICES.AUTH);
mountProxy('/api/auth/forgot-password', SERVICES.AUTH);
mountProxy('/api/auth/reset-password', SERVICES.AUTH);
mountProxy('/api/auth/create-user', SERVICES.AUTH, authMiddleware(['Admin']));

app.use('/api/tasks', authMiddleware(), (req, res, next) => {
    const isClient = req.user && req.user.role === 'Client';
    if (isClient) {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.TASK, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl.split('?')[0] + (req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : ''),
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

mountProxy('/api/notifications', SERVICES.NOTIFICATION, authMiddleware());
mountProxy('/api/analytics', SERVICES.ANALYTICS, authMiddleware(STAFF_ROLES));
mountProxy('/api/documents', SERVICES.DOCUMENT, authMiddleware());
mountProxy('/api/tickets', SERVICES.TICKET, authMiddleware());
mountProxy('/api/search', SERVICES.SEARCH, authMiddleware(STAFF_ROLES));
mountProxy('/api/attendance', SERVICES.HR, authMiddleware(STAFF_ROLES));
mountProxy('/api/invoices/:id/download', SERVICES.INVOICE);

app.use('/api/auth/users', (req, res, next) => {
    const isSubPath = req.path !== '/' && req.path !== '';
    if (isSubPath) {
        if (req.method === 'DELETE') return authMiddleware(['Admin'])(req, res, next);
        return authMiddleware()(req, res, next);
    }
    if (req.method === 'GET') return authMiddleware(STAFF_ROLES)(req, res, next);
    return authMiddleware(['Admin'])(req, res, next);
}, proxy(SERVICES.AUTH, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/auth/users${req.url}`,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/contacts', authMiddleware(), (req, res, next) => {
    const isClient = req.user && req.user.role === 'Client';
    if (isClient) {
        if (req.method === 'GET') {
            const hasEmailFilter = req.query.email;
            const isSelfContact = req.path !== '/' && req.path !== '';
            if (hasEmailFilter || isSelfContact) return next();
            return res.status(403).json({ success: false, message: 'Access Forbidden' });
        }
        if (req.method === 'POST') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.CONTACT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/contacts${req.url}`,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/opportunities', authMiddleware(), (req, res, next) => {
    const isClient = req.user && req.user.role === 'Client';
    if (isClient) {
        if (req.method === 'POST' || req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.OPPORTUNITY, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl.split('?')[0] + (req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : ''),
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/products', authMiddleware(), (req, res, next) => {
    const isClient = req.user && req.user.role === 'Client';
    if (isClient) {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.PRODUCT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/products${req.url}`,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use(['/api/invoices', '/api/payments'], authMiddleware(), (req, res, next) => {
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'Client'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access Forbidden' });
        }
    }
    next();
}, proxy(SERVICES.INVOICE, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl.split('?')[0],
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/payroll', authMiddleware(), (req, res, next) => {
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'HR'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/payroll${req.url}`,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/leave', authMiddleware(), (req, res, next) => {
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    if (req.method === 'PUT' && req.path.includes('/status')) {
        if (!['Admin', 'HR'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/leave${req.url}`,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.use('/api/analytics', authMiddleware(), (req, res, next) => {
    if (!STAFF_ROLES.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.ANALYTICS, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl.split('?')[0] + (req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : ''),
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Analytics Service Unavailable' })
}));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'Aura-API-Gateway', timestamp: new Date() }));
app.get('/api', (req, res) => res.json({ status: 'UP', message: 'Aura API Gateway Operational' }));

// API Gateway Operational - Auth & Microservices Proxy Configured
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[Gateway] Service running on port ${PORT}`));

