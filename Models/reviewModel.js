// review / rating / createdAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'A review must be provided'] },
    rating: { type: Number, max: 5, min: 1, required: [true, 'A Rating must be provided'] },
    createdAt: { type: Date, default: Date.now() },
    //只是一个单独的ID
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    //只是一个单独的ID
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//保证每一个用户只能对一个tour写一个review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  if (this._conditions.tour) this.populate({ path: 'user', select: 'name photo' });
  if (this._conditions.user) this.populate({ path: 'tour', select: 'name' });

  next();
});

///^findOne/ is the short hand of findById, findByIdAndDelete, findByIdAndUpdate. This is why you can use /^findOne/ to filter findById
reviewSchema.pre(/^findOne/, function (next) {
  if (!this._conditions.tour && !this._conditions.user) {
    /* prettier-ignore */
    this.populate({ path: 'user', select: 'name photo' }).populate({path: 'tour', select: 'name'})
  }
  next();
});

//NOTE:实现添加删减review的过程中，评分和评分数量同时变化
//·当添加review时，更新Tour的rating
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    //在所有的review找tourId一致的review
    { $match: { tour: tourId } },
    { $group: { _id: '$tour', ratingsQuantity: { $sum: 1 }, ratingsAverage: { $avg: '$rating' } } },
  ]);

  console.log('stats:', stats);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0] ? stats[0].ratingsAverage : 4.5,
    ratingsQuantity: stats[0] ? stats[0].ratingsQuantity : 0,
  });
};

//Calculation can only occur after the saving, so this is a post middleware.
reviewSchema.post('save', async function () {
  //this 指向当前的document实例，由于Review在这个post middleware之后声明，所以需要调用实例中的constructor才能调用静态方法。
  await this.constructor.calcAverageRatings(this.tour);
});

//·当修改或者删除review时，更新Tour的rating
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.currentReview = await this.findOne(this._conditions);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.currentReview.constructor.calcAverageRatings(this.currentReview.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
