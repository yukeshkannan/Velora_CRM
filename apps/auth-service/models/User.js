const { mongoose } = require('database');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return this.authProvider === 'local'; } },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, unique: true, sparse: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Employee', 'Sales', 'HR', 'Client'], 
    default: 'Client' 
  },
  designation: { type: String },
  department: { type: String },
  joiningDate: { type: Date, default: Date.now },
  salary: {
    base: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 }
  },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  profilePic: { type: String, default: '' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
