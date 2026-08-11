const amqp = require('amqplib');
const EventEmitter = require('events');

// In-process event emitter fallback for local dev when RabbitMQ server is not running
const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

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
    console.warn(`[RabbitMQ] Connection failed (${err.message}). Using in-process eventBus fallback.`);
    isConnected = false;
    channel = null;
    return null;
  }
};

/**
 * Publish message to a RabbitMQ queue with fallback support
 */
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
  
  // In-process EventBus broadcast fallback
  try {
    eventBus.emit(queueName, data);
    console.log(`[EventBus Fallback] Dispatched event to in-process bus for queue "${queueName}"`);
  } catch (busErr) {
    console.error(`[EventBus] Error dispatching event: ${busErr.message}`);
  }

  if (typeof fallbackFn === 'function') {
    console.log(`[RabbitMQ] Executing explicit fallback for queue "${queueName}"...`);
    try {
      await fallbackFn();
      return true;
    } catch (fallbackErr) {
      console.error(`[RabbitMQ] Fallback execution failed: ${fallbackErr.message}`);
    }
  }
  return false;
};

/**
 * Subscribe and consume messages from a RabbitMQ queue
 */
const subscribeToQueue = async (queueName, handlerFn) => {
  // Always register in-process fallback listener
  eventBus.on(queueName, async (data) => {
    try {
      await handlerFn(data);
    } catch (err) {
      console.error(`[EventBus Consumer] Error handling event on queue "${queueName}":`, err.message);
    }
  });

  try {
    const ch = await connectRabbitMQ();
    if (ch) {
      await ch.assertQueue(queueName, { durable: true });
      ch.prefetch(1);
      console.log(`[RabbitMQ] Consumer registered for queue "${queueName}"`);

      ch.consume(queueName, async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            await handlerFn(data, msg);
            ch.ack(msg);
          } catch (err) {
            console.error(`[RabbitMQ Consumer] Error processing message from "${queueName}":`, err.message);
            // Acknowledge to prevent infinite stuck queue on bad payloads
            ch.ack(msg);
          }
        }
      });
      return true;
    }
  } catch (err) {
    console.warn(`[RabbitMQ] Failed to attach consumer to "${queueName}": ${err.message}. Using in-process event listener.`);
  }
  return false;
};

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  subscribeToQueue,
  eventBus
};
