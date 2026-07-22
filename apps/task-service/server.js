const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../../packages/database');
const taskRoutes = require('./routes/taskRoutes');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Task-Service'));

// Mount routers
app.use('/api/tasks', taskRoutes);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    
    const server = app.listen(PORT, () => {
      console.log(`Task Service running on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();
