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
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com').toLowerCase().trim();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
    
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        designation: 'Chief Administrator',
        department: 'Management'
      });
      console.log(`[Auth-Service] Initial Admin account auto-provisioned: ${adminEmail}`);
    } else {
      admin.email = adminEmail;
      admin.password = adminPassword;
      await admin.save();
      console.log(`[Auth-Service] Admin credentials synced with .env: ${adminEmail}`);
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
    
    app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  }
};

startServer();

