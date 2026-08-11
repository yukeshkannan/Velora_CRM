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

const defaultOptDecorator = (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['x-correlation-id'] = srcReq.correlationId;
    if (srcReq.headers['x-active-role']) {
        proxyReqOpts.headers['x-active-role'] = srcReq.headers['x-active-role'];
    }
    if (srcReq.user) {
        proxyReqOpts.headers['x-user-id'] = srcReq.user.id || srcReq.user._id;
        proxyReqOpts.headers['x-user-role'] = srcReq.headers['x-active-role'] || srcReq.user.role;
        if (srcReq.user.email) {
            proxyReqOpts.headers['x-user-email'] = srcReq.user.email;
        }
    }
    return proxyReqOpts;
};

const mountProxy = (path, target, middleware = null) => {
    const middlewareChain = middleware ? (Array.isArray(middleware) ? middleware : [middleware]) : [];
    
    app.use(path, ...middlewareChain, proxy(target, {
        parseReqBody: false,
        proxyReqPathResolver: (req) => req.originalUrl,
        proxyReqOptDecorator: defaultOptDecorator,
        proxyErrorHandler: (err, res, next) => {
            console.error(`[Gateway Exception] Path: ${path} | Error: ${err.message}`);
            res.status(502).json({ success: false, message: 'Upstream Service Temporarily Unavailable' });
        }
    }));
};

// 1. Auth Endpoints
mountProxy('/api/auth/login', SERVICES.AUTH);
mountProxy('/api/auth/register', SERVICES.AUTH);
mountProxy('/api/auth/google-login', SERVICES.AUTH);
mountProxy('/api/auth/forgot-password', SERVICES.AUTH);
mountProxy('/api/auth/reset-password', SERVICES.AUTH);
mountProxy('/api/auth/create-user', SERVICES.AUTH, authMiddleware(['Admin']));

// 2. Tasks
app.use('/api/tasks', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    const isClient = effectiveRole === 'Client';
    if (isClient) {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.TASK, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

mountProxy('/api/notifications', SERVICES.NOTIFICATION, authMiddleware());
mountProxy('/api/analytics', SERVICES.ANALYTICS, authMiddleware(STAFF_ROLES));

app.use('/api/documents', (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    return authMiddleware()(req, res, next);
}, proxy(SERVICES.DOCUMENT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Document Service Unavailable' })
}));

// 3. Tickets - Strict Client Data Isolation
app.use('/api/tickets', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    if (effectiveRole === 'Client') {
        const clientEmail = req.user.email;
        if (!req.url.includes('email=')) {
            const separator = req.url.includes('?') ? '&' : '?';
            req.url = `${req.url}${separator}email=${encodeURIComponent(clientEmail)}`;
        }
    }
    next();
}, proxy(SERVICES.TICKET, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/tickets${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Ticket Service Unavailable' })
}));

mountProxy('/api/search', SERVICES.SEARCH, authMiddleware(STAFF_ROLES));
mountProxy('/api/attendance', SERVICES.HR, authMiddleware(STAFF_ROLES));
mountProxy('/api/invoices/:id/download', SERVICES.INVOICE);

// 4. Users
app.use('/api/auth/users', (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
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
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

// 5. Contacts
app.use('/api/contacts', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    const isClient = effectiveRole === 'Client';
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
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.CONTACT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/contacts${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

// 6. Opportunities / Projects
app.use('/api/opportunities', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    const isClient = effectiveRole === 'Client';
    if (isClient) {
        if (req.method === 'POST' || req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.OPPORTUNITY, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

// 7. Products
app.use('/api/products', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    const isClient = effectiveRole === 'Client';
    if (isClient) {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    next();
}, proxy(SERVICES.PRODUCT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/products${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

// 8. Invoices & Payments - Strict Client Data Isolation
app.use(['/api/invoices', '/api/payments'], authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'Client'].includes(effectiveRole)) {
            return res.status(403).json({ success: false, message: 'Access Forbidden' });
        }
    }
    // Strict Client Data Security: If logged in as Client, automatically enforce their email!
    if (effectiveRole === 'Client') {
        const clientEmail = req.user.email;
        if (!req.url.includes('email=')) {
            const separator = req.url.includes('?') ? '&' : '?';
            req.url = `${req.url}${separator}email=${encodeURIComponent(clientEmail)}`;
        }
    }
    next();
}, proxy(SERVICES.INVOICE, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => {
        const isPayments = req.originalUrl.startsWith('/api/payments');
        const basePath = isPayments ? '/api/payments' : '/api/invoices';
        return `${basePath}${req.url}`;
    },
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Invoice Service Unavailable' })
}));

// 9. Payroll
app.use('/api/payroll', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'HR'].includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/payroll${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

// 10. Leave
app.use('/api/leave', authMiddleware(), (req, res, next) => {
    const effectiveRole = req.headers['x-active-role'] || req.user?.role;
    if (!STAFF_ROLES.includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    if (req.method === 'PUT' && req.path.includes('/status')) {
        if (!['Admin', 'HR'].includes(effectiveRole)) return res.status(403).json({ success: false, message: 'Access Forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/leave${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Service Unavailable' })
}));

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'Velora-API-Gateway', timestamp: new Date() }));
app.get('/api', (req, res) => res.json({ status: 'UP', message: 'Velora API Gateway Operational' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[Gateway] Service running on port ${PORT}`));
