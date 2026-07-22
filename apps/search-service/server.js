const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const searchRoutes = require('./routes/searchRoutes');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Search-Service'));

// Mount routers
app.use('/api/search', searchRoutes);

const PORT = process.env.PORT || 5011;

const server = app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
});
