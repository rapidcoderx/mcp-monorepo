# Copilot Instructions for MCP Monorepo Framework

## Project Overview

This is a monorepo framework for creating reusable MCP (Model Context Protocol) servers with dual transport support (stdio and HTTP).

**Tech Stack**: Plain JavaScript (ESM), Node.js LTS, npm workspaces, @modelcontextprotocol/sdk, Vite + React

---

## Required Context Files

**ALWAYS read these files at the start of every session:**

1. **prompt.md** - Session continuity tracker
   - What was accomplished in previous session
   - What needs to be done next
   - Quick start guide for current work

2. **AGENTS.md** - Agent activity log
   - All agent activities and decisions
   - Timeline of changes
   - Status of all tasks

3. **HANDOFF.md** - Team handoff document
   - Current work session context
   - Completed, in-progress, and pending items
   - Blockers and open questions

4. **mcp-monorepo-development-plan.md** - Complete development plan
   - Full architecture and design
   - Phase-by-phase implementation guide
   - Code examples and patterns

---

## Workflow Guidelines

### Starting a Session:
1. Read prompt.md to understand current state
2. Check AGENTS.md for recent activities
3. Review HANDOFF.md for context and blockers
4. Reference development plan for implementation details

### During Work:
- Update AGENTS.md with activities and decisions
- Make incremental commits with clear messages
- Follow established patterns from development plan
- Test both stdio and HTTP transports when working on servers

### Ending a Session:
1. Update AGENTS.md with completed activities
2. Update HANDOFF.md with current status
3. Update prompt.md with:
   - What was accomplished this session
   - What needs to be done next session
   - Any important context or decisions
4. Commit all changes

---

## Code Standards

### JavaScript/ESM:
- Use ES Modules (`import`/`export`)
- Add `"type": "module"` to all package.json files
- Use JSDoc for type documentation
- Follow ESLint configuration

### File Structure:
```
mcp-monorepo/
├── packages/
│   ├── core/              # Shared framework
│   ├── servers/           # MCP server implementations
│   └── dashboard/         # Showcase dashboard
├── docs/                  # Documentation
├── .github/
│   ├── copilot-instructions.md  # This file
│   └── workflows/         # CI/CD
├── AGENTS.md              # Agent activity log
├── HANDOFF.md             # Team handoff doc
├── prompt.md              # Session continuity
└── mcp-monorepo-development-plan.md
```

### Architecture Principles:
1. **Dual Transport**: Every server supports both stdio (local) and HTTP (remote)
2. **Shared Core**: All servers extend BaseMCPServer from @mcp/core
3. **Independent Deployment**: Each server can be deployed separately
4. **npm Workspaces**: Shared dependencies, independent versioning

### Naming Conventions:
- Packages: `@mcp/package-name`
- Files: kebab-case (`base-server.js`)
- Classes: PascalCase (`BaseMCPServer`)
- Functions: camelCase (`registerTool`)
- Constants: UPPER_SNAKE_CASE (`TransportType`)

---

## Implementation Guidance

### Creating a New MCP Server:
1. Create directory in `packages/servers/`
2. Extend `BaseMCPServer` from `@mcp/core`
3. Implement `setupHandlers()` method
4. Register tools and resources
5. Add CLI argument parsing for transport selection
6. Test both stdio and HTTP modes

### Example Server Structure:
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
      description: 'Tool description',
      inputSchema: { /* JSON Schema */ },
      handler: async (params) => { /* implementation */ },
    });
  }
}
```

### Transport Selection:
```javascript
// In server's index.js
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
  host: '0.0.0.0',
});

await server.start();
```

---

## Testing Approach

### Manual Testing:
- **stdio mode**: Use with Claude Desktop or CLI
- **HTTP mode**: Use curl, dashboard, or HTTP clients

### Test Commands:
```bash
# stdio mode
npm run start:stdio -w @mcp/my-server

# HTTP mode
npm run start:http -w @mcp/my-server

# Test HTTP endpoint
curl http://localhost:3000/health
curl http://localhost:3000/info
```

---

## Common Tasks

### Adding a New Tool:
1. Define in server's `setupHandlers()`
2. Add input validation
3. Implement handler logic
4. Update server's `getTools()` method
5. Test with both transports

### Adding a New Resource:
1. Define in server's `setupHandlers()`
2. Implement read handler
3. Update server's `getResources()` method
4. Test access from clients

### Adding Middleware:
1. Create in `packages/core/src/middleware/`
2. Export from `packages/core/src/index.js`
3. Document usage in README
4. Add to BaseMCPServer if applicable

---

## Debugging Tips

### Common Issues:
1. **Transport not working**: Check transport parameter in config
2. **Module not found**: Verify workspace dependencies are installed
3. **HTTP CORS**: Check CORS headers in HTTP transport
4. **stdio hangs**: Ensure proper stdio transport setup

### Debugging Commands:
```bash
# Check workspace structure
npm ls --workspaces

# Install all dependencies
npm install

# Verify ESM imports
node --check src/index.js

# Run with debug logging
NODE_OPTIONS='--trace-warnings' npm start
```

---

## Documentation Standards

### JSDoc Format:
```javascript
/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {ReturnType} Return description
 * @throws {ErrorType} Error description
 * @example
 * // Usage example
 * myFunction('example');
 */
```

### README Structure:
- Overview and purpose
- Installation instructions
- Usage examples (stdio and HTTP)
- Configuration options
- API documentation
- Contributing guidelines

---

## Important Reminders

1. **Always read prompt.md first** to understand current session context
2. **Update tracking files** (AGENTS.md, HANDOFF.md, prompt.md) regularly
3. **Follow development plan** for implementation details
4. **Test both transports** when working on servers
5. **Use ESM** throughout (import/export, not require)
6. **Document with JSDoc** for all public functions
7. **Keep core lean** - shared code only
8. **Independent servers** - each server should work standalone

---

## Quick Reference Links

- MCP SDK: @modelcontextprotocol/sdk
- Development Plan: [mcp-monorepo-development-plan.md](../mcp-monorepo-development-plan.md)
- Session Tracking: [prompt.md](../prompt.md)
- Agent Log: [AGENTS.md](../AGENTS.md)
- Handoff Doc: [HANDOFF.md](../HANDOFF.md)

---

Last Updated: February 12, 2026

