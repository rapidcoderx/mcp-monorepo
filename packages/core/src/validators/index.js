/**
 * @fileoverview Input validation utilities
 * @module @mcp/core/validators
 */

/**
 * Validate required fields in an object
 * @param {Object} obj - Object to validate
 * @param {Array<string>} required - Required field names
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateRequired(obj, required) {
  for (const field of required) {
    if (!(field in obj)) {
      throw new Error(`Missing required field: ${field}`);
    }

    if (obj[field] === null || obj[field] === undefined || obj[field] === '') {
      throw new Error(`Field cannot be empty: ${field}`);
    }
  }

  return true;
}

/**
 * Validate field types
 * @param {Object} obj - Object to validate
 * @param {Object} types - Field type specifications
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateTypes(obj, types) {
  for (const [field, expectedType] of Object.entries(types)) {
    if (field in obj) {
      const actualType = typeof obj[field];
      if (actualType !== expectedType) {
        throw new Error(
          `Invalid type for ${field}: expected ${expectedType}, got ${actualType}`,
        );
      }
    }
  }

  return true;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
  return true;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} [min=0] - Minimum length
 * @param {number} [max=Infinity] - Maximum length
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateLength(str, min = 0, max = Infinity) {
  if (str.length < min) {
    throw new Error(`String too short: minimum ${min} characters required`);
  }

  if (str.length > max) {
    throw new Error(`String too long: maximum ${max} characters allowed`);
  }

  return true;
}

/**
 * Validate number range
 * @param {number} num - Number to validate
 * @param {number} [min=-Infinity] - Minimum value
 * @param {number} [max=Infinity] - Maximum value
 * @throws {Error} If validation fails
 * @returns {boolean} True if valid
 */
export function validateRange(num, min = -Infinity, max = Infinity) {
  if (num < min) {
    throw new Error(`Number too small: minimum ${min} required`);
  }

  if (num > max) {
    throw new Error(`Number too large: maximum ${max} allowed`);
  }

  return true;
}
