const express = require('express');

//To Allow review route to access tour id if the route is /tours/:tourId/reviews
const router = express.Router({ mergeParams: true });

const {
  getAllReviews,
  createReview,
  getReview,
  updateReview,
  deleteReview,
  setTourUserId,
} = require('../Controllers/reviewController');
const { protect, restrictTo } = require('../Controllers/authController');

router.use(protect);

router.route('/').get(getAllReviews);
router.route('/:id').get(getReview);

router.use(restrictTo('user'));

router.use(setTourUserId);

router.route('/').post(createReview);

router.use(restrictTo('user', 'admin'));

router.route('/:id').patch(updateReview).delete(deleteReview);

module.exports = router;
