const { fork } = require('child_process');
const path = require('path');

const GATEWAY_PORT = process.env.PORT || 5000;

// List of internal microservices with their dedicated ports
const services = [
  { name: 'Auth Service', port: 5001, script: path.join(__dirname, 'apps/auth-service/server.js') },
  { name: 'Contact Service', port: 5002, script: path.join(__dirname, 'apps/contact-service/server.js') },
  { name: 'Opportunity Service', port: 5003, script: path.join(__dirname, 'apps/opportunity-service/server.js') },
  { name: 'Task Service', port: 5004, script: path.join(__dirname, 'apps/task-service/server.js') },
  { name: 'Notification Service', port: 5005, script: path.join(__dirname, 'apps/notification-service/server.js') },
  { name: 'Analytics Service', port: 5006, script: path.join(__dirname, 'apps/analytics-service/server.js') },
  { name: 'Document Service', port: 5007, script: path.join(__dirname, 'apps/document-service/server.js') },
  { name: 'Product Service', port: 5008, script: path.join(__dirname, 'apps/product-service/server.js') },
  { name: 'Invoice Service', port: 5009, script: path.join(__dirname, 'apps/invoice-service/server.js') },
  { name: 'Ticket Service', port: 5010, script: path.join(__dirname, 'apps/ticket-service/server.js') },
  { name: 'Search Service', port: 5011, script: path.join(__dirname, 'apps/search-service/server.js') },
  { name: 'HR Service', port: 5012, script: path.join(__dirname, 'apps/hr-service/server.js') },
];

const children = [];

console.log('====================================================');
console.log('🚀 Velora CRM - Production Backend Cluster Starting');
console.log('====================================================');

// Spawn all backend microservices
services.forEach((svc) => {
  const child = fork(svc.script, [], {
    env: {
      ...process.env,
      PORT: svc.port
    },
    execArgv: ['--max-old-space-size=48'], // Low memory footprint for Render Free Tier (512MB RAM)
    stdio: 'inherit'
  });

  child.on('error', (err) => {
    console.error(`❌ [${svc.name}] Process error:`, err);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`⚠️ [${svc.name}] Exited with code ${code}`);
    }
  });

  children.push(child);
});

// Give microservices 2.5 seconds to establish DB connections and bind ports before gateway starts
setTimeout(() => {
  console.log(`\n🌐 [Gateway] Launching API Gateway on public PORT: ${GATEWAY_PORT} ...`);
  
  const gateway = fork(path.join(__dirname, 'apps/gateway/server.js'), [], {
    env: {
      ...process.env,
      PORT: GATEWAY_PORT
    },
    execArgv: ['--max-old-space-size=64'],
    stdio: 'inherit'
  });

  gateway.on('error', (err) => {
    console.error('❌ [Gateway] Process error:', err);
  });

  gateway.on('exit', (code) => {
    console.warn(`⚠️ [Gateway] Exited with code ${code}`);
  });

  children.push(gateway);
}, 2500);

// Graceful shutdown handling
const shutdown = () => {
  console.log('\n🛑 Gracefully shutting down all services...');
  children.forEach((child) => {
    try {
      child.kill('SIGTERM');
    } catch (e) {}
  });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

