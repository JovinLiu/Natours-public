const express = require('express');
const {
  homepage,
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getAccount,
  getResetPassword,
  getForgetPassword,
  getMyBookings,
} = require('../Controllers/viewController');
const { isLoggedIn, protect } = require('../Controllers/authController');
const { createBookingCheckout } = require('../Controllers/bookingController');

const router = express.Router();

router.route('/').get(homepage);
router.route('/tours').get(createBookingCheckout, isLoggedIn, getOverview);
router.route('/forgetPassword').get(getForgetPassword);
router.route('/resetPassword/:token').get(getResetPassword);
router.route('/tour/:slug').get(isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLoginForm);
router.route('/signup').get(isLoggedIn, getSignupForm);
router.route('/me').get(protect, getAccount);
router.route('/me/bookings').get(protect, getMyBookings);

module.exports = router;
