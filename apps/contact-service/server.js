const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../../packages/database');
const contactRoutes = require('./routes/contactRoutes');

const { correlationLogger } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Contact-Service'));
app.use('/api/contacts', contactRoutes);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => console.log(`Contact Service running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
