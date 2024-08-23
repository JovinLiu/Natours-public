const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      //mongoose validator
      required: [true, 'A tour must have a name'],
      maxLength: [40, 'A tour name must have less than or equal to 40 characters'],
      minLength: [10, 'A tour name must have more than or equal to 10 characters'],
    },
    slug: { type: String, validate: [validator.isAlpha, 'Tour name must only contain characters'] },
    duration: {
      type: Number,
      //mongoose validator
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      //mongoose validator
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      //mongoose validator
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //mongoose validator
      min: [1, 'A rating must be higher than 1'],
      max: [5, 'A rating must not be higher than 5'],
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      //mongoose validator
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //mongoose validator
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regularr price',
      },
    },
    summary: {
      type: String,
      trim: true,
      //mongoose validator
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      //mongoose validator
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    //一个位置
    startLocation: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      address: String,
      description: String,
    },
    //一系列位置，所以是数组
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //这个是一个数组，因为有很多guides
    //Child Referencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({
  startLocation: '2dsphere',
});

//virtual field
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate
//virtual populate的意思是创建一个虚拟的review field，并填充内容，匹配的要求是：要到Review Model中的foreigh Field的tour中去找，和local field（tour）中的_id一致的document
//This is Parent Referencing
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//·document middleware: 在保存之前插入slug，在保存前log：“will save document”，在保存后log：doc
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//·query middleware: 在find query执行前不显示secretTour，并且插入query的时间。在query执行完后计算query所需的时间，log docs
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = new Date();
  next();
});

//对于get all tour 不显示guides和reviews，详细查看单个tour时，进行populate
tourSchema.pre(/^findOne/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  this.populate('reviews');
  next();
});

tourSchema.pre('findOneAndDelete', (next) => {
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`This query takes ${Date.now() - this.start} ms`);
  next();
});

//·aggregate middleware: 在aggregate中排出掉secretTour
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: false } });

  // console.log(this.pipeline());

  if (this.pipeline()[1].$geoNear) {
    this.pipeline().shift();
  }

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
