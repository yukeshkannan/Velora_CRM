const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');
const { formatResponse, publishToQueue } = require('../../../packages/utils'); 

const formatUserDTO = (user) => {
  const isClient = user.role === 'Client';
  const dto = {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic || ''
  };
  if (!isClient) {
    dto.designation = user.designation;
    dto.department = user.department;
    dto.salary = user.salary;
  }
  return dto;
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return formatResponse(res, 400, 'Name, email, and password are required');
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return formatResponse(res, 400, 'An account with this email already exists');
    }

    const user = await User.create({
      name, 
      email: cleanEmail, 
      password, 
      role: 'Client'
    });

    // Publish event for downstream services (e.g., Contact Service auto-sync)
    await publishToQueue('USER_EVENTS', {
      event: 'USER_REGISTERED',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    formatResponse(res, 201, 'User registered successfully', { userId: user._id, email: user.email, role: user.role });
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return formatResponse(res, 400, 'Please provide email and password');
    }
    const cleanEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.matchPassword(password))) {
      return formatResponse(res, 401, 'Invalid email or password');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Auth Service] JWT_SECRET is not configured');
      return formatResponse(res, 500, 'Authentication service configuration error');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    formatResponse(res, 200, 'Login successful', { 
      token, 
      user: formatUserDTO(user)
    });
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
    const cleanEmail = String(email).toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name,
        email: cleanEmail,
        authProvider: 'google',
        googleId,
        role: 'Client',
        profilePic: picture || ''
      });

      await publishToQueue('USER_EVENTS', {
        event: 'USER_REGISTERED',
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else if (user.authProvider === 'local') {
      user.authProvider = 'google';
      user.googleId = googleId;
      if (!user.profilePic && picture) user.profilePic = picture;
      await user.save();
    }

    const secret = process.env.JWT_SECRET;
    const appToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    formatResponse(res, 200, 'Google Authentication successful', {
      token: appToken,
      user: formatUserDTO(user)
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error);
    formatResponse(res, 500, error.message);
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return formatResponse(res, 400, 'Email address is required');
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Return 200 to prevent user enumeration attacks
      return formatResponse(res, 200, 'If this email is registered, a password reset code has been sent');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const emailSent = await sendOTPEmail(cleanEmail, otp);
    if (emailSent) {
      formatResponse(res, 200, 'Password reset code sent to email');
    } else {
      formatResponse(res, 500, 'Failed to deliver reset email. Please try again later.');
    }
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body || {};

    if (!newPassword || newPassword !== confirmPassword) {
      return formatResponse(res, 400, 'Passwords do not match');
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ 
      email: cleanEmail, 
      resetPasswordOtp: otp, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return formatResponse(res, 400, 'Invalid or expired OTP');
    }

    user.password = newPassword;
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
    const { name, email, password, role, designation, department, salary } = req.body || {};
    
    if (!name || !email || !password) {
      return formatResponse(res, 400, 'Name, email, and password are required');
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return formatResponse(res, 400, 'User already exists');
    }

    const targetRole = role || 'Client';
    const userPayload = {
      name, 
      email: cleanEmail, 
      password, 
      role: targetRole
    };

    if (targetRole !== 'Client') {
      const baseSal = Number(salary?.base) || 0;
      if (!salary || !baseSal || baseSal <= 0) {
        return formatResponse(res, 400, 'Base salary is required for staff members and must be greater than 0');
      }
      userPayload.designation = designation;
      userPayload.department = department;
      userPayload.salary = salary;
    }

    const user = await User.create(userPayload);

    if (user.role === 'Client') {
      await publishToQueue('USER_EVENTS', {
        event: 'USER_REGISTERED',
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    formatResponse(res, 201, 'User created successfully', { userId: user._id, email: user.email, role: user.role });
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const sanitizedUsers = users.map(u => formatUserDTO(u));
    
    res.status(200).json({
        success: true,
        count: sanitizedUsers.length,
        data: sanitizedUsers
    });
  } catch (error) {
    console.error('[Auth Service] Error in getAllUsers:', error.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
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
            data: formatUserDTO(user)
        });
    } catch (error) {
        formatResponse(res, 500, error.message);
    }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const requesterRole = req.user?.role || req.headers['x-user-role'];
    const requesterId = String(req.user?.id || req.user?._id || req.headers['x-user-id'] || '');
    const targetUserId = String(req.params.id);

    // Security Gate: Employees are not authorized to modify user settings or passwords
    if (requesterRole === 'Employee') {
      return formatResponse(res, 403, 'Employees are not authorized to modify user settings or passwords. Please contact your administrator.');
    }

    const { name, email, role, designation, department, salary, profilePic } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return formatResponse(res, 404, 'User not found');
    }

    user.name = name || user.name;
    if (email) user.email = String(email).toLowerCase().trim();
    if (role && (requesterRole === 'Admin' || requesterRole === 'HR')) {
      user.role = role;
    }

    if (user.role !== 'Client') {
      if (designation !== undefined) user.designation = designation;
      if (department !== undefined) user.department = department;
      if (salary !== undefined && (requesterRole === 'Admin' || requesterRole === 'HR')) {
        user.salary = salary;
      }
    } else {
      user.designation = undefined;
      user.department = undefined;
      user.salary = undefined;
    }

    if (profilePic !== undefined) user.profilePic = profilePic;

    if (req.body.password) {
      // Only Admin, HR, or non-employee account owners can update password
      if (requesterRole === 'Admin' || requesterRole === 'HR' || requesterId === targetUserId) {
        user.password = req.body.password;
      } else {
        return formatResponse(res, 403, 'Unauthorized to change user password');
      }
    }

    await user.save();
    formatResponse(res, 200, 'User updated successfully', formatUserDTO(user));
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return formatResponse(res, 404, 'User not found');
    }

    await publishToQueue('USER_EVENTS', {
      event: 'USER_DELETED',
      data: { userId }
    });

    await user.deleteOne();
    formatResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    formatResponse(res, 500, error.message);
  }
};
