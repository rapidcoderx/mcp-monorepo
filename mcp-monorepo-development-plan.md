# MCP Monorepo Framework - Development Plan

## Executive Summary

This document outlines the development plan for a monorepo framework that creates reusable MCP (Model Context Protocol) servers. The framework will support multiple server types (API-based, document-based, C4 diagram generation, Mermaid generation) with shared infrastructure, independent deployment, and a showcase dashboard.

**Tech Stack:** Plain JavaScript (ESM), Node.js LTS, npm workspaces, @modelcontextprotocol/sdk, Vite + React

---

## Project Architecture

### Monorepo Structure

```
mcp-monorepo/
├── package.json                    # Root workspace configuration
├── packages/
│   ├── core/                      # Shared core framework
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── base-server.js     # Base MCP server with dual transport
│   │   │   ├── transports/        # Transport implementations
│   │   │   │   ├── stdio.js       # stdio transport wrapper
│   │   │   │   └── http.js        # Streamable HTTP transport wrapper
│   │   │   ├── middleware/        # Common middleware
│   │   │   ├── utils/             # Shared utilities
│   │   │   ├── validators/        # Input validation
│   │   │   └── index.js
│   │   └── README.md
│   │
│   ├── servers/
│   │   ├── api-server/            # OpenAPI spec-based server
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.js       # Server entry point (CLI args)
│   │   │   │   ├── tools/         # MCP tools
│   │   │   │   ├── resources/     # MCP resources
│   │   │   │   └── spec-loader.js # OpenAPI parser
│   │   │   ├── specs/             # OpenAPI specifications
│   │   │   └── README.md
│   │   │
│   │   ├── docs-server/           # Markdown document server
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.js
│   │   │   │   ├── search.js      # Document search
│   │   │   │   ├── query.js       # Document query
│   │   │   │   └── converter.js   # Markitdown wrapper
│   │   │   ├── docs/              # Markdown documents
│   │   │   └── README.md
│   │   │
│   │   ├── c4-generator/          # C4 diagram generator
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.js
│   │   │   │   ├── parser.js      # Markdown parser
│   │   │   │   ├── c4-builder.js  # C4 diagram builder
│   │   │   │   └── templates/     # C4 templates
│   │   │   └── README.md
│   │   │
│   │   └── mermaid-generator/     # Mermaid diagram generator
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.js
│   │       │   ├── sequence.js    # Sequence diagrams
│   │       │   ├── flow.js        # Flow diagrams
│   │       │   └── deployment.js  # Deployment diagrams
│   │       └── README.md
│   │
│   └── dashboard/                  # Showcase dashboard
│       ├── package.json
│       ├── index.html
│       ├── src/
│       │   ├── main.jsx
│       │   ├── components/
│       │   ├── services/
│       │   │   └── mcp-client.js  # HTTP client for servers
│       │   └── App.jsx
│       └── vite.config.js
│
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── transport-guide.md         # Guide on choosing transports
│   └── contributing.md
│
└── README.md
```

### Transport Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (Any Type)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Base MCP Server Class                      │ │
│  │  • Transport-agnostic core logic                       │ │
│  │  • Tool registration                                    │ │
│  │  • Resource registration                                │ │
│  │  • Error handling                                       │ │
│  └─────────────┬──────────────────────────┬───────────────┘ │
│                │                          │                  │
│    ┌───────────▼───────────┐  ┌──────────▼──────────────┐  │
│    │   stdio Transport     │  │   Streamable HTTP        │  │
│    │  • Standard I/O       │  │  • MCP endpoint (/mcp)   │  │
│    │  • Process pipes      │  │  • Info endpoint (/info) │  │
│    │  • Local only         │  │  • Health check (/health)│  │
│    │                       │  │  • Remote accessible     │  │
│    └───────────┬───────────┘  └──────────┬──────────────┘  │
└────────────────┼──────────────────────────┼─────────────────┘
                 │                          │
                 │                          │
    ┌────────────▼─────────┐   ┌───────────▼────────────────┐
    │  Local Clients       │   │  Remote Clients            │
    │  • Claude Desktop    │   │  • Web Dashboard           │
    │  • CLI tools         │   │  • Browser extensions      │
    │  • Shell scripts     │   │  • Mobile apps             │
    │  • Development tools │   │  • Other services          │
    └──────────────────────┘   └────────────────────────────┘
```

---

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Repository Initialization

**Tasks:**
- [ ] Initialize Git repository
- [ ] Create root `package.json` with npm workspaces configuration
- [ ] Set up ESLint configuration for plain JavaScript + JSDoc
- [ ] Configure Prettier for code formatting
- [ ] Create `.gitignore` and `.npmrc`
- [ ] Set up basic CI/CD pipeline (GitHub Actions)

**Root package.json:**
```json
{
  "name": "mcp-monorepo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "workspaces": [
    "packages/core",
    "packages/servers/*",
    "packages/dashboard"
  ],
  "scripts": {
    "install:all": "npm install",
    "lint": "eslint packages/*/src/**/*.js",
    "format": "prettier --write packages/*/src/**/*.js",
    "test": "npm run test --workspaces",
    "build": "npm run build --workspaces",
    "dev:dashboard": "npm run dev -w @mcp/dashboard"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 1.2 Core Framework Package

**Tasks:**
- [ ] Create `packages/core` directory structure
- [ ] Implement base MCP server class with dual transport support
- [ ] Add stdio transport for local/development use
- [ ] Add streamable HTTP transport for remote/production use
- [ ] Create middleware system (logging, error handling, auth)
- [ ] Build utility functions (HTTP client, JSON/Markdown formatters)
- [ ] Implement validation helpers
- [ ] Add JSDoc documentation
- [ ] Create unit tests

**Transport Strategy:**
- **stdio**: For local development, Claude Desktop integration, CLI tools
- **Streamable HTTP**: For remote deployment, web clients, dashboard integration
- Servers can be started in either mode via configuration or CLI flags
- HTTP mode includes `/health`, `/info`, and `/mcp` endpoints

**Key Files:**

**packages/core/src/base-server.js:**
```javascript
/**
 * @fileoverview Base MCP server implementation with dual transport support
 * @module @mcp/core
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
   * @param {Object} config.capabilities - Server capabilities
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
      }
    );
    
    this.httpServer = null;
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
    this.server.setRequestHandler(
      'tools/list',
      async () => ({
        tools: this.getTools(),
      })
    );

    this.server.setRequestHandler(
      'tools/call',
      async (request) => this.handleToolCall(request, tool)
    );
  }

  /**
   * Register a resource with the server
   * @param {Object} resource - Resource definition
   * @param {string} resource.uri - Resource URI
   * @param {string} resource.name - Resource name
   * @param {string} resource.description - Resource description
   * @param {Function} resource.handler - Resource read handler
   */
  registerResource(resource) {
    // Implementation
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
          // Client disconnected
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
          `${this.config.name} MCP server running on http://${this.config.host}:${this.config.port}`
        );
        console.error(`  - MCP endpoint: http://${this.config.host}:${this.config.port}/mcp`);
        console.error(`  - Info endpoint: http://${this.config.host}:${this.config.port}/info`);
        console.error(`  - Health check: http://${this.config.host}:${this.config.port}/health`);
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
    return [];
  }

  /**
   * Get list of available resources
   * @protected
   * @returns {Array<Object>}
   */
  getResources() {
    return [];
  }
}
```

**Server Startup Examples:**

```javascript
// Example 1: Start with stdio (for local development)
import { MyMCPServer } from './my-server.js';

const server = new MyMCPServer({
  name: 'my-server',
  version: '1.0.0',
  transport: 'stdio',
});

await server.start();

// Example 2: Start with HTTP (for remote deployment)
const server = new MyMCPServer({
  name: 'my-server',
  version: '1.0.0',
  transport: 'http',
  port: 3000,
  host: '0.0.0.0',
});

await server.start();

// Example 3: CLI-controlled transport
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    transport: { type: 'string', default: 'stdio' },
    port: { type: 'string', default: '3000' },
  },
});

const server = new MyMCPServer({
  name: 'my-server',
  version: '1.0.0',
  transport: values.transport,
  port: parseInt(values.port),
});

await server.start();

// Usage:
// node index.js --transport=stdio
// node index.js --transport=http --port=3000
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "start:stdio": "node src/index.js --transport=stdio",
    "start:http": "node src/index.js --transport=http --port=3000",
    "dev": "node --watch src/index.js --transport=stdio",
    "dev:http": "node --watch src/index.js --transport=http --port=3000"
  }
}
```

**packages/core/src/middleware/error-handler.js:**
```javascript
/**
 * @fileoverview Error handling middleware
 */

/**
 * Standard error response
 * @typedef {Object} ErrorResponse
 * @property {boolean} isError - Always true
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {Object} [details] - Additional error details
 */

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return {
        isError: true,
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  };
}

/**
 * Create user-friendly error messages
 * @param {Error} error - Original error
 * @returns {ErrorResponse}
 */
export function formatError(error) {
  const errorMap = {
    ENOTFOUND: 'Network error: Could not reach the service',
    ECONNREFUSED: 'Connection refused: Service is not available',
    ETIMEDOUT: 'Request timeout: Service took too long to respond',
    UNAUTHORIZED: 'Authentication failed: Invalid credentials',
    FORBIDDEN: 'Access denied: Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Invalid input parameters',
  };

  return {
    isError: true,
    code: error.code || 'UNKNOWN_ERROR',
    message: errorMap[error.code] || error.message,
    details: error.details,
  };
}
```

**packages/core/src/utils/http-client.js:**
```javascript
/**
 * @fileoverview HTTP client utility
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

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} path - Request path
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>}
   */
  async get(path, options) {
    return this.request('GET', path, options);
  }

  /**
   * POST request
   * @param {string} path - Request path
   * @param {Object} body - Request body
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>}
   */
  async post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }
}
```

---

## Phase 2: Server Implementations (Week 3-6)

### 2.1 API Server (Week 3)

**Purpose:** Generate MCP tools and resources from OpenAPI specifications

**Tasks:**
- [ ] Implement OpenAPI spec parser
- [ ] Create dynamic tool generation from API endpoints
- [ ] Implement resource endpoints for API documentation
- [ ] Add authentication handling
- [ ] Support pagination for list operations
- [ ] Create example OpenAPI specs for testing

**Key Features:**
- Parse OpenAPI 3.0/3.1 specifications
- Generate MCP tools for each API endpoint
- Support path parameters, query parameters, request bodies
- Expose API documentation as MCP resources
- Handle API authentication (API keys, OAuth, Bearer tokens)

**Example Tools Generated:**
- `{api_name}_get_{resource}` - GET operations
- `{api_name}_create_{resource}` - POST operations
- `{api_name}_update_{resource}` - PUT/PATCH operations
- `{api_name}_delete_{resource}` - DELETE operations
- `{api_name}_list_{resource}` - List operations with pagination

### 2.2 Docs Server (Week 4)

**Purpose:** Search and query markdown documentation

**Tasks:**
- [ ] Integrate markitdown for document conversion
- [ ] Implement full-text search with basic indexing
- [ ] Create semantic search capability
- [ ] Add query tool for specific document sections
- [ ] Support document metadata extraction
- [ ] Implement caching for converted documents

**Key Features:**
- Convert various formats to Markdown (PDF, DOCX, HTML, etc.)
- Full-text search across all documents
- Semantic search using embeddings (optional enhancement)
- Query specific sections or topics
- Return formatted Markdown responses

**MCP Tools:**
- `docs_search` - Search all documents
- `docs_query` - Query specific document or section
- `docs_convert` - Convert file to Markdown
- `docs_list` - List available documents

**MCP Resources:**
- `docs://document/{id}` - Individual document content
- `docs://index` - Document index with metadata

### 2.3 C4 Generator (Week 5)

**Purpose:** Generate C4 architecture diagrams from Markdown descriptions

**Tasks:**
- [ ] Implement Markdown parser for architecture descriptions
- [ ] Create C4 diagram builders (Context, Container, Component, Code)
- [ ] Support PlantUML C4 syntax output
- [ ] Add diagram templates for common patterns
- [ ] Implement validation for diagram structure

**Key Features:**
- Parse structured Markdown describing architecture
- Generate C4 diagrams at different levels
- Support multiple output formats (PlantUML, Mermaid, SVG)
- Provide templates for microservices, monoliths, etc.

**MCP Tools:**
- `c4_generate_context` - Generate system context diagram
- `c4_generate_container` - Generate container diagram
- `c4_generate_component` - Generate component diagram
- `c4_validate` - Validate architecture description

**Input Markdown Format:**
```markdown
# System: E-Commerce Platform

## Context
- User: Customer shopping online
- System: E-Commerce Platform
- External: Payment Gateway
- External: Email Service

## Relationships
- User uses E-Commerce Platform
- E-Commerce Platform uses Payment Gateway
- E-Commerce Platform uses Email Service
```

### 2.4 Mermaid Generator (Week 6)

**Purpose:** Generate Mermaid sequence and deployment diagrams from Markdown

**Tasks:**
- [ ] Implement sequence diagram generation
- [ ] Implement flow diagram generation
- [ ] Implement deployment diagram generation
- [ ] Support GitOps workflow diagrams
- [ ] Add diagram validation and linting

**Key Features:**
- Parse deployment descriptions
- Generate Mermaid syntax
- Support sequence, flow, and deployment diagrams
- Validate diagram syntax before returning

**MCP Tools:**
- `mermaid_sequence` - Generate sequence diagram
- `mermaid_flow` - Generate flowchart
- `mermaid_deployment` - Generate deployment diagram
- `mermaid_validate` - Validate Mermaid syntax

---

## Phase 3: Dashboard Development (Week 7-8)

### 3.1 Dashboard UI (Week 7)

**Purpose:** Visualize all deployed MCP servers and their capabilities

**Tasks:**
- [ ] Set up Vite + React project
- [ ] Create HTTP client for connecting to server /info endpoints
- [ ] Create layout and navigation
- [ ] Build server list component
- [ ] Create server detail view
- [ ] Implement tool explorer
- [ ] Add resource browser
- [ ] Create search and filter functionality
- [ ] Add connection status indicators

**Key Components:**
- **ServerList**: Grid/list of all available servers
- **ServerCard**: Individual server summary with status and transport info
- **ToolExplorer**: Browse and test tools interactively
- **ResourceBrowser**: View available resources
- **SearchBar**: Search across all servers, tools, resources
- **ConnectionStatus**: Real-time server availability

**Dashboard HTTP Client:**

```javascript
// src/services/mcp-client.js

/**
 * Client for connecting to MCP servers via HTTP
 */
export class MCPDashboardClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Fetch server info
   * @returns {Promise<Object>} Server metadata
   */
  async getInfo() {
    const response = await fetch(`${this.baseURL}/info`);
    if (!response.ok) {
      throw new Error(`Failed to fetch server info: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Check server health
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Connect to server via streamable HTTP (for future real-time features)
   * @returns {Promise<Response>} Fetch to MCP endpoint
   */
  connect() {
    return fetch(`${this.baseURL}/mcp`, { method: 'GET' });
  }
}

// Usage in React component
const servers = [
  { name: 'API Server', url: 'http://localhost:3000' },
  { name: 'Docs Server', url: 'http://localhost:3001' },
  { name: 'C4 Generator', url: 'http://localhost:3002' },
  { name: 'Mermaid Generator', url: 'http://localhost:3003' },
];

const Dashboard = () => {
  const [serverInfo, setServerInfo] = useState({});
  const [serverHealth, setServerHealth] = useState({});

  useEffect(() => {
    servers.forEach(async (server) => {
      const client = new MCPDashboardClient(server.url);
      
      // Get info
      const info = await client.getInfo();
      setServerInfo(prev => ({ ...prev, [server.name]: info }));
      
      // Check health
      const healthy = await client.checkHealth();
      setServerHealth(prev => ({ ...prev, [server.name]: healthy }));
    });
  }, []);

  // Component JSX...
};
```

**Technologies:**
- React 18+ with hooks
- React Router for navigation
- Tailwind CSS for styling
- Fetch API / EventSource for server communication

### 3.2 Server Info Endpoints (Week 8)

**Purpose:** Expose server metadata for dashboard consumption

**Tasks:**
- [ ] Implement `/info` endpoint in base server
- [ ] Return server metadata, capabilities, tools, resources
- [ ] Add server health status
- [ ] Include usage statistics (optional)
- [ ] Document endpoint contract

**Info Endpoint Response:**
```json
{
  "name": "api-server",
  "version": "1.0.0",
  "status": "healthy",
  "transport": "http",
  "endpoint": "http://localhost:3000/mcp",
  "capabilities": {
    "tools": true,
    "resources": true
  },
  "tools": [
    {
      "name": "github_create_issue",
      "description": "Create a new GitHub issue",
      "inputSchema": { 
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "body": { "type": "string" }
        },
        "required": ["title"]
      }
    }
  ],
  "resources": [
    {
      "uri": "github://docs",
      "name": "GitHub API Documentation",
      "description": "Complete API documentation"
    }
  ],
  "statistics": {
    "uptime": 3600,
    "requestCount": 150
  }
}
```

**For stdio transport, the response would be:**
```json
{
  "name": "api-server",
  "version": "1.0.0",
  "transport": "stdio",
  "capabilities": { ... },
  "tools": [ ... ],
  "resources": [ ... ]
}
```

Note: `/info` endpoint is only available when running in HTTP mode.

---

## Phase 4: Testing & Documentation (Week 9-10)

### 4.1 Testing Strategy (Week 9)

**Unit Tests:**
- [ ] Test core framework utilities
- [ ] Test each server's tool handlers
- [ ] Test error handling and edge cases
- [ ] Test input validation

**Integration Tests:**
- [ ] Test server startup and shutdown (both transports)
- [ ] Test tool execution end-to-end (stdio)
- [ ] Test tool execution end-to-end (HTTP)
- [ ] Test resource reading (both transports)
- [ ] Test dashboard /info endpoints
- [ ] Test concurrent connections (HTTP only)

**Transport-Specific Tests:**
- [ ] Test stdio transport with pipe input/output
- [ ] Test HTTP transport with streamable HTTP connections
- [ ] Test transport switching via environment variables
- [ ] Test health checks and /info endpoints (HTTP only)
- [ ] Test graceful shutdown for both transports

**Testing Tools:**
- Node.js built-in test runner
- MCP Inspector for manual testing (stdio)
- curl/Postman/HTTPie for HTTP endpoint testing
- HTTP client for streamable HTTP endpoint testing

**Test Examples:**

```javascript
// test/base-server.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { BaseMCPServer } from '@mcp/core';

test('server starts with stdio transport', async () => {
  const server = new TestServer({ transport: 'stdio' });
  // Test implementation
});

test('server starts with http transport', async () => {
  const server = new TestServer({ 
    transport: 'http',
    port: 3999,
  });
  await server.start();
  
  // Test health endpoint
  const response = await fetch('http://localhost:3999/health');
  assert.strictEqual(response.status, 200);
  
  await server.stop();
});

test('server info includes transport details', () => {
  const httpServer = new TestServer({ 
    transport: 'http',
    port: 3000,
    host: 'localhost',
  });
  
  const info = httpServer.getInfo();
  assert.strictEqual(info.transport, 'http');
  assert.strictEqual(info.endpoint, 'http://localhost:3000/mcp');
});
```

### 4.2 Documentation (Week 10)

**Tasks:**
- [ ] Write comprehensive README for each package
- [ ] Create architecture documentation
- [ ] Write deployment guides
- [ ] Create contribution guidelines
- [ ] Add JSDoc to all functions
- [ ] Create example use cases

**Documentation Structure:**
- Root README: Project overview, quick start
- Core README: Framework API reference
- Server READMEs: Individual server usage
- Dashboard README: UI setup and usage
- Architecture docs: System design decisions
- Deployment docs: Production deployment guide

---

## Phase 5: Deployment & DevOps (Week 11-12)

### 5.1 Docker Containerization (Week 11)

**Tasks:**
- [ ] Create Dockerfile for each server
- [ ] Create docker-compose.yml for local development
- [ ] Implement health check endpoints
- [ ] Add environment variable configuration
- [ ] Create multi-stage builds for optimization

**Example Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/servers/api-server/package.json ./packages/servers/api-server/

# Install dependencies
RUN npm ci --workspaces

# Copy source code
COPY packages/ ./packages/

# Build
RUN npm run build -w @mcp/api-server

# Expose HTTP port (for streamable HTTP transport)
EXPOSE 3000

# Environment variables for transport configuration
ENV TRANSPORT=http
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "packages/servers/api-server/src/index.js"]
```

**Example docker-compose.yml:**
```yaml
version: '3.8'

services:
  api-server:
    build:
      context: .
      dockerfile: packages/servers/api-server/Dockerfile
    environment:
      - TRANSPORT=http
      - PORT=3000
      - HOST=0.0.0.0
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  docs-server:
    build:
      context: .
      dockerfile: packages/servers/docs-server/Dockerfile
    environment:
      - TRANSPORT=http
      - PORT=3001
      - HOST=0.0.0.0
    ports:
      - "3001:3001"
    volumes:
      - ./docs:/app/docs:ro

  c4-generator:
    build:
      context: .
      dockerfile: packages/servers/c4-generator/Dockerfile
    environment:
      - TRANSPORT=http
      - PORT=3002
      - HOST=0.0.0.0
    ports:
      - "3002:3002"

  mermaid-generator:
    build:
      context: .
      dockerfile: packages/servers/mermaid-generator/Dockerfile
    environment:
      - TRANSPORT=http
      - PORT=3003
      - HOST=0.0.0.0
    ports:
      - "3003:3003"

  dashboard:
    build:
      context: .
      dockerfile: packages/dashboard/Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_SERVER_URL=http://api-server:3000
      - VITE_DOCS_SERVER_URL=http://docs-server:3001
      - VITE_C4_SERVER_URL=http://c4-generator:3002
      - VITE_MERMAID_SERVER_URL=http://mermaid-generator:3003
    depends_on:
      - api-server
      - docs-server
      - c4-generator
      - mermaid-generator
```

### 5.2 CI/CD Pipeline (Week 12)

**Tasks:**
- [ ] Set up GitHub Actions workflow
- [ ] Implement automated testing
- [ ] Add code quality checks (ESLint, Prettier)
- [ ] Configure Docker image building
- [ ] Set up deployment automation
- [ ] Add release versioning

**GitHub Actions Workflow:**
```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker-compose build
```

---

## Phase 6: Enhancement & Optimization (Week 13+)

### 6.1 Advanced Features

**Potential Enhancements:**
- [ ] Add authentication/authorization layer
- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] Support server clustering
- [ ] Implement telemetry and monitoring
- [ ] Add GraphQL support for dashboard
- [ ] Create CLI tool for server generation
- [ ] Add plugin system for extensibility

### 6.2 Performance Optimization

**Tasks:**
- [ ] Profile server performance
- [ ] Optimize tool execution time
- [ ] Implement connection pooling
- [ ] Add request queuing for high load
- [ ] Optimize Docker image sizes
- [ ] Implement lazy loading in dashboard

---

## Development Standards

### JSDoc Style Guide

**Function Documentation:**
```javascript
/**
 * Converts a document to Markdown format
 * 
 * @param {string} filePath - Path to the input file
 * @param {Object} [options] - Conversion options
 * @param {boolean} [options.preserveImages=true] - Keep image references
 * @param {string} [options.outputFormat='gfm'] - Markdown flavor (gfm, commonmark)
 * @returns {Promise<string>} Converted Markdown content
 * @throws {Error} If file cannot be read or format is unsupported
 * 
 * @example
 * const markdown = await convertToMarkdown('./doc.pdf', {
 *   preserveImages: true,
 *   outputFormat: 'gfm'
 * });
 */
async function convertToMarkdown(filePath, options = {}) {
  // Implementation
}
```

**Class Documentation:**
```javascript
/**
 * Base MCP server implementation
 * 
 * @class
 * @abstract
 * 
 * @example
 * class MyServer extends BaseMCPServer {
 *   constructor() {
 *     super({
 *       name: 'my-server',
 *       version: '1.0.0'
 *     });
 *   }
 * }
 */
export class BaseMCPServer {
  // Implementation
}
```

### Code Style

**Naming Conventions:**
- Files: kebab-case (`base-server.js`)
- Functions: camelCase (`convertToMarkdown`)
- Classes: PascalCase (`BaseMCPServer`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Private: prefix with underscore (`_internalMethod`)

**Error Handling:**
```javascript
// Always use descriptive error messages
throw new Error('Failed to parse OpenAPI spec: Invalid JSON at line 42');

// Include actionable suggestions
throw new Error(
  'Authentication failed. Please check your API key. ' +
  'Get your API key from https://example.com/settings'
);
```

---

## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Server-Specific Dependencies

**API Server:**
- `swagger-parser` - OpenAPI spec parsing
- `openapi-types` - TypeScript types

**Docs Server:**
- `markitdown` - Document conversion
- `flexsearch` - Full-text search
- `@xenova/transformers` - Embeddings (optional)

**C4 Generator:**
- `plantuml-encoder` - PlantUML encoding
- `marked` - Markdown parsing

**Mermaid Generator:**
- `mermaid` - Diagram validation
- `marked` - Markdown parsing

**Dashboard:**
- `react` + `react-dom`
- `react-router-dom`
- `tailwindcss`
- `vite`

---

## Deployment Architecture

### Local Development

```
Developer Machine
├── npm workspaces
├── Each server runs via stdio transport
│   └── Ideal for Claude Desktop integration
└── Dashboard runs on localhost:5173
    └── Can connect to HTTP servers for testing
```

### Remote/Production Deployment

```
Cloud Provider
├── Container Registry
│   ├── api-server:latest (HTTP mode)
│   ├── docs-server:latest (HTTP mode)
│   ├── c4-generator:latest (HTTP mode)
│   └── mermaid-generator:latest (HTTP mode)
├── Orchestration (Docker Compose / Kubernetes)
│   ├── Server instances with health checks
│   │   └── All running on streamable HTTP transport
│   ├── Reverse proxy (nginx)
│   │   └── Routes /api-server/mcp, /docs-server/mcp, etc.
│   └── Load balancer
└── Dashboard hosted on CDN
    └── Static React build
    └── Connects to servers via HTTP endpoints
```

### Transport Selection Guide

| Use Case | Transport | Reason |
|----------|-----------|--------|
| Local development | stdio | Simple, direct, no network config |
| Claude Desktop | stdio | Native integration method |
| Remote deployment | Streamable HTTP | Network accessible, scalable |
| Dashboard integration | Streamable HTTP | Browser compatibility |
| CLI tools | stdio | Pipe-friendly, scriptable |
| Microservices | Streamable HTTP | Service-to-service communication |
| Testing/debugging | Either | Use stdio for simplicity |

---

## Success Criteria

### Phase 1 Success
- ✅ Core framework package published to npm
- ✅ Base server class tested and documented
- ✅ Both stdio and HTTP transports implemented and tested
- ✅ Transport switching works via configuration
- ✅ Middleware system functional
- ✅ Health check and info endpoints working (HTTP mode)

### Phase 2 Success
- ✅ All four servers implemented and tested
- ✅ Each server has at least 5 working tools
- ✅ Servers can run independently with both transports
- ✅ CLI arguments for transport selection working

### Phase 3 Success
- ✅ Dashboard displays all servers via HTTP endpoints
- ✅ Tools and resources are browsable
- ✅ /info endpoints return correct data
- ✅ Connection status indicators work correctly

### Phase 4 Success
- ✅ >80% code coverage including transport tests
- ✅ All packages documented with transport usage examples
- ✅ Deployment guide complete with transport recommendations

### Phase 5 Success
- ✅ Docker images build successfully with HTTP transport
- ✅ CI/CD pipeline passes for stdio and streamable HTTP transports
- ✅ Servers deployable to production (HTTP)
- ✅ Local development setup documented (stdio)

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP SDK breaking changes | High | Pin SDK version, monitor releases |
| Performance issues with large docs | Medium | Implement pagination, caching |
| OpenAPI spec parsing complexity | Medium | Use battle-tested parser library |
| Dashboard state management | Low | Keep UI simple, use React hooks |

### Process Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | High | Stick to MVP, track enhancements separately |
| Incomplete documentation | Medium | Documentation checkpoint each phase |
| Testing gaps | Medium | Required test coverage before merge |

---

## Timeline Summary

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1: Foundation | 2 weeks | Core framework ready |
| Phase 2: Servers | 4 weeks | All servers functional |
| Phase 3: Dashboard | 2 weeks | UI complete |
| Phase 4: Testing & Docs | 2 weeks | Production-ready docs |
| Phase 5: Deployment | 2 weeks | Fully deployable |
| Phase 6: Enhancement | Ongoing | Advanced features |

**Total MVP Timeline: 12 weeks**

---

## Next Steps

1. **Immediate Actions:**
   - Set up GitHub repository
   - Initialize npm workspaces
   - Create project structure
   - Set up ESLint and Prettier
   - Configure dual transport support in core framework

2. **Week 1 Goals:**
   - Complete core framework package with stdio and HTTP transports
   - Create base server class with transport switching
   - Implement basic middleware
   - Write initial documentation
   - Test both transports independently

3. **Transport Configuration Examples:**

```bash
# Development with stdio
npm run dev:stdio

# Development with HTTP
npm run dev:http

# Production with environment variables
TRANSPORT=http PORT=3000 npm start

# Docker with HTTP
docker run -e TRANSPORT=http -e PORT=3000 -p 3000:3000 mcp-server

# Multiple servers with docker-compose (HTTP)
docker-compose up
```

4. **Review Points:**
   - End of Phase 1: Architecture review, transport implementation validation
   - End of Phase 2: Server functionality review, both transports tested
   - End of Phase 3: UI/UX review, dashboard connectivity confirmed
   - End of Phase 4: Code quality review, comprehensive transport testing
   - End of Phase 5: Deployment readiness review, production transport configuration

---

## Resources

### MCP Documentation
- Official Docs: https://modelcontextprotocol.io
- SDK GitHub: https://github.com/modelcontextprotocol/typescript-sdk
- Specification: https://spec.modelcontextprotocol.io

### MCP Development Tools
- MCP Inspector: `npx @modelcontextprotocol/inspector`
  - Supports stdio transport for testing
- OpenAPI Editor: https://editor.swagger.io
- Mermaid Live Editor: https://mermaid.live
- HTTPie: For testing HTTP endpoints (`http localhost:3000/info`)
- EventSource debugger: Browser DevTools Network tab

### MCP Transport Documentation
- **stdio transport**: Standard input/output, suitable for local processes
  - Use with Claude Desktop, CLI tools
  - No network configuration needed
- **Streamable HTTP transport**: Single-endpoint HTTP transport (not SSE)
  - Enables remote connections, web clients
  - Requires HTTP server setup
  - Supports health checks and info endpoints

### References
- OpenAPI 3.1 Spec: https://swagger.io/specification/
- C4 Model: https://c4model.com
- Mermaid Docs: https://mermaid.js.org

---

## Appendix: Example Tool Implementations

### Example 1: API Server Tool

```javascript
/**
 * Dynamically generated tool from OpenAPI operation
 * @param {Object} operation - OpenAPI operation object
 * @returns {Object} MCP tool definition
 */
function generateToolFromOperation(operation) {
  return {
    name: `${operation.operationId}`,
    description: operation.summary || operation.description,
    inputSchema: {
      type: 'object',
      properties: extractParameters(operation.parameters),
      required: extractRequired(operation.parameters),
    },
    handler: async (args) => {
      // Make API call
      // Return formatted response
    },
  };
}
```

### Example 2: Docs Server Search Tool

```javascript
/**
 * Search tool for document server
 */
const searchTool = {
  name: 'docs_search',
  description: 'Search across all markdown documents',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 10,
      },
    },
    required: ['query'],
  },
  handler: async ({ query, limit = 10 }) => {
    const results = await searchIndex.search(query, { limit });
    return {
      content: [
        {
          type: 'text',
          text: formatSearchResults(results),
        },
      ],
    };
  },
};
```

### Example 3: C4 Generator Tool

```javascript
/**
 * Generate C4 context diagram tool
 */
const c4ContextTool = {
  name: 'c4_generate_context',
  description: 'Generate a C4 system context diagram from markdown',
  inputSchema: {
    type: 'object',
    properties: {
      markdown: {
        type: 'string',
        description: 'Markdown description of the system',
      },
      format: {
        type: 'string',
        enum: ['plantuml', 'mermaid', 'svg'],
        default: 'plantuml',
      },
    },
    required: ['markdown'],
  },
  handler: async ({ markdown, format = 'plantuml' }) => {
    const parsed = parseArchitectureMarkdown(markdown);
    const diagram = generateC4Context(parsed, format);
    return {
      content: [
        {
          type: 'text',
          text: `\`\`\`${format}\n${diagram}\n\`\`\``,
        },
      ],
    };
  },
};
```

---

## Conclusion

This development plan provides a structured approach to building a comprehensive MCP monorepo framework. By following these phases, you'll create a reusable, scalable foundation for multiple MCP servers with shared infrastructure, clear patterns, and independent deployment capabilities.

The framework balances flexibility (allowing custom server implementations) with consistency (shared core functionality), while the showcase dashboard provides visibility into all available servers and their capabilities.

**Key Success Factors:**
1. Strong core framework foundation
2. Clear separation of concerns
3. Comprehensive documentation
4. Robust testing strategy
5. Streamlined deployment process
6. Active monitoring and iteration

Start with Phase 1 to establish the foundation, then progressively build out each server type while maintaining high code quality and documentation standards throughout the development process.
