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

  if (targetUri && serviceName) {
    const formattedName = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_service$/, '');
    const dbName = `crm_${formattedName}_db`;
    
    if (targetUri.includes('/companycrm')) {
      targetUri = targetUri.replace('/companycrm', `/${dbName}`);
    } else {
      const urlParts = targetUri.split('?');
      const basePart = urlParts[0];
      const queryPart = urlParts[1] ? `?${urlParts[1]}` : '';
      
      const lastSlash = basePart.lastIndexOf('/');
      if (lastSlash > 8) {
        const existingDb = basePart.substring(lastSlash + 1);
        if (!existingDb || existingDb === 'test' || existingDb === 'admin') {
          targetUri = basePart.substring(0, lastSlash + 1) + dbName + queryPart;
        }
      } else {
        targetUri = `${basePart}/${dbName}${queryPart}`;
      }
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
