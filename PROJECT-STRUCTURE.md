# MCP Monorepo - Project Structure

## Overview
Complete file structure of the MCP monorepo framework after Session 1 (Phase 1 complete).

## Directory Tree

```
mcp-monorepo/
├── .github/
│   └── copilot-instructions.md    # Copilot guidance; always reference
├── packages/
│   ├── core/                       # @mcp/core - Shared framework
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.js
│   │   │   │   ├── logger.js
│   │   │   │   └── index.js
│   │   │   ├── utils/
│   │   │   │   ├── http-client.js
│   │   │   │   ├── formatters.js
│   │   │   │   └── index.js
│   │   │   ├── validators/
│   │   │   │   └── index.js
│   │   │   ├── base-server.js     # BaseMCPServer class
│   │   │   └── index.js           # Main exports
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── servers/
│       └── echo-server/            # @mcp/echo-server - Sample server
│           ├── src/
│           │   └── index.js        # EchoServer implementation
│           ├── package.json
│           └── README.md
│
├── node_modules/                   # Dependencies (172 packages)
├── .gitignore
├── .npmrc
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── package.json                    # Root workspace config
├── package-lock.json
├── README.md                       # Main documentation
│
├── AGENTS.md                       # Agent activity log ⭐
├── HANDOFF.md                      # Team handoff doc ⭐
├── prompt.md                       # Session continuity ⭐
└── mcp-monorepo-development-plan.md  # Complete dev plan ⭐
```

⭐ = Essential tracking files - read these first each session

## Package Details

### @mcp/core (Core Framework)
**Location**: `packages/core/`
**Purpose**: Shared framework for building MCP servers
**Key Exports**:
- `BaseMCPServer` - Base class for all servers
- `TransportType` - Transport enumeration (STDIO, HTTP)
- Middleware: `withErrorHandling`, `formatError`, `Logger`
- Utils: `HttpClient`, formatters, validators

**Dependencies**:
- @modelcontextprotocol/sdk: ^1.0.4

### @mcp/echo-server (Sample Server)
**Location**: `packages/servers/echo-server/`
**Purpose**: Sample implementation demonstrating framework usage
**Tools**:
- `echo` - Echoes back text
- `reverse` - Reverses text
- `uppercase` - Converts text to uppercase

**Resources**:
- `echo://info` - Server information

**Scripts**:
```bash
npm run start:stdio -w @mcp/echo-server  # stdio mode
npm run start:http -w @mcp/echo-server   # HTTP mode (port 3000)
npm run dev -w @mcp/echo-server          # Dev mode with watch
```

## Configuration Files

### package.json (Root)
- Defines npm workspaces
- Global scripts (lint, format, test)
- DevDependencies (ESLint, Prettier)

### eslint.config.js
- ESLint 9.x flat config
- ES2024 + ES Modules
- Custom rules for MCP development

### .prettierrc
- Code formatting rules
- Single quotes, trailing commas
- 2-space indentation

## Key Commands

```bash
# Installation
npm install                          # Install all dependencies

# Development
npm run lint                         # Lint all packages
npm run format                       # Format all packages
npm run test                         # Run all tests

# Servers
npm run start:stdio -w PACKAGE      # Start server in stdio mode
npm run start:http -w PACKAGE       # Start server in HTTP mode

# Examples
npm run start:http -w @mcp/echo-server
curl http://localhost:3000/health
curl http://localhost:3000/info
```

## Transport Endpoints (HTTP Mode)

When running in HTTP mode, servers expose:

- `POST /mcp` - MCP protocol endpoint (StreamableHTTPServerTransport)
- `GET /info` - Server metadata (name, version, tools, resources)
- `GET /health` - Health check (status indicator)

All endpoints include CORS headers.

## Development Patterns

### Creating a New Server

1. **Structure**:
   ```bash
   packages/servers/my-server/
   ├── src/
   │   └── index.js
   ├── package.json
   └── README.md
   ```

2. **Package.json Template**:
   ```json
   {
     "name": "@mcp/my-server",
     "version": "1.0.0",
     "type": "module",
     "dependencies": {
       "@mcp/core": "*"
     }
   }
   ```

3. **Implementation Pattern** (see echo-server):
   ```javascript
   import { BaseMCPServer } from '@mcp/core';
   
   class MyServer extends BaseMCPServer {
     constructor(config) {
       super({ name: 'my-server', version: '1.0.0', ...config });
     }
     
     setupHandlers() {
       // Register tools and resources
       this.registerTool({ ... });
       this.registerResource({ ... });
     }
   }
   
   // CLI args + start server
   ```

## Next Steps

### Pending Packages
- `packages/servers/api-server/` - OpenAPI-based API client
- `packages/servers/docs-server/` - Document search and query
- `packages/servers/c4-generator/` - C4 diagram generation
- `packages/servers/mermaid-generator/` - Mermaid diagram generation
- `packages/dashboard/` - Vite + React showcase dashboard

### Pending Documentation
- `docs/architecture.md`
- `docs/transport-guide.md`
- `docs/deployment.md`
- `docs/contributing.md`

## Status Summary

✅ **Complete**:
- Project structure
- Core framework
- Sample server
- Configuration
- Dependencies

⏳ **Pending**:
- Additional servers
- Dashboard
- Documentation
- Testing
- CI/CD

---

**Last Updated**: February 12, 2026
**Phase 1 Status**: ✅ Complete
**Current Focus**: Phase 2 - Server Implementations
