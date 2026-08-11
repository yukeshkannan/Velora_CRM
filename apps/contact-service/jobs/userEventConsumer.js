const Contact = require('../models/Contact');
const { subscribeToQueue } = require('../../../packages/utils');

const startUserEventConsumer = () => {
  subscribeToQueue('USER_EVENTS', async (payload) => {
    try {
      const { event, data } = payload || {};
      
      if (event === 'USER_REGISTERED' && data) {
        const { name, email, role } = data;
        
        // Auto-create contact profile only for Client accounts
        if (role === 'Client' && email) {
          const cleanEmail = email.toLowerCase().trim();
          const existingContact = await Contact.findOne({ email: cleanEmail });
          
          if (!existingContact) {
            await Contact.create({
              name: name || 'New Client',
              email: cleanEmail,
              company: 'Independent',
              status: 'Customer'
            });
            console.log(`[Contact-Service] [RabbitMQ Event] Auto-created CRM contact for client: ${cleanEmail}`);
          } else {
            console.log(`[Contact-Service] [RabbitMQ Event] Contact already exists for: ${cleanEmail}`);
          }
        }
      }
    } catch (err) {
      console.error('[Contact-Service] Error processing USER_EVENTS:', err.message);
    }
  });
};

module.exports = startUserEventConsumer;
