const Booking = require('../Models/bookingModel');
const Tour = require('../Models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.homepage = catchAsync(async (req, res, next) => {
  res.status(200).render('index', {
    title: 'Welcome',
    url: req.url,
  });
});

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'Exciting tours for adventurous people',
    tours,
    url: req.url,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate();

  if (!tour) return next(new AppError('Cannot find any documents with this id', 404));

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    url: req.url,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: `Log into your account`,
  });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
  res.status(200).render('signup', {
    title: `Sign up with Natours`,
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: `Your account`,
  });
});

exports.getResetPassword = catchAsync(async (req, res, next) => {
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${req.params.token}`;

  res.status(200).render('resetPassword', {
    title: `Reset your password`,
    resetUrl,
  });
});

exports.getForgetPassword = catchAsync(async (req, res, next) => {
  res.status(200).render('forgetPassword', {
    title: `Please Provide your email`,
  });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const myBookings = await Booking.find({ user: req.user.id });

  const tours = await Tour.find({ _id: { $in: myBookings.map((el) => el.tour) } });

  res.status(200).render('overview', {
    title: `My Bookings`,
    tours,
  });
});

exports.alerts = catchAsync(async (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert = 'Your booking was successful! Please check your email for confirmation.';
  next();
});
