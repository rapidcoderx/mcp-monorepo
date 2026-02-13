# Claude Code Review Guide

## Project Overview

**MCP Monorepo Framework** - A monorepo framework for building reusable MCP (Model Context Protocol) servers with dual transport support (stdio and HTTP).

**Tech Stack:**
- **Backend**: Node.js (ESM), @modelcontextprotocol/sdk v1.26.0
- **Frontend**: React 19.2.4 + Vite 7.3.1
- **Server**: Express 4.21.2
- **Language**: Plain JavaScript with JSDoc documentation
- **Package Manager**: npm workspaces
- **Code Style**: ESLint 10 + Prettier 3.8.1

---

## Code Review Checklist

### 1. Architecture & Design

- [ ] **Dual Transport Pattern**: Does the server support both stdio and HTTP transports?
- [ ] **BaseMCPServer Extension**: Does the implementation extend `BaseMCPServer` from `@mcp/core`?
- [ ] **Independent Deployment**: Can the component be deployed standalone?
- [ ] **Proper Separation**: Is business logic separated from transport layer?

### 2. Code Quality

- [ ] **ESM Compliance**: Uses `import`/`export` (not `require`)
- [ ] **JSDoc Documentation**: All public functions have proper JSDoc comments
- [ ] **Error Handling**: Errors are caught and formatted using `formatError` middleware
- [ ] **Type Safety**: JSDoc types are accurate and complete
- [ ] **DRY Principle**: No code duplication, reusable utilities used

### 3. MCP SDK Integration

- [ ] **Schema Objects**: Uses schema objects (not string literals)
  ```javascript
  // ✅ CORRECT
  import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
  this.server.setRequestHandler(ListToolsRequestSchema, async () => {});
  
  // ❌ INCORRECT
  this.server.setRequestHandler('tools/list', async () => {});
  ```

- [ ] **Handler Registration**: Tools and resources registered via `registerTool()` and `registerResource()`
- [ ] **Input Validation**: Parameters validated using `validateRequired()` and other validators
- [ ] **Response Format**: Returns proper MCP response structure

### 4. Server Implementation Pattern

**Required Structure for MCP Servers:**

```javascript
import { BaseMCPServer, Logger } from '@mcp/core';
import { parseArgs } from 'node:util';

export class MyServer extends BaseMCPServer {
  constructor(config) {
    // ✅ Initialize logger BEFORE super()
    const logger = new Logger({ level: 'info' });
    
    super({
      name: 'my-server',
      version: '1.0.0',
      ...config,
    });
    
    this.logger = logger;
  }

  setupHandlers() {
    // Register tools and resources here
    this.registerTool({
      name: 'tool-name',
      description: 'Tool description',
      inputSchema: { /* JSON Schema */ },
      handler: async (params) => { /* implementation */ },
    });
  }
}

// CLI with transport selection
const { values } = parseArgs({
  options: {
    transport: { type: 'string', default: 'stdio' },
    port: { type: 'string', default: '3001' },
  },
});

const server = new MyServer({
  transport: values.transport,
  port: parseInt(values.port),
});

await server.start();
```

### 5. Dashboard Integration

- [ ] **Configuration**: Server added to `dashboard-config.json` with proper structure:
  ```json
  {
    "id": "server-id",
    "name": "Server Name",
    "url": "http://localhost:3001",
    "enabled": true,
    "description": "What the server does",
    "color": "#HEX_COLOR"
  }
  ```

- [ ] **HTTP Endpoints**: Publishes `/health`, `/info`, `/mcp` endpoints
- [ ] **CORS Headers**: Proper CORS configuration for remote access
- [ ] **Port Assignment**: Unique port number (3000-3999 range)

### 6. Testing & Validation

- [ ] **HTTP Mode Testing**: Test with `npm run start:http`
- [ ] **stdio Mode Testing**: Test with Claude Desktop or CLI
- [ ] **Dashboard Connection**: Verify connection from dashboard
- [ ] **Tool Execution**: All tools execute successfully
- [ ] **Error Cases**: Error handling works correctly

### 7. Documentation

- [ ] **README.md**: Comprehensive with installation, usage, examples
- [ ] **JSDoc Comments**: All public APIs documented
- [ ] **Examples**: Working code examples provided
- [ ] **Architecture Docs**: Complex logic explained

### 8. UI/UX (Dashboard Components)

- [ ] **Inter Font**: Uses 'Inter' font family
- [ ] **Responsive Design**: Works on different screen sizes
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation
- [ ] **Loading States**: Shows loading indicators
- [ ] **Error States**: Displays user-friendly error messages
- [ ] **Modern Styling**: Glassmorphism, gradients, smooth animations

---

## Common Issues to Flag

### ❌ Anti-Patterns

1. **String Literals for MCP Handlers**
   ```javascript
   // BAD
   server.setRequestHandler('tools/list', handler);
   
   // GOOD
   import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
   server.setRequestHandler(ListToolsRequestSchema, handler);
   ```

2. **Logger Initialization After super()**
   ```javascript
   // BAD
   constructor(config) {
     super(config);
     this.logger = new Logger(); // Too late!
   }
   
   // GOOD
   constructor(config) {
     const logger = new Logger();
     super(config);
     this.logger = logger;
   }
   ```

3. **Missing Input Validation**
   ```javascript
   // BAD
   handler: async (params) => {
     return params.text.toUpperCase(); // Crashes if text is undefined
   }
   
   // GOOD
   handler: async (params) => {
     validateRequired(params, ['text']);
     return params.text.toUpperCase();
   }
   ```

4. **Hardcoded Values**
   ```javascript
   // BAD
   const url = 'http://localhost:3000';
   
   // GOOD
   const url = config.url || process.env.SERVER_URL || 'http://localhost:3000';
   ```

### ✅ Best Practices

1. **Use Middleware**
   - Wrap handlers with `withErrorHandling()`
   - Use logger for all operations
   - Validate inputs consistently

2. **HTTP Endpoints**
   - All servers must publish `/health`, `/info`, `/mcp`
   - Use proper HTTP status codes
   - Return JSON responses

3. **Configuration**
   - Support environment variables
   - Provide sensible defaults
   - Document all config options

4. **Error Messages**
   - User-friendly error descriptions
   - Include context (what failed, why)
   - Log detailed errors server-side

---

## File Structure Standards

```
packages/
├── servers/
│   └── my-server/
│       ├── package.json          # Must have "type": "module"
│       ├── README.md             # Comprehensive documentation
│       └── src/
│           └── index.js          # Main server implementation
├── dashboard/
│   ├── server.js                 # Express server
│   ├── dashboard-config.json     # Active server config
│   └── src/
│       ├── App.jsx               # Main component
│       ├── components/           # Reusable components
│       └── index.css             # Base styles
└── core/
    └── src/
        ├── base-server.js        # Framework core
        ├── middleware/           # Shared middleware
        └── utils/                # Shared utilities
```

---

## Naming Conventions

- **Packages**: `@mcp/package-name` (kebab-case)
- **Files**: `kebab-case.js`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Components**: `PascalCase.jsx`

---

## Critical Review Points

### When Reviewing Servers:

1. ✅ Extends `BaseMCPServer`
2. ✅ Logger initialized before `super()`
3. ✅ Uses MCP SDK schema objects
4. ✅ Implements `setupHandlers()` method
5. ✅ Validates all inputs
6. ✅ Returns proper MCP response format
7. ✅ Supports both stdio and HTTP
8. ✅ Has comprehensive README

### When Reviewing Dashboard Code:

1. ✅ Uses Inter font
2. ✅ Follows modern UI patterns (glassmorphism, gradients)
3. ✅ Handles loading/error states
4. ✅ Responsive design
5. ✅ Proper error boundaries
6. ✅ Accessible (ARIA, keyboard nav)

### When Reviewing Core/Utils:

1. ✅ Pure functions (no side effects)
2. ✅ Comprehensive JSDoc
3. ✅ Unit tests (when applicable)
4. ✅ Error handling
5. ✅ Works with ESM

---

## Performance Considerations

- [ ] No unnecessary re-renders (React)
- [ ] Debounced user inputs
- [ ] Lazy loading for heavy components
- [ ] Efficient state management
- [ ] Minimal bundle size
- [ ] Proper caching strategies

---

## Security Checklist

- [ ] Input sanitization
- [ ] No hardcoded secrets
- [ ] Environment variables for sensitive data
- [ ] CORS properly configured
- [ ] No eval() or dangerous code execution
- [ ] Dependencies up to date
- [ ] No exposed internal APIs

---

## Quick Reference

### Starting Servers
```bash
# Development (stdio)
npm run start -w @mcp/server-name

# Development (HTTP)
npm run start:http -w @mcp/server-name

# All servers + dashboard
npm run dev:all
```

### Testing
```bash
# Lint
npm run lint

# Build
npm run build

# Build dashboard
npm run build:dashboard
```

### Key Files to Reference
- **Development Plan**: `mcp-monorepo-development-plan.md`
- **Session Tracking**: `prompt.md`, `AGENTS.md`, `HANDOFF.md`
- **Core Implementation**: `packages/core/src/base-server.js`
- **Reference Server**: `packages/servers/echo-server/src/index.js`

---

## Review Output Format

When reviewing code, provide feedback in this format:

### ✅ Strengths
- List positive aspects
- Good patterns followed
- Well-implemented features

### ⚠️ Issues Found
1. **[Severity: High/Medium/Low]** Issue description
   - Location: file:line
   - Problem: What's wrong
   - Impact: Why it matters
   - Fix: How to resolve

### 💡 Suggestions
- Improvement ideas
- Optimization opportunities
- Better patterns to consider

### 📝 Documentation Gaps
- Missing docs
- Unclear comments
- Examples needed

---

## Version Information

- **Last Updated**: February 12, 2026
- **MCP SDK Version**: 1.26.0
- **Node.js**: >=18.0.0
- **Framework Version**: 1.0.0

---

## Additional Resources

- MCP SDK Documentation: [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- Project Architecture: `mcp-monorepo-development-plan.md`
- Copilot Instructions: `.github/copilot-instructions.md`

---

**Remember**: This is a learning project demonstrating MCP server implementation patterns. Code quality, documentation, and adherence to patterns are more important than feature completeness.
