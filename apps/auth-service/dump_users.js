const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'name email role authProvider googleId');
    console.log("=== DB USERS DUMP ===");
    console.log(JSON.stringify(users, null, 2));
    console.log("=====================");
  } catch (error) {
    console.error("Dump failed:", error);
  } finally {
    process.exit();
  }
};

run();
