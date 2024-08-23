const express = require('express');
const {
  homepage,
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getResetPassword,
  getForgetPassword,
} = require('../Controllers/viewController');
const { isLoggedIn, protect } = require('../Controllers/authController');

const router = express.Router();

router.route('/').get(homepage);
router.route('/forgetPassword').get(getForgetPassword);
router.route('/resetPassword/:token').get(getResetPassword);
router.route('/tours').get(isLoggedIn, getOverview);
router.route('/tour/:slug').get(isLoggedIn, getTour);
router.route('/login').get(isLoggedIn, getLoginForm);
router.route('/me').get(protect, getAccount);

module.exports = router;
