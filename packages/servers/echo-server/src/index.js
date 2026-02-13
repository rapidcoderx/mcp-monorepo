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

Transport: ${this.config.transport}
${this.config.transport === 'http' ? `Port: ${this.config.port}` : ''}`,
            },
          ],
        };
      },
    });

    this.logger?.info('Echo server handlers registered');
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
