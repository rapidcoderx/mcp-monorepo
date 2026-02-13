/**
 * @fileoverview Error handling middleware
 * @module @mcp/core/middleware
 */

/**
 * Standard error response
 * @typedef {Object} ErrorResponse
 * @property {boolean} isError - Always true
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {Object} [details] - Additional error details
 */

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return {
        isError: true,
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  };
}

/**
 * Create user-friendly error messages
 * @param {Error} error - Original error
 * @returns {ErrorResponse}
 */
export function formatError(error) {
  const errorMap = {
    ENOTFOUND: 'Network error: Could not reach the service',
    ECONNREFUSED: 'Connection refused: Service is not available',
    ETIMEDOUT: 'Request timeout: Service took too long to respond',
    UNAUTHORIZED: 'Authentication failed: Invalid credentials',
    FORBIDDEN: 'Access denied: Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Invalid input parameters',
  };

  return {
    isError: true,
    code: error.code || 'UNKNOWN_ERROR',
    message: errorMap[error.code] || error.message,
    details: error.details,
  };
}

/**
 * Validate function parameters against a schema
 * @param {Object} params - Parameters to validate
 * @param {Object} schema - JSON Schema for validation
 * @throws {Error} If validation fails
 */
export function validateParams(params, schema) {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }

  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in params)) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }
  }

  return true;
}
