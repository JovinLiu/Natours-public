//2.2 User Route Handler
const multer = require('multer');
const sharp = require('sharp');
const User = require('../Models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getAll, getOne, createOne, updateOne, deleteOne } = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const filteredObj = {};
  const inputFields = Object.keys(obj);
  allowedFields.forEach((field) => {
    if (inputFields.includes(field)) {
      filteredObj[field] = obj[field];
    }
  });
  return filteredObj;
};

//上传单张图片
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, callback) => {
  if (file.minetype.startsWith('image')) {
    //null表示不传入错误，true表示接受上传的文件
    callback(null, true);
  } else {
    //new AppError表示传入错误，并且不接受上传的文件
    callback(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  filter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.getAndSetCurrentUser = async (req, res, next) => {
  //create()和Save()的presave middleware会运行，密码会被加密，findByIdAndUpdate不会，所以这里需要
  const currentUser = await User.findById(req.params.id);

  if (!currentUser) return next(new AppError('Cannot find any user with this id', 404));

  req.user = currentUser;

  req.user.name = req.body.name || currentUser.name;
  req.user.email = req.body.email || currentUser.email;
  req.user.photo = req.body.photo || currentUser.photo;
  req.user.role = req.body.role || currentUser.role;
  req.user.active = req.body.active || currentUser.active;

  if (req.body.password) {
    req.user.password = req.body.password;
    req.user.passwordConfirm = req.body.password;
  }
  next();
};

//For Logged-in User
exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('Please update your password through /updateMyPassword', 400));

  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');
  if (req.file) filteredBody.photo = req.file.filename;

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  if (!user) return next('cannot find the user by given id', 404);

  res.status(200).json({
    status: 'success',
  });
});

//For administrator
exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.createUser = createOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);
