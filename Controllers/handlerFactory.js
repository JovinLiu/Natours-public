const ApiFeature = require('../utils/apiFeature');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');

exports.getAll = function (model) {
  return catchAsync(async (req, res, next) => {
    let filter = {};
    //Get all reviews on a tour: if hits /tours/:id/reviews, then do find(tour: tourId) and retrieve all reviews on one certain tour
    //if not, retrieve all reviews
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    //Get all reviews on a user: if hits /users/:id/reviews, then do find(user: userId) and retrieve all reviews on one certain user
    //if not, retrieve all reviews
    if (req.params.userId) {
      filter = { user: req.params.userId };
    }

    const feature = new ApiFeature(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await feature.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: { docs },
    });
  });
};

exports.getOne = function (model) {
  return catchAsync(async (req, res, next) => {
    const doc = await model.findById(req.params.id);

    if (!doc) return next(new AppError('Cannot find any documents with this id', 404));

    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });
};

exports.createOne = function (model) {
  return catchAsync(async (req, res, next) => {
    const newDoc = await model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { newDoc },
    });
  });
};

exports.updateOne = function (model) {
  return catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) return next(new AppError('Cannot find any documents with this id', 404));

    res.status(200).json({
      status: 'success',
      data: { doc },
    });
  });
};

exports.deleteOne = function (model) {
  return catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new AppError('Cannot find any documents with this id', 404));

    res.status(200).json({
      status: 'success',
    });
  });
};
