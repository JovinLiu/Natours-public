const express = require('express');
const {
  getCheckoutSession,
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../Controllers/bookingController');
const { protect, restrictTo } = require('../Controllers/authController');

const router = express.Router();

router.use(protect);

router.route('/checkout-session/:tourId').get(getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;
