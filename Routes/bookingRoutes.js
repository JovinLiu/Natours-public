const express = require('express');
const { getCheckoutSession } = require('../Controllers/bookingController');
const { protect } = require('../Controllers/authController');

const router = express.Router();

router.use(protect);

router.route('/checkout-session/:tourId').get(getCheckoutSession);

module.exports = router;
