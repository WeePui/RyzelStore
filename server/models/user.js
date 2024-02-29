const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jsonWebToken = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Name is required'],
    maxLength: [30, 'Your naem cannot exceed 30 characters'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Your password must be at least 6 characters long'],
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  registerToken: String,
  registerTokenExpiration: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getJSONWebToken = function () {
  return jsonWebToken.sign(
    {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    }
  );
};

userSchema.methods.createPasswordResetToken = function () {
  // Create token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expires time
  this.resetPasswordExpires = Date.now() + 3600000;

  return resetToken;
};

userSchema.methods.createVerificationToken = function () {
  // Tạo token xác nhận
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash và lưu vào registerToken
  this.registerToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Lưu ngày hết hạn
  this.registerTokenExpiration = Date.now() + 3600000;

  return verificationToken;
};

module.exports = mongoose.model('User', userSchema);
