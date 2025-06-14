/**
 * Centralized error handling utilities
 */

// Error types for better categorization
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, type = ErrorTypes.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Environment-aware logger for errors
 */
const logger = {
  error: (message, error = {}, context = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        type: error.type || ErrorTypes.INTERNAL_ERROR
      },
      context
    };
    
    console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
  },
  
  warn: (message, context = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[WARN]', message, context);
    }
  }
};

/**
 * Handles and formats errors for API responses
 * @param {Error} error - The error to handle
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleError = (error, req, res, next) => {
  // Log the error with context
  logger.error('API Error occurred', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.uid
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let type = ErrorTypes.INTERNAL_ERROR;
  let details = null;

  // Handle different error types
  if (error instanceof APIError) {
    statusCode = error.statusCode;
    message = error.message;
    type = error.type;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    type = ErrorTypes.VALIDATION_ERROR;
    details = error.details;
  } else if (error.code === 'auth/invalid-id-token') {
    statusCode = 401;
    message = 'Invalid authentication token';
    type = ErrorTypes.AUTHENTICATION_ERROR;
  } else if (error.code === 'auth/user-not-found') {
    statusCode = 404;
    message = 'User not found';
    type = ErrorTypes.NOT_FOUND_ERROR;
  } else if (error.code === 'permission-denied') {
    statusCode = 403;
    message = 'Permission denied';
    type = ErrorTypes.AUTHORIZATION_ERROR;
  }

  // Prepare response
  const response = {
    success: false,
    error: {
      type,
      message: process.env.NODE_ENV === 'production' && statusCode === 500 
        ? 'Internal Server Error' 
        : message,
      timestamp: new Date().toISOString()
    }
  };

  // Add details in development or for client errors
  if ((process.env.NODE_ENV !== 'production' || statusCode === 500) && details) {
    response.error.details = details;
  }

  // Add stack trace in development for server errors
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.error.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Creates validation error
 * @param {string} message - Error message
 * @param {Array} errors - Array of validation errors
 * @returns {APIError} - Validation error instance
 */
const createValidationError = (message, errors = []) => {
  return new APIError(message, 400, ErrorTypes.VALIDATION_ERROR, errors);
};

/**
 * Creates not found error
 * @param {string} resource - Name of the resource not found
 * @returns {APIError} - Not found error instance
 */
const createNotFoundError = (resource = 'Resource') => {
  return new APIError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND_ERROR);
};

/**
 * Creates authorization error
 * @param {string} message - Error message
 * @returns {APIError} - Authorization error instance
 */
const createAuthorizationError = (message = 'Access denied') => {
  return new APIError(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
};

module.exports = {
  APIError,
  ErrorTypes,
  handleError,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createAuthorizationError,
  logger
}; 