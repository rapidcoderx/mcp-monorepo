#!/usr/bin/env node

/**
 * @fileoverview Echo MCP Server - Sample implementation
 * Demonstrates how to use the BaseMCPServer framework
 * @module @mcp/echo-server
 */

import { parseArgs } from 'node:util';
import { BaseMCPServer, validateRequired } from '@mcp/core';

/**
 * Echo server that demonstrates MCP framework usage
 * Provides simple tools for echoing text and returning metadata
 */
class EchoServer extends BaseMCPServer {
  /**
   * @param {Object} config - Server configuration
   */
  constructor(config) {
    super({
      name: 'echo-server',
      version: '1.0.0',
      capabilities: {
        tools: {},
        resources: {},
      },
      ...config,
    });
  }

  /**
   * Setup server handlers - register tools and resources
   * @protected
   */
  setupHandlers() {
    // Register echo tool
    this.registerTool({
      name: 'echo',
      description: 'Echoes back the provided text',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to echo back',
          },
        },
        required: ['text'],
      },
      handler: async (params) => {
        this.logger?.info('Echo tool called', { text: params.text });
        validateRequired(params, ['text']);

        return {
          content: [
            {
              type: 'text',
              text: `Echo: ${params.text}`,
            },
          ],
        };
      },
    });

    // Register reverse tool
    this.registerTool({
      name: 'reverse',
      description: 'Reverses the provided text',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to reverse',
          },
        },
        required: ['text'],
      },
      handler: async (params) => {
        this.logger?.info('Reverse tool called', { text: params.text });
        validateRequired(params, ['text']);

        const reversed = params.text.split('').reverse().join('');

        return {
          content: [
            {
              type: 'text',
              text: reversed,
            },
          ],
        };
      },
    });

    // Register uppercase tool
    this.registerTool({
      name: 'uppercase',
      description: 'Converts text to uppercase',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to convert to uppercase',
          },
        },
        required: ['text'],
      },
      handler: async (params) => {
        this.logger?.info('Uppercase tool called', { text: params.text });
        validateRequired(params, ['text']);

        return {
          content: [
            {
              type: 'text',
              text: params.text.toUpperCase(),
            },
          ],
        };
      },
    });

    // Register a sample resource
    this.registerResource({
      uri: 'echo://info',
      name: 'Server Information',
      description: 'Information about the echo server',
      mimeType: 'text/plain',
      handler: async () => {
        return {
          contents: [
            {
              uri: 'echo://info',
              mimeType: 'text/plain',
              text: `Echo Server v1.0.0

This is a sample MCP server that demonstrates the framework capabilities.

Available Tools:
- echo: Echoes back text
- reverse: Reverses text
- uppercase: Converts text to uppercase

Available Resources:
- echo://info: Server information (static)
- echo://content/{type}: Dynamic content by type (template)
- echo://data/{format}/{name}: Sample data in different formats (template)

Transport: ${this.config.transport}
${this.config.transport === 'http' ? `Port: ${this.config.port}` : ''}`,
            },
          ],
        };
      },
    });

    // Register resource template for dynamic content
    this.registerResourceTemplate({
      uriTemplate: 'echo://content/{type}',
      name: 'Dynamic Content',
      description: 'Get content by type (text, json, html)',
      mimeType: 'text/plain',
      handler: async (uri, params) => {
        const { type } = params;

        const contentMap = {
          text: {
            mimeType: 'text/plain',
            text: 'This is plain text content from the echo server.',
          },
          json: {
            mimeType: 'application/json',
            text: JSON.stringify({
              message: 'This is JSON content',
              timestamp: new Date().toISOString(),
              server: 'echo-server',
            }, null, 2),
          },
          html: {
            mimeType: 'text/html',
            text: '<html><body><h1>Echo Server</h1><p>This is HTML content.</p></body></html>',
          },
          markdown: {
            mimeType: 'text/markdown',
            text: '# Echo Server\\n\\n## Dynamic Content\\n\\nThis is **markdown** content with *formatting*.',
          },
        };

        const content = contentMap[type];
        if (!content) {
          throw new Error(`Unknown content type: ${type}. Available types: text, json, html, markdown`);
        }

        this.logger?.info('Resource template accessed', { uri, type });

        return {
          contents: [
            {
              uri,
              mimeType: content.mimeType,
              text: content.text,
            },
          ],
        };
      },
    });

    // Register another template for data in different formats
    this.registerResourceTemplate({
      uriTemplate: 'echo://data/{format}/{name}',
      name: 'Sample Data',
      description: 'Get sample data by format and name',
      mimeType: 'application/json',
      handler: async (uri, params) => {
        const { format, name } = params;

        this.logger?.info('Data resource template accessed', { uri, format, name });

        const data = {
          format,
          name,
          timestamp: new Date().toISOString(),
          data: {
            message: `Sample ${format} data for ${name}`,
            items: [1, 2, 3, 4, 5],
            nested: {
              key: 'value',
              array: ['a', 'b', 'c'],
            },
          },
        };

        let text;
        let mimeType;

        switch (format) {
        case 'json':
          text = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          break;
        case 'yaml':
          // Simple YAML conversion for demonstration
          text = `format: ${format}\\nname: ${name}\\ntimestamp: ${data.timestamp}\\ndata:\\n  message: "${data.data.message}"`;
          mimeType = 'text/yaml';
          break;
        case 'csv':
          text = 'key,value\\nformat,' + format + '\\nname,' + name + '\\ntimestamp,' + data.timestamp;
          mimeType = 'text/csv';
          break;
        default:
          throw new Error(`Unknown format: ${format}. Available formats: json, yaml, csv`);
        }

        return {
          contents: [
            {
              uri,
              mimeType,
              text,
            },
          ],
        };
      },
    });

    this.logger?.info('Echo server handlers registered', {
      tools: this.tools.size,
      resources: this.resources.size,
      resourceTemplates: this.resourceTemplates.size,
    });
  }
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    transport: {
      type: 'string',
      default: 'stdio',
    },
    port: {
      type: 'string',
      default: '3000',
    },
    host: {
      type: 'string',
      default: '0.0.0.0',
    },
    'log-level': {
      type: 'string',
      default: 'info',
    },
  },
});

// Create and start server
const server = new EchoServer({
  transport: values.transport,
  port: parseInt(values.port),
  host: values.host,
  logLevel: values['log-level'],
});

// Start the server
await server.start();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  server.logger.info('Shutting down (SIGINT)');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  server.logger.info('Shutting down (SIGTERM)');
  await server.stop();
  process.exit(0);
});
