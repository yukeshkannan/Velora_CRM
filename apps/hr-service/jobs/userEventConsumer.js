const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { subscribeToQueue } = require('../../../packages/utils');

const startUserEventConsumer = () => {
  subscribeToQueue('USER_EVENTS', async (payload) => {
    try {
      const { event, data } = payload || {};
      
      if (event === 'USER_DELETED' && data && data.userId) {
        const userId = data.userId;
        
        const leaveResult = await Leave.deleteMany({ userId });
        const attendanceResult = await Attendance.deleteMany({ userId });
        
        console.log(`[HR-Service] [RabbitMQ Event] Cascade cleaned records for deleted user: ${userId}. Leaves: ${leaveResult.deletedCount || 0}, Attendance: ${attendanceResult.deletedCount || 0}`);
      }
    } catch (err) {
      console.error('[HR-Service] Error processing USER_EVENTS:', err.message);
    }
  });
};

module.exports = startUserEventConsumer;
