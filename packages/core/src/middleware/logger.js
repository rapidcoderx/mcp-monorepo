/**
 * @fileoverview Winston-based logging middleware for MCP servers.
 *
 * All transports write to **stderr** by default because MCP stdio transport
 * reserves stdout for JSON-RPC messages. Using stdout for logs would corrupt
 * the protocol stream.
 *
 * @module @mcp/core/middleware
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * Custom format that produces human-readable lines on stderr.
 * Example: `2025-01-15T10:30:00.000Z [INFO] [echo-server] Server started {"port":3000}`
 */
const readableFormat = printf(({ timestamp: ts, level, message, component, ...meta }) => {
  const comp = component ? ` [${component}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level.toUpperCase()}]${comp} ${message}${metaStr}`;
});

/**
 * Build the array of winston transports from a config object.
 *
 * @param {Object} config
 * @param {boolean} [config.json=false] - Use JSON format instead of readable text
 * @param {boolean} [config.colorize=false] - Colorize console output
 * @param {string}  [config.logFile] - Path to a log file (JSON format, appended)
 * @param {string}  [config.errorFile] - Path to an error-only log file
 * @returns {winston.transport[]}
 */
function buildTransports(config = {}) {
  const transports = [];

  // Console transport — always writes to stderr so stdout stays clean for MCP stdio
  const consoleFormats = [timestamp(), errors({ stack: true })];
  if (config.colorize) {
    consoleFormats.push(colorize());
  }
  consoleFormats.push(config.json ? json() : readableFormat);

  transports.push(
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      format: combine(...consoleFormats),
    }),
  );

  // Optional combined log file (JSON for easy parsing)
  if (config.logFile) {
    transports.push(
      new winston.transports.File({
        filename: config.logFile,
        format: combine(timestamp(), errors({ stack: true }), json()),
      }),
    );
  }

  // Optional error-only file
  if (config.errorFile) {
    transports.push(
      new winston.transports.File({
        filename: config.errorFile,
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json()),
      }),
    );
  }

  return transports;
}

/**
 * Winston-backed logger with the same public interface as the previous
 * custom Logger (drop-in replacement).
 *
 * Extra capabilities:
 * - Structured JSON metadata in every log line
 * - Optional file transports
 * - Child loggers via {@link Logger#child}
 *
 * @example
 * const logger = new Logger({ level: 'debug', component: 'echo-server' });
 * logger.info('Server started', { port: 3000 });
 * const toolLogger = logger.child({ component: 'tool:echo' });
 * toolLogger.debug('Handling request', { text: 'hello' });
 */
export class Logger {
  /**
   * @param {Object}  [config={}] - Logger configuration
   * @param {string}  [config.level='info'] - Minimum log level (error | warn | info | debug)
   * @param {string}  [config.component] - Component name added to every message
   * @param {boolean} [config.json=false] - Emit JSON-formatted lines instead of readable text
   * @param {boolean} [config.colorize=false] - Colorize console output
   * @param {string}  [config.logFile] - Path to a combined log file
   * @param {string}  [config.errorFile] - Path to an error-only log file
   */
  constructor(config = {}) {
    this._component = config.component || undefined;

    /** @type {winston.Logger} */
    this._winston = winston.createLogger({
      level: config.level || 'info',
      defaultMeta: this._component ? { component: this._component } : {},
      transports: buildTransports(config),
    });
  }

  /**
   * Create a child logger that inherits this logger's configuration
   * and adds additional default metadata.
   *
   * @param {Object} meta - Default metadata for the child (e.g. `{ component: 'tool:echo' }`)
   * @returns {Logger} A new Logger whose internal winston instance is a child of this one
   */
  child(meta) {
    const childLogger = Object.create(Logger.prototype);
    childLogger._component = meta.component || this._component;
    childLogger._winston = this._winston.child(meta);
    return childLogger;
  }

  /**
   * Log an error message.
   * @param {string} message
   * @param {Object|string} [meta] - Additional metadata or simple string detail
   */
  error(message, meta) {
    this._winston.error(message, this._normalizeMeta(meta));
  }

  /**
   * Log a warning message.
   * @param {string} message
   * @param {Object|string} [meta]
   */
  warn(message, meta) {
    this._winston.warn(message, this._normalizeMeta(meta));
  }

  /**
   * Log an informational message.
   * @param {string} message
   * @param {Object|string} [meta]
   */
  info(message, meta) {
    this._winston.info(message, this._normalizeMeta(meta));
  }

  /**
   * Log a debug message.
   * @param {string} message
   * @param {Object|string} [meta]
   */
  debug(message, meta) {
    this._winston.debug(message, this._normalizeMeta(meta));
  }

  /**
   * Normalize the optional meta argument.
   * Previous callers sometimes passed a plain string as the second arg
   * (e.g. `logger.error('failed:', error.message)`). We coerce that into
   * an object so winston doesn't silently discard it.
   *
   * @private
   * @param {*} meta
   * @returns {Object|undefined}
   */
  _normalizeMeta(meta) {
    if (meta === undefined || meta === null || meta === '') {
      return undefined;
    }
    if (typeof meta === 'string') {
      return { detail: meta };
    }
    if (meta instanceof Error) {
      return { error: meta.message, stack: meta.stack };
    }
    return meta;
  }
}

/**
 * Convenience factory for creating a Logger.
 *
 * @param {Object} [config] - Same options as {@link Logger} constructor
 * @returns {Logger}
 */
export function createLogger(config) {
  return new Logger(config);
}

/**
 * Create request logging middleware.
 *
 * @param {Logger} logger - Logger instance
 * @returns {Function} Middleware function `(req, next) => Promise<result>`
 */
export function createRequestLogger(logger) {
  return async (req, next) => {
    const start = Date.now();
    logger.info(`Incoming request: ${req.method}`);

    try {
      const result = await next();
      const duration = Date.now() - start;
      logger.info('Request completed', { durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('Request failed', { durationMs: duration, error: error.message });
      throw error;
    }
  };
}
