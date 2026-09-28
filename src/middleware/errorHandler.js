const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  logger.error(
    {
      err: {
        message: err.message,
        stack: isDev ? err.stack : undefined,
        code: err.code
      },
      path: req.originalUrl,
      method: req.method
    },
    'Unhandled server error'
  );

  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
}

module.exports = errorHandler;
