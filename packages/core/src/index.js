/**
 * @fileoverview MCP Core Framework - Main exports
 * @module @mcp/core
 */

// Base server
export { BaseMCPServer, TransportType } from './base-server.js';

// Middleware
export {
  withErrorHandling,
  formatError,
  validateParams,
  Logger,
  createRequestLogger,
} from './middleware/index.js';

// Utilities
export { HttpClient, formatJSON, formatMarkdown, formatText, truncate } from './utils/index.js';

// Validators
export {
  validateRequired,
  validateTypes,
  validateURL,
  validateEmail,
  validateLength,
  validateRange,
} from './validators/index.js';
