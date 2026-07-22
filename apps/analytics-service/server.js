const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const analyticsRoutes = require('./routes/analyticsRoutes');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Analytics-Service'));

// Mount routers
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
