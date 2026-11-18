const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('database');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');
const { correlationLogger } = require('../../packages/utils');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(correlationLogger('Auth-Service'));

app.use('/api/auth', authRoutes);

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL ? process.env.DEFAULT_ADMIN_EMAIL.toLowerCase().trim() : null;
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return;
    }
    
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        designation: 'Chief Administrator',
        department: 'Management'
      });
      console.log(`[Auth-Service] Initial Admin account provisioned: ${adminEmail}`);
    }
  } catch (err) {
    console.error('[Auth-Service] Failed to seed default admin:', err.message);
  }
};

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB(process.env.AUTH_MONGO_URI || process.env.MONGO_URI, 'auth-service');
    await seedAdminUser();
    
    app.listen(PORT, () => console.log(`[Auth-Service] Operational on port ${PORT}`));
  } catch (err) {
    console.error('[Auth-Service] Startup failed:', err);
    process.exit(1);
  }
};

startServer();
