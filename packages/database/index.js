const mongoose = require('mongoose');

/**
 * Production Database Connection Manager
 * Establishes a persistent, pooled Mongoose connection per microservice.
 *
 * @param {string} uri - MongoDB connection URI
 * @param {string} serviceName - Microservice name identifier
 */
const connectDB = async (uri, serviceName = 'Service') => {
  let targetUri = uri;

  // If URI is provided, ensure a clean database is targeted.
  // Preserves specified database (e.g. /companycrm) across all services so cross-collection references
  // (such as Leave -> User, Attendance -> User, Ticket -> User/Contact) resolve seamlessly without orphan records.
  if (targetUri) {
    const urlParts = targetUri.split('?');
    const basePart = urlParts[0];
    const queryPart = urlParts[1] ? `?${urlParts[1]}` : '';
    
    const lastSlash = basePart.lastIndexOf('/');
    if (lastSlash <= 8) {
      targetUri = `${basePart}/companycrm${queryPart}`;
    }
  }

  if (!targetUri) {
    const errorMsg = `[${serviceName}] MongoDB connection URI is missing. Ensure MONGO_URI is set in .env`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
  };

  try {
    const conn = await mongoose.connect(targetUri, connectionOptions);
    console.log(`[${serviceName}] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error(`[${serviceName}] MongoDB connection error:`, err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[${serviceName}] MongoDB disconnected. Reconnection will be attempted automatically.`);
    });

    return conn;
  } catch (error) {
    console.error(`[${serviceName}] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB, mongoose };
