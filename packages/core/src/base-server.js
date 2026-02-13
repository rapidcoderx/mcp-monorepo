/**
 * @fileoverview Base MCP server implementation with dual transport support
 * @module @mcp/core
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http from 'http';

/**
 * Transport type enumeration
 * @enum {string}
 */
export const TransportType = {
  STDIO: 'stdio',
  HTTP: 'http',
};

/**
 * Base class for all MCP servers in the monorepo
 * Supports both stdio and streamable HTTP transports
 * @abstract
 */
export class BaseMCPServer {
  /**
   * @param {Object} config - Server configuration
   * @param {string} config.name - Server name
   * @param {string} config.version - Server version
   * @param {Object} [config.capabilities] - Server capabilities
   * @param {string} [config.transport='stdio'] - Transport type ('stdio' or 'http')
   * @param {number} [config.port=3000] - HTTP port (only for http transport)
   * @param {string} [config.host='localhost'] - HTTP host (only for http transport)
   */
  constructor(config) {
    this.config = {
      transport: TransportType.STDIO,
      port: 3000,
      host: 'localhost',
      ...config,
    };

    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: this.config.capabilities || {
          tools: {},
          resources: {},
        },
      },
    );

    this.httpServer = null;
    this.tools = new Map();
    this.resources = new Map();

    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   * @abstract
   * @protected
   */
  setupHandlers() {
    throw new Error('setupHandlers must be implemented by subclass');
  }

  /**
   * Register a tool with the server
   * @param {Object} tool - Tool definition
   * @param {string} tool.name - Tool name
   * @param {string} tool.description - Tool description
   * @param {Object} tool.inputSchema - JSON Schema for tool inputs
   * @param {Function} tool.handler - Tool execution handler
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);

    // Set up tools/list handler (only once)
    if (!this._toolsListHandlerSet) {
      this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: this.getTools(),
      }));
      this._toolsListHandlerSet = true;
    }

    // Set up tools/call handler (only once)
    if (!this._toolsCallHandlerSet) {
      this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
        this.handleToolCall(request),
      );
      this._toolsCallHandlerSet = true;
    }
  }

  /**
   * Handle tool call requests
   * @private
   * @param {Object} request - Tool call request
   * @returns {Promise<Object>} Tool call response
   */
  async handleToolCall(request) {
    const toolName = request.params.name;
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      const result = await tool.handler(request.params.arguments || {});
      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Register a resource with the server
   * @param {Object} resource - Resource definition
   * @param {string} resource.uri - Resource URI
   * @param {string} resource.name - Resource name
   * @param {string} resource.description - Resource description
   * @param {string} [resource.mimeType] - Resource MIME type
   * @param {Function} resource.handler - Resource read handler
   */
  registerResource(resource) {
    this.resources.set(resource.uri, resource);

    // Set up resources/list handler (only once)
    if (!this._resourcesListHandlerSet) {
      this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: this.getResources(),
      }));
      this._resourcesListHandlerSet = true;
    }

    // Set up resources/read handler (only once)
    if (!this._resourcesReadHandlerSet) {
      this.server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
        this.handleResourceRead(request),
      );
      this._resourcesReadHandlerSet = true;
    }
  }

  /**
   * Handle resource read requests
   * @private
   * @param {Object} request - Resource read request
   * @returns {Promise<Object>} Resource read response
   */
  async handleResourceRead(request) {
    const resourceUri = request.params.uri;
    const resource = this.resources.get(resourceUri);

    if (!resource) {
      throw new Error(`Unknown resource: ${resourceUri}`);
    }

    try {
      const result = await resource.handler(resourceUri);
      return result;
    } catch (error) {
      console.error(`Error reading resource ${resourceUri}:`, error);
      throw error;
    }
  }

  /**
   * Start the server with stdio transport
   * @private
   * @returns {Promise<void>}
   */
  async _startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.config.name} MCP server running on stdio`);
  }

  /**
   * Start the server with streamable HTTP transport
   * @private
   * @returns {Promise<void>}
   */
  async _startHttp() {
    this.httpServer = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check endpoint
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', name: this.config.name }));
        return;
      }

      // Info endpoint for dashboard
      if (req.url === '/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getInfo()));
        return;
      }

      // MCP streamable HTTP endpoint
      if (req.url === '/mcp') {
        const transport = new StreamableHTTPServerTransport(req, res);
        await this.server.connect(transport);

        req.on('close', () => {
          console.error(`Client disconnected from ${this.config.name}`);
        });
        return;
      }

      // Not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        console.error(
          `${this.config.name} MCP server running on http://${this.config.host}:${this.config.port}`,
        );
        console.error(
          `  - MCP endpoint: http://${this.config.host}:${this.config.port}/mcp`,
        );
        console.error(
          `  - Info endpoint: http://${this.config.host}:${this.config.port}/info`,
        );
        console.error(
          `  - Health check: http://${this.config.host}:${this.config.port}/health`,
        );
        resolve();
      });

      this.httpServer.on('error', reject);
    });
  }

  /**
   * Start the server with configured transport
   * @param {string} [transportType] - Override transport type
   * @returns {Promise<void>}
   */
  async start(transportType) {
    const transport = transportType || this.config.transport;

    switch (transport) {
    case TransportType.STDIO:
      return this._startStdio();
    case TransportType.HTTP:
      return this._startHttp();
    default:
      throw new Error(`Unknown transport type: ${transport}`);
    }
  }

  /**
   * Stop the server gracefully
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          console.error(`${this.config.name} server stopped`);
          resolve();
        });
      });
    }
  }

  /**
   * Expose server info for dashboard
   * @returns {Object} Server metadata
   */
  getInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      transport: this.config.transport,
      ...(this.config.transport === TransportType.HTTP && {
        endpoint: `http://${this.config.host}:${this.config.port}/mcp`,
      }),
      capabilities: this.config.capabilities,
      tools: this.getTools(),
      resources: this.getResources(),
    };
  }

  /**
   * Get list of available tools
   * @protected
   * @returns {Array<Object>}
   */
  getTools() {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Get list of available resources
   * @protected
   * @returns {Array<Object>}
   */
  getResources() {
    return Array.from(this.resources.values()).map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }
}
