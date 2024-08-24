const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../Models/userModel');
const Email = require('../utils/email');

// sendEmail

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const createSendToken = function (user, req, res, statusCode) {
  const token = signToken(user._id);
  //set cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    // secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  //if its production, need HTTPS
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //set Cookie
  res.cookie('jwt', token, cookieOptions);
  //Don't send user password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const payload = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      const currentUser = await User.findById(payload.id);
      if (!currentUser) return next();
      if (currentUser.isPasswordChangedAfter(payload.iat)) return next();
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  //1. get token from header
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('You are not logged in, please login to get access', 401));
  //2. verify token
  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3. 由于JWT的有效期可以自定义，并且JWT会存在cookie或者localstorage中，如果在token有效期间用户不存在了，token应该是失效的，所以这里要提供一步检查是否用户依然存在的步骤
  const currentUser = await User.findById(payload.id);
  if (!currentUser)
    return next(new AppError('The user belonging to this token does no longer exists.', 401));
  //4. 由于JWT的有效期可以自定义，并且JWT会存在一台计算机的cookie或者localstorage中，如果在token有效期之内用户更换密码，token应该是失效的，所以这里需要对比发布token的时间和上一次修改密码的时间。如果修改时间在发布之前，则通过，如果修改在发布之后，则报错

  if (currentUser.isPasswordChangedAfter(payload.iat))
    return next(
      new AppError('The password has been changed after the json web token is issued', 401),
    );

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not authorized to perform this action', 403));
    }
    next();
  };
};

//Open API for everyone
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  try {
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
  } catch (err) {
    return next(new AppError(`Something went wrong with sending the email: ${err.message}`, 400));
  }

  createSendToken(newUser, req, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1 check if email and password exists
  if (!email || !password) return next(new AppError('Please enter your email and password', 400));
  //2 check if user exists and password correct
  const currentUser = await User.findOne({ email }).select('+password');

  let correct;

  if (currentUser) {
    //return ture or false
    correct = await currentUser.comparePassword(password, currentUser.password);
  }

  //retrun error when no current user or incorrect
  if (!currentUser || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3 if everything is ok send token
  createSendToken(currentUser, req, res, 201);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'goodbye', { expires: new Date(Date.now() + 10000), httpOnly: true });
  res.status(200).json({ status: 'success' });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1 find user by email
  const user = await User.findOne(req.body);

  if (!user) return next(new AppError('cannot find a user by given email', 404));
  //2 generate Token and passwordChangedAt, and store them to document
  const resetToken = await user.createPwdResetToken();
  await user.save({ validateBeforeSave: false });

  //3 send resetURL
  try {
    const url = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;
    await new Email(user, url).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: "Reset token has been sent you user's email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error occurs during sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 get Token from URL
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  //2 Find user by token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired password reset token', 400));

  //3 save new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: true });
  //passwordChangedAt will be set in pre save middleware

  //4 send JWT
  createSendToken(user, req, res, 200);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 get user by user id
  const user = await User.findOne(req.user._id).select('+password');
  //2 compare current password
  const isCorrect = await user.comparePassword(req.body.currentPassword, user.password);
  if (!isCorrect) return next(new AppError('The current password you provided is invalid', 401));
  //3 set new password and save
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save({ validateBeforeSave: true });
  //4 send token
  createSendToken(user, req, res, 200);
});
