const crypto = require('crypto');

const User = require('../models/user');

const sendToken = require('../utils/jsonWebToken');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res, next) => {
  const { userName, email, password, confirmedPassword } = req.body;

  if (password !== confirmedPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  try {
    const user = await User.create({
      userName,
      email,
      password,
    });

    // Tạo token xác nhận
    const verificationToken = user.createVerificationToken();

    // Lưu token và ngày hết hạn
    await user.save();

    // Gửi email xác nhận
    const verificationUrl = `http://localhost:8000/api/v1/verify/${verificationToken}`;
    const message = `Thank you for registering. Please click on the following link to verify your email address: \n\n${verificationUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Email Verification - Ryzel Store',
      message,
    });

    // Gọi sendToken sau khi gửi email thành công
    sendToken(user, 200, res);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      registerToken: hashedToken,
      registerTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return console.log('Verification token is invalid or expired');
    }

    // Cập nhật isVerified và xóa thông tin token
    user.isVerified = true;
    user.registerToken = undefined;
    user.registerTokenExpiration = undefined;

    await user.save();

    // Gửi thông báo hoặc chuyển hướng đến trang xác nhận thành công
    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    return console.log(error.message);
  }
};

exports.loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password is entered by user
  if (!email || !password) {
    return console.log('Please enter email & password');
  }

  // Find user in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return console.log('Invalid email or password');
  }

  // Check if password is correct
  const isPasswordMatch = await user.checkPassword(password);

  if (!isPasswordMatch) {
    return console.log('Ivalid email or password');
  }

  sendToken(user, 200, res);
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return console.log('Invalid email');
  }

  // Get reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // Create reset password URL
  const resetPasswordUrl = `http://localhost:8000/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is as follow: \n\n${resetPasswordUrl}\n\nIf you haven't requested this email, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: '(no-reply) Password Reset Nintendont account',
      message,
    });

    res.status(200).json({
      success: true,
      message: `Password reset link sent to your email ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return console.log(error.message);
  }
};

exports.resetPassword = async (req, res, next) => {
  // Hash URL token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return console.log('Password reset token is invalid or expired');
  }

  if (req.body.password !== req.body.confirmedPassword) {
    return console.log('Passwords do not match');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  sendToken(user, 200, res);
};
