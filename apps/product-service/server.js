const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../../packages/database');
const productRoutes = require('./routes/productRoutes');

const { correlationLogger } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(correlationLogger('Product-Service'));
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5008;

const startServer = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
