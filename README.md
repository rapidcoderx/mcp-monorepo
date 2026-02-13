# MCP Monorepo Framework

A comprehensive monorepo framework for building reusable Model Context Protocol (MCP) servers with dual transport support.

## Overview

This framework provides a robust foundation for creating MCP servers that can operate in both **local** (stdio) and **remote** (HTTP) modes, enabling flexible deployment options for AI assistants and LLM integrations.

### Key Features

- 🚀 **Dual Transport Support**: Run servers via stdio (local) or HTTP (remote)
- 📦 **Monorepo Architecture**: Shared core framework with independent server implementations
- 🔧 **Easy Development**: Simple API for creating new MCP servers
- 🎯 **Type Safety**: JSDoc annotations for better IDE support
- 🧪 **Built-in Testing**: Testing utilities and patterns
- 📊 **Showcase Dashboard**: Visual interface to explore and test servers

## Architecture

```
mcp-monorepo/
├── packages/
│   ├── core/              # Shared framework & utilities
│   ├── servers/           # MCP server implementations
│   │   ├── api-server/    # OpenAPI-based API server
│   │   ├── docs-server/   # Document search & query server
│   │   ├── c4-generator/  # C4 diagram generator
│   │   └── mermaid-generator/  # Mermaid diagram generator
│   └── dashboard/         # Interactive showcase dashboard
└── docs/                  # Documentation
```

## Transport Modes

### stdio Transport (Local)
- For local development and testing
- Direct integration with Claude Desktop
- Process-based communication
- No network configuration needed

### HTTP Transport (Remote)
- For production deployments
- Web-based clients and dashboards
- RESTful endpoints
- Streamable MCP protocol over HTTP

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-monorepo.git
cd mcp-monorepo

# Install all dependencies
npm install
```

### Quick Start Demo

Start the echo server and interactive dashboard together:

```bash
npm run start:demo
```

This will start:
- **Echo Server** at http://localhost:3000
- **Dashboard** at http://localhost:5173

Open http://localhost:5173 in your browser to:
- ✅ Test MCP tools interactively
- ✅ Validate server endpoints
- ✅ Inspect resources
- ✅ Execute JSON-RPC requests

### Running Servers

Each server can be started in either transport mode:

```bash
# stdio mode (local)
npm run start:stdio -w @mcp/echo-server

# HTTP mode (remote)
npm run start:http -w @mcp/echo-server
```

### MCP Server Endpoints

When running in HTTP mode, servers expose these endpoints:

- **GET /health** - Health check (returns `{"status": "healthy", "name": "server-name"}`)
- **GET /info** - Server information (name, version, tools, resources, capabilities)
- **POST /mcp** - MCP protocol endpoint (JSON-RPC 2.0 over HTTP)

### Available Servers

- **Echo Server**: Sample implementation with text manipulation tools (echo, reverse, uppercase)
- **Dashboard**: Interactive web UI for testing and validating MCP servers

Coming soon:
- **API Server**: Dynamic API client from OpenAPI specifications
- **Docs Server**: Search and query documentation and markdown files
- **C4 Generator**: Generate C4 architecture diagrams
- **Mermaid Generator**: Create various Mermaid diagrams

## Dashboard Features

The integrated dashboard ([packages/dashboard/](packages/dashboard/)) provides:

- 🔌 **Server Connection**: Connect to any MCP server via HTTP
- 🛠️ **Tool Inspector**: Browse, test, and validate MCP tools interactively
- 📦 **Resource Viewer**: View and inspect server resources
- 🧪 **Endpoint Tester**: Test HTTP endpoints with custom JSON-RPC requests
- 📊 **Real-time Validation**: Instant feedback on tool execution
- 📝 **Protocol Compliance**: Validate MCP protocol implementation

### Using the Dashboard

```bash
# Start server and dashboard together
npm run start:demo

# Or start dashboard only (connects to localhost:3000 by default)
npm run dev:dashboard
```

Open http://localhost:5173 and:
1. Connect to your MCP server (default: http://localhost:3000)
2. Browse available tools and resources
3. Execute tools with custom parameters
4. View formatted responses
5. Test endpoints directly with JSON-RPC requests

## Development

### Project Structure

- **packages/core**: Base MCP server class and shared utilities
- **packages/servers/**: Individual MCP server implementations
- **packages/dashboard**: React-based UI for testing servers

### Creating a New Server

1. Create a new directory in `packages/servers/`
2. Extend `BaseMCPServer` from `@mcp/core`
3. Implement the `setupHandlers()` method
4. Register tools and resources
5. Test both transport modes

Example:

```javascript
import { BaseMCPServer } from '@mcp/core';

export class MyServer extends BaseMCPServer {
  constructor(config) {
    super({
      name: 'my-server',
      version: '1.0.0',
      ...config,
    });echo server (HTTP mode)
npm run dev:echo

# Start dashboard
npm run dev:dashboard

# Start both server and dashboard
npm run dev:all
# or
npm run start:demo

  setupHandlers() {
    this.registerTool({
      name: 'my-tool',
      description: 'Tool description',
      inputSchema: { /* JSON Schema */ },
      handler: async (params) => {
        // Implementation
        return { content: [{ type: 'text', text: 'Result' }] };
      },
    });
  }
}
```

### Development Commands

```bash
# Lint all code
npm run lint

# Format all code
npm run format

# Run tests
npm run test

# Clean all build artifacts
npm run clean

# Start dashboard
npm run dev:dashboard
```

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Transport Guide](docs/transport-guide.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Language**: JavaScript (ESM)
- **MCP SDK**: @modelcontextprotocol/sdk
- **Frontend**: Vite + React
- **Monorepo**: npm workspaces
- **Linting**: ESLint
- **Formatting**: Prettier

## Session Tracking

This project uses structured session tracking for development:

- **prompt.md**: Session continuity tracker
- **AGENTS.md**: Agent activity log
- **HANDOFF.md**: Team handoff document

## License

MIT

## Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## Support

For questions and support, please open an issue on GitHub.

---

**Built with ❤️ for the MCP ecosystem**
