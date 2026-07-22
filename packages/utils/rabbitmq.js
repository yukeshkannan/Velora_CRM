const amqp = require('amqplib');

let connection = null;
let channel = null;
let isConnected = false;

const connectRabbitMQ = async () => {
  if (isConnected && channel) {
    return channel;
  }
  
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  try {
    connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    isConnected = true;
    console.log(`[RabbitMQ] Connected successfully to ${rabbitUrl}`);
    
    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      isConnected = false;
      channel = null;
    });
    
    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed.');
      isConnected = false;
      channel = null;
    });
    
    return channel;
  } catch (err) {
    console.warn(`[RabbitMQ] Connection failed: ${err.message}. Using fallback.`);
    isConnected = false;
    channel = null;
    return null;
  }
};

const publishToQueue = async (queueName, data, fallbackFn) => {
  try {
    const ch = await connectRabbitMQ();
    if (ch) {
      await ch.assertQueue(queueName, { durable: true });
      const msg = JSON.stringify(data);
      ch.sendToQueue(queueName, Buffer.from(msg), { persistent: true });
      console.log(`[RabbitMQ] Published message to queue "${queueName}"`);
      return true;
    }
  } catch (err) {
    console.error(`[RabbitMQ] Error publishing message: ${err.message}`);
  }
  
  if (typeof fallbackFn === 'function') {
    console.log(`[RabbitMQ] Executing fallback for queue "${queueName}"...`);
    try {
      await fallbackFn();
      return true;
    } catch (fallbackErr) {
      console.error(`[RabbitMQ] Fallback execution failed: ${fallbackErr.message}`);
    }
  }
  return false;
};

module.exports = {
  connectRabbitMQ,
  publishToQueue
};
