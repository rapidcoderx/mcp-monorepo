/**
 * @fileoverview Base MCP server implementation with dual transport support.
 *
 * Architecture principles:
 * 1. McpServer from @modelcontextprotocol/sdk/server/mcp.js (modern API)
 * 2. Zod schemas for runtime type validation (auto-converted from JSON Schema)
 * 3. RFC 6570 URI templates for resources ({param}, {+path}, {/segment})
 * 4. Factory pattern for creating isolated server instances per HTTP session
 * 5. Stateful session management for StreamableHTTPServerTransport
 *
 * Transport modes:
 * - Stdio: Single server instance, StdioServerTransport
 * - HTTP: Server instance per session, StreamableHTTPServerTransport
 *   - POST /mcp: JSON-RPC messages (initialize & subsequent calls)
 *   - GET /mcp: SSE stream for server-initiated messages
 *   - DELETE /mcp: Session termination
 *   - GET /health: Health check
 *   - GET /info: Server metadata
 *
 * @module @mcp/core
 * @see https://modelcontextprotocol.io
 * @see https://tools.ietf.org/html/rfc6570 (URI Templates)
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { Logger } from './middleware/logger.js';

/**
 * Transport type enumeration
 * @enum {string}
 */
export const TransportType = {
  STDIO: 'stdio',
  HTTP: 'http',
};

/**
 * Base class for all MCP servers in the monorepo.
 * Supports both stdio and streamable HTTP transports.
 *
 * Subclasses must implement {@link setupHandlers} to register tools and resources
 * via {@link registerTool} and {@link registerResource}.
 *
 * @abstract
 * @example
 * class MyServer extends BaseMCPServer {
 *   setupHandlers() {
 *     this.registerTool({
 *       name: 'greet',
 *       description: 'Greets by name',
 *       inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
 *       handler: async ({ name }) => ({
 *         content: [{ type: 'text', text: `Hello, ${name}!` }],
 *       }),
 *     });
 *   }
 * }
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
   * @param {string} [config.logLevel='info'] - Log level (error | warn | info | debug)
   */
  constructor(config) {
    this.config = {
      transport: TransportType.STDIO,
      port: 3000,
      host: 'localhost',
      ...config,
    };

    /** @type {Logger} Logger instance — subclasses may replace this before or after super(). */
    this.logger = new Logger({
      level: this.config.logLevel || 'info',
      component: this.config.name,
    });

    /** @type {http.Server|null} */
    this.httpServer = null;

    /** @type {Map<string, Object>} Registered tools keyed by name */
    this.tools = new Map();

    /** @type {Map<string, Object>} Registered resources keyed by URI */
    this.resources = new Map();

    /** @type {Map<string, Object>} Registered resource templates keyed by URI template */
    this.resourceTemplates = new Map();

    /**
     * Active HTTP sessions keyed by session ID.
     * Each entry holds { transport: StreamableHTTPServerTransport, server: McpServer }.
     * @type {Map<string, {transport: StreamableHTTPServerTransport, server: McpServer}>}
     * @private
     */
    this._sessions = new Map();

    // Let the subclass populate this.tools and this.resources
    this.setupHandlers();

    // Create the primary Server instance (used for stdio transport).
    // Created AFTER setupHandlers so the tool/resource maps are populated.
    this.server = this._createServerInstance();
  }

  // ---------------------------------------------------------------------------
  // Server instance factory
  // ---------------------------------------------------------------------------

  /**
   * Create a new MCP Server instance with all registered handlers.
   *
   * A fresh instance is needed for each HTTP session (the SDK requires a 1-to-1
   * mapping between Server and Transport). For stdio, only one instance is used.
   *
   * Uses McpServer which requires Zod schemas for type-safe validation.
   *
   * @private
   * @returns {McpServer}
   */
  _createServerInstance() {
    const serverInstance = new McpServer(
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

    // Register all tools with McpServer
    // SDK signature: registerTool(name, config, handler)
    // inputSchema should be a raw Zod shape object, not wrapped in z.object()
    for (const [toolName, tool] of this.tools) {
      const zodSchema = this._jsonSchemaToZod(tool.inputSchema.properties || {});
      
      serverInstance.registerTool(
        toolName,
        {
          description: tool.description,
          inputSchema: zodSchema, // Plain object with Zod properties, NOT z.object() wrapped
        },
        async (params) => {
          this.logger.info('tools/call request', {
            tool: toolName,
            params,
            paramsType: typeof params,
            paramsKeys: params ? Object.keys(params) : [],
          });

          try {
            const result = await tool.handler(params || {});
            this.logger.info('tools/call response', {
              tool: toolName,
              success: !result.isError,
            });
            return result;
          } catch (error) {
            this.logger.error(`Error executing tool: ${toolName}`, {
              error: error.message,
              stack: error.stack,
            });
            return {
              content: [{ type: 'text', text: `Error: ${error.message}` }],
              isError: true,
            };
          }
        }
      );
    }

    // Register all static resources
    // SDK signature: registerResource(name, uri, config, readCallback)
    for (const [uri, resource] of this.resources) {
      serverInstance.registerResource(
        resource.name,
        uri,
        {
          description: resource.description,
          mimeType: resource.mimeType,
        },
        async (receivedUri) => {
          // SDK passes the URI directly as a string, not wrapped in {uri: ...}
          const requestUri = typeof receivedUri === 'string' ? receivedUri : receivedUri?.uri || uri;
          this.logger.info('resources/read request', { uri: requestUri });

          try {
            const result = await resource.handler(requestUri);
            this.logger.info('resources/read response', { uri: requestUri, success: true });
            return result;
          } catch (error) {
            this.logger.error(`Error reading resource: ${requestUri}`, {
              error: error.message,
              stack: error.stack,
            });
            throw error;
          }
        }
      );
    }

    // Register all resource templates
    // SDK signature: registerResource(name, ResourceTemplate, config, readCallback)
    for (const [uriTemplate, template] of this.resourceTemplates) {
      const resourceTemplate = new ResourceTemplate(uriTemplate, {});
      
      serverInstance.registerResource(
        template.name,
        resourceTemplate,
        {
          description: template.description,
          mimeType: template.mimeType,
        },
        async (uri) => {
          // SDK passes the URI directly as a string, not wrapped in {uri: ...}
          this.logger.info('resources/read RAW', { 
            uriRaw: uri,
            uriType: typeof uri,
            uriValue: JSON.stringify(uri),
          });
          const requestUri = typeof uri === 'string' ? uri : uri?.uri || '';
          this.logger.info('resources/read request', { 
            uri: requestUri,
          });

          try {
            const templateParams = this._matchUriTemplate(uriTemplate, requestUri);
            if (!templateParams) {
              throw new Error(`URI does not match template: ${requestUri}`);
            }

            const result = await template.handler(requestUri, templateParams);
            this.logger.info('resources/read response (template)', {
              uri: requestUri,
              template: uriTemplate,
              success: true,
            });
            return result;
          } catch (error) {
            this.logger.error(`Error reading resource from template: ${requestUri}`, {
              error: error.message,
              stack: error.stack,
            });
            throw error;
          }
        }
      );
    }

    return serverInstance;
  }

  /**
   * Convert JSON Schema properties to Zod schema object.
   * Supports basic types: string, number, boolean, object, array.
   *
   * @private
   * @param {Object} jsonSchema - JSON Schema object
   * @returns {Object} Zod schema properties
   */
  _jsonSchemaToZod(jsonSchema) {
    const zodProps = {};

    if (!jsonSchema || !jsonSchema.properties) {
      return zodProps;
    }

    const required = jsonSchema.required || [];

    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      let zodType;

      switch (prop.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
      case 'integer':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(z.any());
        break;
      case 'object':
        zodType = z.object({});
        break;
      default:
        zodType = z.any();
      }

      // Add description if available
      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      // Make optional if not required
      if (!required.includes(key)) {
        zodType = zodType.optional();
      }

      zodProps[key] = zodType;
    }

    return zodProps;
  }

  // ---------------------------------------------------------------------------
  // Abstract / subclass API
  // ---------------------------------------------------------------------------

  /**
   * Setup MCP protocol handlers.
   *
   * Subclasses **must** override this method and call {@link registerTool} /
   * {@link registerResource} to declare their capabilities.
   *
   * **Important:** This is invoked from the constructor *before* `this.server`
   * exists, so do not access `this.server` inside this method.
   *
   * @abstract
   * @protected
   */
  setupHandlers() {
    throw new Error('setupHandlers must be implemented by subclass');
  }

  // ---------------------------------------------------------------------------
  // Tool registration & handling
  // ---------------------------------------------------------------------------

  /**
   * Register a tool with the server.
   *
   * @param {Object} tool - Tool definition
   * @param {string} tool.name - Tool name (unique identifier)
   * @param {string} tool.description - Human-readable description
   * @param {Object} tool.inputSchema - JSON Schema for tool inputs
   * @param {Function} tool.handler - Async function `(params) => CallToolResult`
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  // ---------------------------------------------------------------------------
  // Resource registration & handling
  // ---------------------------------------------------------------------------

  /**
   * Register a resource with the server.
   *
   * @param {Object} resource - Resource definition
   * @param {string} resource.uri - Resource URI
   * @param {string} resource.name - Human-readable name
   * @param {string} resource.description - Description
   * @param {string} [resource.mimeType] - MIME type
   * @param {Function} resource.handler - Async function `(uri) => ReadResourceResult`
   */
  registerResource(resource) {
    this.resources.set(resource.uri, resource);
  }

  /**
   * Register a resource template with the server.
   *
   * @param {Object} template - Resource template definition
   * @param {string} template.uriTemplate - URI template (e.g., 'file:///{path}')
   * @param {string} template.name - Human-readable name
   * @param {string} template.description - Description
   * @param {string} [template.mimeType] - MIME type
   * @param {Function} template.handler - Async function `(uri, params) => ReadResourceResult`
   */
  registerResourceTemplate(template) {
    this.resourceTemplates.set(template.uriTemplate, template);
  }

  /**
   * Match a URI against RFC 6570 URI template and extract parameters.
   * Supports common RFC 6570 operators:
   * - {param}   - simple string expansion (no reserved chars)
   * - {+param}  - reserved string expansion (allows /, ?, etc.)
   * - {/param}  - path segment prefix
   *
   * @private
   * @param {string} template - RFC 6570 URI template (e.g., 'file:///{+path}')
   * @param {string} uri - Actual URI
   * @returns {Object|null} Extracted parameters or null if no match
   */
  _matchUriTemplate(template, uri) {
    // Convert RFC 6570 template to regex pattern
    let pattern = template
      // {+param} - reserved expansion (allows reserved chars including /)
      .replace(/\{\+([^}]+)\}/g, (_, name) => `(?<${name}>.+)`)
      // {/param} - path segment prefix
      .replace(/\{\/([^}]+)\}/g, (_, name) => `(?:/(?<${name}>[^/]+))?`)
      // {param} - simple expansion (no reserved chars, no /)
      .replace(/\{([^}]+)\}/g, (_, name) => `(?<${name}>[^/?#]+)`);

    // Escape special regex chars in non-template parts
    pattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '\\*');

    const regex = new RegExp(`^${pattern}$`);
    const match = uri.match(regex);

    return match ? match.groups : null;
  }

  // ---------------------------------------------------------------------------
  // Stdio transport
  // ---------------------------------------------------------------------------

  /**
   * Start the server with stdio transport.
   * @private
   * @returns {Promise<void>}
   */
  async _startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP server running on stdio');
  }

  // ---------------------------------------------------------------------------
  // HTTP transport — helpers
  // ---------------------------------------------------------------------------

  /**
   * Set common CORS headers on the response.
   * @private
   * @param {http.ServerResponse} res
   */
  _setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, mcp-session-id, mcp-protocol-version, Last-Event-ID, Authorization',
    );
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');
  }

  /**
   * Read and parse the request body as JSON.
   * @private
   * @param {http.IncomingMessage} req
   * @returns {Promise<any>} Parsed JSON body, or undefined for empty body
   */
  _parseRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : undefined);
        } catch (err) {
          reject(new Error(`Invalid JSON: ${err.message}`));
        }
      });
      req.on('error', reject);
    });
  }

  // ---------------------------------------------------------------------------
  // HTTP transport — /mcp endpoint (POST / GET / DELETE)
  // ---------------------------------------------------------------------------

  /**
   * Route an incoming /mcp request to the appropriate handler based on method.
   *
   * - **POST** — JSON-RPC messages (initialize or subsequent calls)
   * - **GET**  — open an SSE stream for server-initiated messages
   * - **DELETE** — terminate a session
   *
   * @private
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  async _handleMcpRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];

    this.logger.debug('MCP request received', {
      method: req.method,
      sessionId: sessionId || 'none',
      url: req.url,
    });

    try {
      if (req.method === 'POST') {
        const body = await this._parseRequestBody(req);

        // Log the JSON-RPC method
        if (body && body.method) {
          this.logger.info('MCP JSON-RPC request', {
            method: body.method,
            params: body.params,
            id: body.id,
            sessionId: sessionId || 'new',
          });
        }

        if (sessionId && this._sessions.has(sessionId)) {
          // Existing session — delegate to stored transport
          const session = this._sessions.get(sessionId);
          await session.transport.handleRequest(req, res, body);
        } else if (!sessionId && isInitializeRequest(body)) {
          // New session — run the initialization handshake
          await this._initializeSession(req, res, body);
        } else {
          // Bad request: unknown session ID or non-initialize without session
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
              },
              id: null,
            }),
          );
        }
      } else if (req.method === 'GET') {
        // SSE stream — requires a valid session
        if (!sessionId || !this._sessions.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
          return;
        }
        const session = this._sessions.get(sessionId);
        await session.transport.handleRequest(req, res);
      } else if (req.method === 'DELETE') {
        // Session termination
        if (!sessionId || !this._sessions.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
          return;
        }
        const session = this._sessions.get(sessionId);
        await session.transport.handleRequest(req, res);
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    } catch (error) {
      this.logger.error('MCP request error', { error: error.message });
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32603, message: error.message },
            id: null,
          }),
        );
      }
    }
  }

  /**
   * Create a new stateful session: transport + server instance.
   *
   * Follows the SDK pattern from the official `simpleStreamableHttp` example:
   * 1. Create a StreamableHTTPServerTransport with a session-ID generator
   * 2. Create a fresh Server instance (so each session is isolated)
   * 3. Connect server ↔ transport
   * 4. Let the transport handle the initialize request
   *
   * @private
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {Object} body - Parsed JSON-RPC initialize request
   */
  async _initializeSession(req, res, body) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store *after* the SDK assigns the ID — avoids race conditions
        this.logger.info('Session initialized', { sessionId });
        this._sessions.set(sessionId, { transport, server: serverInstance });
      },
    });

    // Clean up when the transport closes (e.g. on DELETE or disconnect)
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && this._sessions.has(sid)) {
        this.logger.info('Session closed', { sessionId: sid });
        this._sessions.delete(sid);
      }
    };

    // Each session gets its own Server instance (SDK requirement)
    const serverInstance = this._createServerInstance();

    // Connect server ↔ transport BEFORE handling the request
    await serverInstance.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  // ---------------------------------------------------------------------------
  // HTTP transport — server lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Start the server with streamable HTTP transport.
   *
   * Exposes three endpoints:
   * - `/mcp`    — MCP protocol (POST / GET / DELETE)
   * - `/health` — health check (GET)
   * - `/info`   — server metadata for the dashboard (GET)
   *
   * @private
   * @returns {Promise<void>}
   */
  async _startHttp() {
    this.httpServer = http.createServer(async (req, res) => {
      // CORS headers on every response
      this._setCorsHeaders(res);

      // Preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', name: this.config.name }));
        return;
      }

      // Info endpoint (dashboard)
      if (req.url === '/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getInfo()));
        return;
      }

      // MCP protocol endpoint
      if (req.url === '/mcp') {
        await this._handleMcpRequest(req, res);
        return;
      }

      // Not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        const base = `http://${this.config.host}:${this.config.port}`;
        this.logger.info(`MCP server running on ${base}`, {
          mcp: `${base}/mcp`,
          info: `${base}/info`,
          health: `${base}/health`,
        });
        resolve();
      });
      this.httpServer.on('error', reject);
    });
  }

  // ---------------------------------------------------------------------------
  // Public lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Start the server with the configured (or overridden) transport.
   *
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
   * Stop the server gracefully, closing all active sessions.
   * @returns {Promise<void>}
   */
  async stop() {
    // Close every active HTTP session
    for (const [sessionId, session] of this._sessions) {
      try {
        await session.transport.close();
        await session.server.close();
        this.logger.debug('Closed session during shutdown', { sessionId });
      } catch {
        // Ignore cleanup errors
      }
    }
    this._sessions.clear();

    // Close the primary (stdio) server instance
    try {
      await this.server.close();
    } catch {
      // Ignore if not connected
    }

    // Shut down the HTTP listener
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          this.logger.info('Server stopped');
          resolve();
        });
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Metadata helpers (used by /info and list handlers)
  // ---------------------------------------------------------------------------

  /**
   * Server metadata for the dashboard / info endpoint.
   * @returns {Object}
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
   * Get the list of registered tools (for tools/list responses & /info).
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
   * Get the list of registered resources (for resources/list responses & /info).
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

  /**
   * Get the list of registered resource templates (for resources/templates/list responses).
   * @protected
   * @returns {Array<Object>}
   */
  getResourceTemplates() {
    return Array.from(this.resourceTemplates.values()).map((template) => ({
      uriTemplate: template.uriTemplate,
      name: template.name,
      description: template.description,
      mimeType: template.mimeType,
    }));
  }
}
