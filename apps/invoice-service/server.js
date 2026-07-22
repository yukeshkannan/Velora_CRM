const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../../packages/database');
const invoiceRoutes = require('./routes/invoiceRoutes');

const { correlationLogger } = require('../../packages/utils');

// Load env vars
dotenv.config();

// Connect to database
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Invoice-Service'));

// Mount routers
app.get('/', (req, res) => res.send("Invoice Service Running"));
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));

const PORT = process.env.PORT || 5009;

const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        console.log("Invoice Database Connected");
        
        const server = app.listen(PORT, () => {
             console.log(`Invoice Service running on port ${PORT}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err, promise) => {
             console.log(`Error: ${err.message}`);
             server.close(() => process.exit(1));
        });

    } catch(err) {
        console.error("Failed to connect to DB:", err);
        process.exit(1);
    }
};

startServer();
