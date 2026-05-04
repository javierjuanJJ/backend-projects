// src/middlewares/errorHandler.js

/**
 * Global Express error handler.
 * Must be registered LAST: app.use(errorHandler)
 * Never expose stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500
  const message = err.message ?? 'Internal server error'

  // Log for observability (never log Authorization header value)
  console.error({
    status,
    method: req.method,
    path: req.path,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })

  return res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}
