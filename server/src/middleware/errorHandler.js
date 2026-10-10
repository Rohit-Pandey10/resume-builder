export const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Body parser syntax error (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  // Body parser entity too large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Payload too large';
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(', ');
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // Structured error logging (route, status, duration) - never secrets, tokens, or resumes
  const duration = req._startTime ? Date.now() - req._startTime : 0;
  console.error(
    JSON.stringify({
      level: 'error',
      status: statusCode,
      route: req.originalUrl || req.url || 'unknown',
      durationMs: duration,
      error: message
    })
  );

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
