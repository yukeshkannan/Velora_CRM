const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Contact = require('../../contact-service/models/Contact');
const { sendOTPEmail } = require('../utils/emailService');
const { formatResponse } = require('utils'); 

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, designation, department } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return formatResponse(res, 400, 'User already exists');
    }

    // Force role to be Employee for public registration
    const user = await User.create({
      name, 
      email, 
      password, 
      role: 'Client', 
      designation, 
      department
    });

    // Auto-create CRM Contact profile for Client users
    if (user.role === 'Client') {
      try {
        await Contact.create({
          name: user.name,
          email: user.email,
          company: user.department || 'Independent',
          status: 'Customer'
        });
        console.log(`[Auth Service] Auto-created CRM contact for registered client: ${user.email}`);
      } catch (contactErr) {
        console.error("[Auth Service] Failed to auto-create contact on register:", contactErr.message);
      }
    }

    formatResponse(res, 201, 'User registered successfully', { userId: user._id, email: user.email, role: user.role });
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Developer Offline Fallback: If DB DNS/Atlas is offline, allow bypass using seed credentials
    const { mongoose } = require('database');
    if (mongoose.connection.readyState !== 1) {
      console.log('[Auth Service] Database offline. Using local developer fallback...');
      if (email === 'admin@company.com' && password === 'admin123') {
        const token = jwt.sign({ id: '65beefc1d9b3a5a7d7f7a111', role: 'Admin', email: 'admin@company.com' }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '1d' });
        return formatResponse(res, 200, 'Login successful (Offline Bypass)', { 
          token, 
          user: {
            id: '65beefc1d9b3a5a7d7f7a111',
            name: 'Offline Admin User',
            email: 'admin@company.com',
            role: 'Admin',
            profilePic: ''
          }
        });
      } else if (email === 'employee@company.com' && password === 'employee123') {
        const token = jwt.sign({ id: '65beefc1d9b3a5a7d7f7a222', role: 'Employee', email: 'employee@company.com' }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '1d' });
        return formatResponse(res, 200, 'Login successful (Offline Bypass)', { 
          token, 
          user: {
            id: '65beefc1d9b3a5a7d7f7a222',
            name: 'Offline Employee User',
            email: 'employee@company.com',
            role: 'Employee',
            profilePic: ''
          }
        });
      } else {
        return formatResponse(res, 401, 'Invalid email or password (Database is offline)');
      }
    }

    const user = await User.findOne({ email });

    // Login User - Update Response
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
      formatResponse(res, 200, 'Login successful', { 
        token, 
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation,
          department: user.department,
          profilePic: user.profilePic
        }
      });
    } else {
      formatResponse(res, 401, 'Invalid email or password');
    }
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Google Login / Signup
exports.googleLogin = async (req, res) => {
  try {
    const { token: idToken } = req.body;
    if (!idToken) {
      return formatResponse(res, 400, 'Google token is required');
    }

    // Verify token with Google API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      return formatResponse(res, 401, 'Invalid Google token');
    }
    const payload = await response.json();

    const { email, name, sub: googleId, picture } = payload;

    // Find or create user (case-insensitive email matching)
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!user) {
      // Create new user with default Client role
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        googleId,
        role: 'Client',
        profilePic: picture || ''
      });
      console.log(`[Google Auth] Created new client user: ${email}`);

      // Auto-create CRM Contact profile for new Google registered clients
      try {
        await Contact.create({
          name: user.name,
          email: user.email,
          company: 'Independent',
          status: 'Customer'
        });
        console.log(`[Google Auth] Auto-created CRM contact for Google client: ${email}`);
      } catch (contactErr) {
        console.error("[Google Auth] Failed to auto-create contact on Google login:", contactErr.message);
      }
    } else {
      // Link Google account if it exists locally but didn't have googleId linked
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
        user.googleId = googleId;
        if (!user.profilePic && picture) user.profilePic = picture;
        await user.save();
        console.log(`[Google Auth] Linked existing local user to Google: ${email}`);
      }
    }

    // Generate JWT token
    const appToken = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    formatResponse(res, 200, 'Google Authentication successful', {
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error);
    formatResponse(res, 500, error.message);
  }
};


// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return formatResponse(res, 404, 'User not found');

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("DEBUG OTP:", otp); // Log OTP for testing
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const emailSent = await sendOTPEmail(email, otp);
    if (emailSent) {
      formatResponse(res, 200, 'OTP sent to email');
    } else {
      formatResponse(res, 500, 'Failed to send email');
    }
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return formatResponse(res, 400, 'Passwords do not match');
    }

    const user = await User.findOne({ 
      email, 
      resetPasswordOtp: otp, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return formatResponse(res, 400, 'Invalid or expired OTP');
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    formatResponse(res, 200, 'Password reset successfully');
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Create User (Admin Only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, designation, department, salary } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return formatResponse(res, 400, 'User already exists');
    }

    const user = await User.create({
      name, 
      email, 
      password, 
      role, 
      designation, 
      department,
      salary // Add salary
    });

    formatResponse(res, 201, 'User created successfully', { userId: user._id, email: user.email, role: user.role });
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    // Attempt simple find

    const users = await User.find({});
    console.log(`Found ${users ? users.length : 0} users`);
    
    // Direct response to debug
    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
  } catch (error) {
    console.error("Error in getAllUsers [DEBUG]:", error);
    // Direct error response
    res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack
    });
  }
};

// Get Single User By ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return formatResponse(res, 404, 'User not found');
        }
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                designation: user.designation,
                department: user.department,
                salary: user.salary,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        formatResponse(res, 500, error.message);
    }
};

// Update User (Admin Only or Self if allowed)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, designation, department, salary, profilePic } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return formatResponse(res, 404, 'User not found');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.designation = designation || user.designation;
    user.department = department || user.department;
    if (salary) user.salary = salary;
    if (profilePic !== undefined) user.profilePic = profilePic; // Update profilePic

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();
    formatResponse(res, 200, 'User updated successfully', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        salary: user.salary,
        profilePic: user.profilePic
    });
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return formatResponse(res, 404, 'User not found');
    }

    await user.deleteOne();
    formatResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};
