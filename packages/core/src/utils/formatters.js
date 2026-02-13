/**
 * @fileoverview Formatting utilities
 * @module @mcp/core/utils
 */

/**
 * Format JSON data for display
 * @param {Object} data - Data to format
 * @param {boolean} [pretty=true] - Pretty print
 * @returns {string} Formatted JSON
 */
export function formatJSON(data, pretty = true) {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Format data as markdown
 * @param {Object} data - Data to format
 * @returns {string} Markdown formatted text
 */
export function formatMarkdown(data) {
  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => `- ${formatMarkdown(item)}`).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => `**${key}**: ${formatMarkdown(value)}`)
      .join('\n');
  }

  return String(data);
}

/**
 * Format data as plain text
 * @param {Object} data - Data to format
 * @returns {string} Plain text
 */
export function formatText(data) {
  if (typeof data === 'string') {
    return data;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [suffix='...'] - Suffix to add
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}
