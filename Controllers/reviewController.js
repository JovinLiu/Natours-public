/* eslint-disable prettier/prettier */
const Review = require('../Models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./handlerFactory');

//This is for user to create a review only, because users don't have to provide tour and user id to the body
exports.setTourUserId = (req, _, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  next();
};

exports.deleteAllReviewOnOneTour = catchAsync(async (req, res, next) => {
  await Review.deleteMany({ tour: req.params.id });
  next();
});

exports.getAllReviews = getAll(Review);
exports.createReview = createOne(Review);
exports.getReview = getOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
