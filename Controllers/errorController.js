const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  console.log(req.originalUrl);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  console.error(err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message,
  });
};

const sendErrorPro = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    console.error('Error on the server', err);
    return res.status(500).json({
      status: 'error',
      message: 'Non-operational error, something went wrong!',
    });
  }

  if (err.isOperational) {
    console.error(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
    });
  }
  console.error('Error on the server', err);
  return res.status(500).render('error', {
    title: 'Something went wrong',
    message: 'Something went wrong, please try it later',
  });
};

function handleCastErrorDB(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 404);
}

function handleDuplicatedFieldsDB(err) {
  return new AppError(
    `Duplicated field value: ${err.keyValue.name}. Please use another value!`,
    400,
  );
}

function handleValidationErrorDB(err) {
  const message = Object.values(err.errors)
    .map((el) => el.message)
    .join(', ');
  return new AppError(`${message}.`, 400);
}

function handleInvalidJWTError() {
  return new AppError('Invalid json web token, please log in to get access', 401);
}

function handleJWTExpireError() {
  return new AppError('Token Expired, please login agian', 401);
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';
  //在development模式下：尽可能发送信息
  //在production模式下：如果是operational error（用户犯的错，就把信息都发给用户），如果不是用户犯的错，只发送通用信息，并且需要重构以下几个信息
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicatedFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleInvalidJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorPro(error, req, res);
  }
};
