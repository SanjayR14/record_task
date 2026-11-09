import { config } from '../config/env.js';

/**
 * Centralized Error Handling Middleware
 * Catches all thrown/forwarded errors in routes and formats standard JSON response
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  const response = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  if (!config.isProduction && err.stack) {
    response.stack = err.stack;
  }

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    response.message = `Resource not found with id of ${err.value}`;
    return res.status(404).json(response);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    response.message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json(response);
  }

  res.status(statusCode).json(response);
};

