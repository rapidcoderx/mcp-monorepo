/**
 * @fileoverview Logging middleware
 * @module @mcp/core/middleware
 */

/**
 * Simple logger utility
 */
export class Logger {
  /**
   * @param {Object} config - Logger configuration
   * @param {string} [config.level='info'] - Log level
   * @param {boolean} [config.timestamp=true] - Include timestamps
   */
  constructor(config = {}) {
    this.level = config.level || 'info';
    this.timestamp = config.timestamp !== false;
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
  }

  /**
   * Get formatted timestamp
   * @private
   * @returns {string}
   */
  _getTimestamp() {
    return this.timestamp ? `[${new Date().toISOString()}] ` : '';
  }

  /**
   * Check if log level should be output
   * @private
   * @param {string} level - Log level to check
   * @returns {boolean}
   */
  _shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Additional metadata
   */
  error(message, meta) {
    if (this._shouldLog('error')) {
      console.error(`${this._getTimestamp()}[ERROR] ${message}`, meta || '');
    }
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta) {
    if (this._shouldLog('warn')) {
      console.error(`${this._getTimestamp()}[WARN] ${message}`, meta || '');
    }
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta) {
    if (this._shouldLog('info')) {
      console.error(`${this._getTimestamp()}[INFO] ${message}`, meta || '');
    }
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta) {
    if (this._shouldLog('debug')) {
      console.error(`${this._getTimestamp()}[DEBUG] ${message}`, meta || '');
    }
  }
}

/**
 * Create request logging middleware
 * @param {Logger} logger - Logger instance
 * @returns {Function} Middleware function
 */
export function createRequestLogger(logger) {
  return async (req, next) => {
    const start = Date.now();
    logger.info(`Incoming request: ${req.method}`);

    try {
      const result = await next();
      const duration = Date.now() - start;
      logger.info(`Request completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Request failed after ${duration}ms:`, error.message);
      throw error;
    }
  };
}
