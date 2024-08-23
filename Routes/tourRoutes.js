const express = require('express');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
// prettier-ignore
const {getAllTours,createTour,getTour,updateTour,deleteTour,aliasTopFiveCheapTours,getTourStats,getMonthlyPlan,getToursWithin,getDistances, uploadTourImages,resizeTourImages } = require('../Controllers/tourController');
const { protect, restrictTo } = require('../Controllers/authController');
const { deleteAllReviewOnOneTour } = require('../Controllers/reviewController');

//Open API for everyone
router.route('/top-5-tours').get(aliasTopFiveCheapTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/').get(getAllTours);
router.route('/:id').get(getTour);
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);

//For Logged-in only
router.use(protect);
router.use('/:tourId/reviews', reviewRouter);
//For admin and lead-guide onlys
router.use(restrictTo('admin', 'lead-guide'));
router.route('/').post(createTour);
router
  .route('/:id')
  .patch(uploadTourImages, resizeTourImages, updateTour)
  .delete(deleteAllReviewOnOneTour, deleteTour);

//For admin and lead-guide only
router.use(restrictTo('admin', 'lead-guide', 'guide'));
router.route('/monthly-plan/:year').get(getMonthlyPlan);

module.exports = router;
