const formatResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};

const correlationLogger = (serviceName) => {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || 'N/A';
    req.correlationId = correlationId;
    console.log(`[${serviceName}] [${correlationId}] ${req.method} ${req.originalUrl || req.url}`);
    next();
  };
};

const rabbitmq = require('./rabbitmq');
const authMiddleware = require('./authMiddleware');
const cache = require('./cache');

module.exports = { 
  formatResponse,
  authMiddleware,
  correlationLogger,
  ...cache,
  ...rabbitmq
};
