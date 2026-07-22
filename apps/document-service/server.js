const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const documentRoutes = require('./routes/documentRoutes');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use(correlationLogger('Document-Service'));

// Mount routers
app.use('/api/documents', documentRoutes);

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`Document Service running on port ${PORT}`);
});
