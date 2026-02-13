/**
 * @fileoverview HTTP client utility
 * @module @mcp/core/utils
 */

/**
 * Simple HTTP client with retry logic
 */
export class HttpClient {
  /**
   * @param {Object} config - Client configuration
   * @param {string} [config.baseURL] - Base URL for requests
   * @param {Object} [config.headers] - Default headers
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {number} [config.retries=3] - Number of retries
   */
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.headers = config.headers || {};
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  /**
   * Make HTTP request
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(method, path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let lastError;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: { ...this.headers, ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }

        return await response.text();
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError;
  }

  /**
   * GET request
   * @param {string} path - Request path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(path, options = {}) {
    return this.request('GET', path, options);
  }

  /**
   * POST request
   * @param {string} path - Request path
   * @param {Object} [data] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(path, data, options = {}) {
    return this.request('POST', path, {
      ...options,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * PUT request
   * @param {string} path - Request path
   * @param {Object} [data] - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(path, data, options = {}) {
    return this.request('PUT', path, {
      ...options,
      body: data,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  /**
   * DELETE request
   * @param {string} path - Request path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }
}
