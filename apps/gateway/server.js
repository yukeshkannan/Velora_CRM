const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const dotenv = require('dotenv');
const { authMiddleware, rateLimiter } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(cors());

const STAFF_ROLES = ['Admin', 'Employee', 'Sales', 'HR'];

// Sanitize incoming headers to prevent header injection spoofing
app.use((req, res, next) => {
    delete req.headers['x-user-id'];
    delete req.headers['x-user-role'];
    delete req.headers['x-user-email'];
    delete req.headers['x-active-role'];

    const correlationId = req.headers['x-correlation-id'] || `corr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    req.correlationId = correlationId;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
});

// Gateway sliding window rate limiter
app.use(rateLimiter(200, 60));

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
    if (srcReq.user) {
        proxyReqOpts.headers['x-user-id'] = srcReq.user.id || srcReq.user._id;
        proxyReqOpts.headers['x-user-role'] = srcReq.user.role;
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
            console.error(`[Gateway Error] Path: ${path} | Target: ${target} | Error: ${err.message}`);
            res.status(502).json({ success: false, message: 'Upstream service temporarily unavailable' });
        }
    }));
};

// 1. Authentication Routes
mountProxy('/api/auth/login', SERVICES.AUTH);
mountProxy('/api/auth/register', SERVICES.AUTH);
mountProxy('/api/auth/google-login', SERVICES.AUTH);
mountProxy('/api/auth/forgot-password', SERVICES.AUTH);
mountProxy('/api/auth/reset-password', SERVICES.AUTH);
mountProxy('/api/auth/create-user', SERVICES.AUTH, authMiddleware(['Admin']));

// 2. Task Management
app.use('/api/tasks', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (role === 'Client') {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    if (!STAFF_ROLES.includes(role)) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.TASK, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Task service unavailable' })
}));

// 3. Notifications & Analytics
mountProxy('/api/notifications', SERVICES.NOTIFICATION, authMiddleware());
mountProxy('/api/analytics', SERVICES.ANALYTICS, authMiddleware(STAFF_ROLES));

// 4. Documents & File Storage
app.use('/api/documents', (req, res, next) => {
    if (req.method === 'GET') {
        return next();
    }
    return authMiddleware()(req, res, next);
}, proxy(SERVICES.DOCUMENT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Document service unavailable' })
}));

// 5. Customer Support Tickets
app.use('/api/tickets', authMiddleware(), (req, res, next) => {
    if (req.user?.role === 'Client') {
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
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Ticket service unavailable' })
}));

// 6. Search & HR Attendance
mountProxy('/api/search', SERVICES.SEARCH, authMiddleware(STAFF_ROLES));
mountProxy('/api/attendance', SERVICES.HR, authMiddleware(STAFF_ROLES));
mountProxy('/api/invoices/:id/download', SERVICES.INVOICE);

// 7. User Administration
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
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Auth service unavailable' })
}));

// 8. Contact Management
app.use('/api/contacts', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (role === 'Client') {
        if (req.method === 'GET') {
            const hasEmailFilter = req.query.email;
            const isSelfContact = req.path !== '/' && req.path !== '';
            if (hasEmailFilter || isSelfContact) return next();
            return res.status(403).json({ success: false, message: 'Access forbidden' });
        }
        if (req.method === 'POST') return next();
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    if (!STAFF_ROLES.includes(role)) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.CONTACT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/contacts${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Contact service unavailable' })
}));

// 9. Pipeline Opportunities
app.use('/api/opportunities', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (role === 'Client') {
        if (req.method === 'POST' || req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    if (!STAFF_ROLES.includes(role)) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.OPPORTUNITY, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Opportunity service unavailable' })
}));

// 10. Product Catalog
app.use('/api/products', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (role === 'Client') {
        if (req.method === 'GET') return next();
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    if (!STAFF_ROLES.includes(role)) {
        return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.PRODUCT, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => `/api/products${req.url}`,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Product service unavailable' })
}));

// 11. Invoices & Billing
app.use(['/api/invoices', '/api/payments'], authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'Client'].includes(role)) {
            return res.status(403).json({ success: false, message: 'Access forbidden' });
        }
    }
    if (role === 'Client') {
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
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'Invoice service unavailable' })
}));

// 12. HR Payroll & Leave
app.use('/api/payroll', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (!STAFF_ROLES.includes(role)) return res.status(403).json({ success: false, message: 'Access forbidden' });
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (!['Admin', 'HR'].includes(role)) return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'HR service unavailable' })
}));

app.use('/api/leave', authMiddleware(), (req, res, next) => {
    const role = req.user?.role;
    if (!STAFF_ROLES.includes(role)) return res.status(403).json({ success: false, message: 'Access forbidden' });
    if (req.method === 'PUT' && req.path.includes('/status')) {
        if (!['Admin', 'HR'].includes(role)) return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
}, proxy(SERVICES.HR, {
    parseReqBody: false,
    proxyReqPathResolver: (req) => req.originalUrl,
    proxyReqOptDecorator: defaultOptDecorator,
    proxyErrorHandler: (err, res, next) => res.status(502).json({ success: false, message: 'HR service unavailable' })
}));

// Health checks
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'Velora-API-Gateway', timestamp: new Date() }));
app.get('/api', (req, res) => res.json({ status: 'UP', message: 'Velora API Gateway Operational' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[Gateway] API Gateway operational on port ${PORT}`));
