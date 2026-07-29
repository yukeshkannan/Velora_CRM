const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../../packages/database');
// Opportunity Service Entrypoint
const opportunityRoutes = require('./routes/opportunityRoutes');

const { correlationLogger } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Opportunity-Service'));

app.use('/api/opportunities', opportunityRoutes);

const PORT = process.env.PORT || 5003;

const startServer = async () => {
    try {
        await connectDB(process.env.OPPORTUNITY_MONGO_URI || process.env.MONGO_URI, 'opportunity-service');
        app.listen(PORT, () => console.log(`Opportunity Service running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Opportunity Service Entrypoint - Reloaded v2
startServer();
