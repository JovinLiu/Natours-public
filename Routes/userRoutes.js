const express = require('express');

const router = express.Router();
const reviewRouter = require('./reviewRoutes');

/* prettier-ignore */
const {getAllUsers,createUser,getUser,updateUser,deleteUser,getMe,updateMe,deleteMe, getAndSetCurrentUser, uploadUserPhoto, resizeUserPhoto} = require('../Controllers/userController');
/* prettier-ignore */
const {signup,login,restrictTo,forgetPassword,resetPassword,updatePassword,protect, logout} = require('../Controllers/authController');

//Open API for everyone
router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgetPassword').post(forgetPassword);
router.route('/resetPassword/:token').patch(resetPassword);

//Logged-in User Only
router.use(protect);
router.use('/:userId/reviews', reviewRouter);

router.route('/updateMyPassword').patch(updatePassword);
router.route('/me').get(getMe, getUser);
router.route('/updateMe').patch(uploadUserPhoto, resizeUserPhoto, updateMe);
router.route('/deleteMe').delete(deleteMe);

//For administrator
router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(getAndSetCurrentUser, updateUser).delete(deleteUser);

module.exports = router;
