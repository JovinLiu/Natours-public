const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'The role must be user, guide, lead-guide or admin',
    },
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: 8,
    maxLength: 20,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minLength: 8,
    maxLength: 20,
    select: false,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: 'The password must be the same',
    },
  },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  passwordChangedAt: { type: Date, default: undefined },
  active: { type: Boolean, default: true, select: false },
});

//instance method
userSchema.methods.comparePassword = async function (inputPassword, userPassword) {
  return await bcrypt.compare(inputPassword, userPassword);
};

userSchema.methods.isPasswordChangedAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return changedTimestamp > JWTTimestamp;
  }

  return false;
};

userSchema.methods.createPwdResetToken = async function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  //token expires in 10 mins
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return token;
};

//pre save middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.isModified('passwordConfirm') || this.isNew)
    return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//pre find middleware
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
