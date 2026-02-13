# @mcp/core

Core framework for building Model Context Protocol (MCP) servers with dual transport support (stdio and HTTP).

## Features

- 🔄 **Dual Transport**: Support for both stdio and HTTP transports
- 🎯 **Base Server Class**: Simple abstraction for creating MCP servers
- 🛠️ **Middleware System**: Extensible middleware for logging, auth, and error handling
- 📦 **Utility Functions**: Common utilities for HTTP clients, formatting, and validation
- 📝 **JSDoc Documentation**: Full type hints for better IDE support

## Installation

```bash
npm install @mcp/core
```

## Usage

### Creating a Server

```javascript
import { BaseMCPServer } from '@mcp/core';

export class MyServer extends BaseMCPServer {
  constructor(config) {
    super({
      name: 'my-server',
      version: '1.0.0',
      ...config,
    });
  }

  setupHandlers() {
    // Register tools
    this.registerTool({
      name: 'my-tool',
      description: 'My tool description',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
        required: ['input'],
      },
      handler: async (params) => {
        return {
          content: [{
            type: 'text',
            text: `Processed: ${params.input}`,
          }],
        };
      },
    });
  }
}
```

### Starting the Server

#### stdio Mode (Local)

```javascript
const server = new MyServer({
  transport: 'stdio',
});

await server.start();
```

#### HTTP Mode (Remote)

```javascript
const server = new MyServer({
  transport: 'http',
  port: 3000,
  host: '0.0.0.0',
});

await server.start();
```

### CLI Arguments

```javascript
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    transport: { type: 'string', default: 'stdio' },
    port: { type: 'string', default: '3000' },
  },
});

const server = new MyServer({
  transport: values.transport,
  port: parseInt(values.port),
});

await server.start();
```

Run with:
```bash
node index.js --transport=stdio
node index.js --transport=http --port=3000
```

## API Reference

### BaseMCPServer

Base class for all MCP servers.

#### Constructor

```javascript
new BaseMCPServer(config)
```

**Parameters:**
- `config.name` (string): Server name
- `config.version` (string): Server version
- `config.transport` (string): Transport type ('stdio' or 'http')
- `config.port` (number): HTTP port (HTTP mode only)
- `config.host` (string): HTTP host (HTTP mode only)
- `config.capabilities` (object): Server capabilities

#### Methods

##### `setupHandlers()`
Abstract method to be implemented by subclasses. Register tools and resources here.

##### `registerTool(tool)`
Register an MCP tool.

**Parameters:**
- `tool.name` (string): Tool name
- `tool.description` (string): Tool description
- `tool.inputSchema` (object): JSON Schema for inputs
- `tool.handler` (function): Async function to handle tool calls

##### `registerResource(resource)`
Register an MCP resource.

**Parameters:**
- `resource.uri` (string): Resource URI
- `resource.name` (string): Resource name
- `resource.description` (string): Resource description
- `resource.handler` (function): Async function to read resource

##### `start(transportType)`
Start the server with the configured or specified transport.

**Parameters:**
- `transportType` (string, optional): Override transport type

##### `stop()`
Stop the server gracefully.

##### `getInfo()`
Get server information for dashboards and clients.

## Transport Types

### stdio Transport
- For local development and Claude Desktop integration
- Standard input/output communication
- Process-based

### HTTP Transport
- For remote deployment and web clients
- RESTful endpoints
- Streamable MCP protocol over HTTP

#### HTTP Endpoints

- `POST /mcp` - MCP protocol endpoint
- `GET /info` - Server information
- `GET /health` - Health check

## Middleware

Available middleware:

- **Error Handler**: Wrap handlers with error handling
- **Logger**: Request/response logging
- **Validator**: Input validation

Import from:
```javascript
import { withErrorHandling, formatError } from '@mcp/core/middleware';
```

## Utilities

Available utilities:

- **HTTP Client**: Simple HTTP client with retry logic
- **Formatters**: JSON and Markdown formatters
- **Validators**: Input validation helpers

Import from:
```javascript
import { HttpClient } from '@mcp/core/utils';
```

## License

MIT
