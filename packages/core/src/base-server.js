/**
 * @fileoverview Base MCP server implementation with dual transport support.
 *
 * Follows the MCP SDK patterns:
 * - Stateful HTTP sessions (POST for JSON-RPC, GET for SSE, DELETE for session close)
 * - Server instance per session for HTTP transport
 * - StdioServerTransport for local/CLI usage
 *
 * @module @mcp/core
 * @see https://modelcontextprotocol.io
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import http from 'node:http';
import { randomUUID } from 'node:crypto';

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
   */
  constructor(config) {
    this.config = {
      transport: TransportType.STDIO,
      port: 3000,
      host: 'localhost',
      ...config,
    };

    /** @type {http.Server|null} */
    this.httpServer = null;

    /** @type {Map<string, Object>} Registered tools keyed by name */
    this.tools = new Map();

    /** @type {Map<string, Object>} Registered resources keyed by URI */
    this.resources = new Map();

    /**
     * Active HTTP sessions keyed by session ID.
     * Each entry holds { transport: StreamableHTTPServerTransport, server: Server }.
     * @type {Map<string, {transport: StreamableHTTPServerTransport, server: Server}>}
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
   * Create a new low-level MCP Server instance with all registered handlers.
   *
   * A fresh instance is needed for each HTTP session (the SDK requires a 1-to-1
   * mapping between Server and Transport). For stdio, only one instance is used.
   *
   * @private
   * @returns {Server}
   */
  _createServerInstance() {
    const serverInstance = new Server(
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

    // -- tools/list --------------------------------------------------------
    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // -- tools/call --------------------------------------------------------
    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request),
    );

    // -- resources/list ----------------------------------------------------
    serverInstance.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.getResources(),
    }));

    // -- resources/read ----------------------------------------------------
    serverInstance.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => this.handleResourceRead(request),
    );

    return serverInstance;
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

  /**
   * Dispatch a tools/call request to the correct registered handler.
   *
   * @private
   * @param {Object} request - MCP CallToolRequest
   * @returns {Promise<Object>} CallToolResult
   */
  async handleToolCall(request) {
    const toolName = request.params.name;
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      return await tool.handler(request.params.arguments || {});
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
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
   * Dispatch a resources/read request to the correct registered handler.
   *
   * @private
   * @param {Object} request - MCP ReadResourceRequest
   * @returns {Promise<Object>} ReadResourceResult
   */
  async handleResourceRead(request) {
    const resourceUri = request.params.uri;
    const resource = this.resources.get(resourceUri);

    if (!resource) {
      throw new Error(`Unknown resource: ${resourceUri}`);
    }

    try {
      return await resource.handler(resourceUri);
    } catch (error) {
      console.error(`Error reading resource ${resourceUri}:`, error);
      throw error;
    }
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
    console.error(`${this.config.name} MCP server running on stdio`);
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
      'Content-Type, mcp-session-id, Last-Event-ID, Authorization',
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

    try {
      if (req.method === 'POST') {
        const body = await this._parseRequestBody(req);

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
      console.error(`[${this.config.name}] MCP request error:`, error.message);
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
        console.error(`[${this.config.name}] Session initialized: ${sessionId}`);
        this._sessions.set(sessionId, { transport, server: serverInstance });
      },
    });

    // Clean up when the transport closes (e.g. on DELETE or disconnect)
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid && this._sessions.has(sid)) {
        console.error(`[${this.config.name}] Session closed: ${sid}`);
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
        console.error(`${this.config.name} MCP server running on ${base}`);
        console.error(`  - MCP endpoint: ${base}/mcp`);
        console.error(`  - Info endpoint: ${base}/info`);
        console.error(`  - Health check: ${base}/health`);
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
        console.error(`[${this.config.name}] Closed session: ${sessionId}`);
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
          console.error(`${this.config.name} server stopped`);
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
}
