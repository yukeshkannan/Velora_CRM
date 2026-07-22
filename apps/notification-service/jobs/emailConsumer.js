const amqp = require('amqplib');
const { sendEmail } = require('../utils/emailProvider');

const startEmailConsumer = async () => {
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queueName = 'email_notifications';
  
  try {
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    
    await channel.assertQueue(queueName, { durable: true });
    console.log(`[Notification Service] Listening for email notifications on queue "${queueName}"`);
    
    channel.prefetch(1);
    
    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const { to, subject, message } = JSON.parse(msg.content.toString());
          console.log(`[Notification Service] Received message for: ${to}`);
          
          // Send Email
          const result = await sendEmail(to, subject, `<p>${message}</p>`);
          
          if (result) {
            channel.ack(msg);
            console.log(`[Notification Service] Successfully processed and acknowledged message for: ${to}`);
          } else {
            console.warn(`[Notification Service] Failed to send email, requeuing message...`);
            // Wait 5 seconds before requeuing to prevent rapid loops if mail server is down
            setTimeout(() => {
              try {
                channel.nack(msg, false, true); // Requeue = true
              } catch (e) {
                console.error('[Notification Service] Error requeuing message:', e.message);
              }
            }, 5000);
          }
        } catch (err) {
          console.error('[Notification Service] Error processing message payload:', err.message);
          channel.nack(msg, false, false); // Do not requeue corrupted payloads
        }
      }
    });
    
    connection.on('error', (err) => {
      console.error('[Notification Service] Connection error:', err.message);
      setTimeout(startEmailConsumer, 10000);
    });
    
    connection.on('close', () => {
      console.warn('[Notification Service] Connection closed, reconnecting in 10s...');
      setTimeout(startEmailConsumer, 10000);
    });
    
  } catch (err) {
    console.warn(`[Notification Service] RabbitMQ not available: ${err.message}. Running without RabbitMQ consumer.`);
  }
};

module.exports = startEmailConsumer;
