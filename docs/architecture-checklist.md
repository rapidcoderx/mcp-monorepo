# MCP Server Architecture Checklist

This document verifies compliance with MCP SDK best practices and requirements.

## ✅ Requirements Checklist

### 1. McpServer API (Modern SDK)
- ✅ **Import**: `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`
- ✅ **Usage**: `new McpServer({ name, version }, { capabilities })`
- ✅ **Methods**: Using `registerTool()`, `registerResource()`, `registerResourceTemplate()`
- ❌ **Deprecated**: Not using deprecated `.tool()`, `.resource()`, `.resourceTemplate()` methods

**Location**: [base-server.js:13](../packages/core/src/base-server.js#L13), [base-server.js:127](../packages/core/src/base-server.js#L127)

### 2. Zod Schema Validation
- ✅ **Import**: `import { z } from 'zod'`
- ✅ **Tool Parameters**: All tools use Zod schemas via `parameters: z.object({ ... })`
- ✅ **Auto-conversion**: JSON Schema → Zod via `_jsonSchemaToZod()` helper
- ✅ **Type Support**: string, number, integer, boolean, array, object
- ✅ **Features**: Required/optional fields, descriptions preserved

**Location**: [base-server.js:15](../packages/core/src/base-server.js#L15), [base-server.js:140](../packages/core/src/base-server.js#L140), [base-server.js:233](../packages/core/src/base-server.js#L233)

**Example**:
```javascript
// Subclass API (JSON Schema)
this.registerTool({
  name: 'greet',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name']
  },
  handler: async (params) => ({ ... })
});

// Framework converts to Zod:
serverInstance.registerTool({
  name: 'greet',
  parameters: z.object({
    name: z.string()  // Required by default
  }),
  execute: async (params) => { ... }
});
```

### 3. RFC 6570 URI Templates
- ✅ **Simple expansion**: `{param}` - matches non-reserved characters `[^/?#]+`
- ✅ **Reserved expansion**: `{+param}` - matches any character including `/` `.+`
- ✅ **Path segment**: `{/param}` - optional path segment `/[^/]+`
- ✅ **Implementation**: Custom regex-based matcher in `_matchUriTemplate()`

**Location**: [base-server.js:372](../packages/core/src/base-server.js#L372)

**Supported templates**:
```javascript
'file:///{+path}'           // {+path} = 'folder/subfolder/file.txt'
'repo://{owner}/{repo}'     // {owner} = 'user', {repo} = 'project'
'api://{service}{/version}' // {/version} = '/v2' or '' (optional)
```

**Not yet supported** (can be added if needed):
- `{?param}` - query parameters
- `{&param}` - additional query parameters
- `{#param}` - fragments
- `{.param}` - label expansion
- Composite variables: `{param1,param2}`
- Modifiers: `{param:3}` (prefix), `{param*}` (explode)

### 4. Factory Pattern
- ✅ **Method**: `_createServerInstance()` - creates fresh McpServer instances
- ✅ **Stdio**: Single server instance reused
- ✅ **HTTP**: New server instance per session (SDK requirement)
- ✅ **Isolation**: Each HTTP session gets independent server state
- ✅ **Handler registration**: Tools/resources registered in each instance

**Location**: [base-server.js:121](../packages/core/src/base-server.js#L121)

**Why needed**:
- MCP SDK requires 1-to-1 mapping between Server and Transport
- HTTP sessions are stateful and must be isolated
- Prevents state leakage between concurrent sessions

**Flow**:
```javascript
// Constructor (stdio transport)
this.server = this._createServerInstance(); // Single instance

// HTTP session initialization
const serverInstance = this._createServerInstance(); // New per session
await serverInstance.connect(transport);
this._sessions.set(sessionId, { transport, server: serverInstance });
```

### 5. Session Management (Streamable HTTP)
- ✅ **Transport**: `StreamableHTTPServerTransport` with session ID generator
- ✅ **Session storage**: `Map<sessionId, {transport, server}>`
- ✅ **Lifecycle hooks**: `onsessioninitialized`, `onclose`
- ✅ **Session cleanup**: Deletes sessions on close/disconnect
- ✅ **HTTP methods**: POST (JSON-RPC), GET (SSE), DELETE (close)
- ✅ **CORS**: Proper headers including `mcp-session-id`

**Location**: [base-server.js:500-555](../packages/core/src/base-server.js#L500-L555)

**Session flow**:
1. **Initialize** (POST /mcp): Client sends `initialize` request
   - Create `StreamableHTTPServerTransport` with UUID generator
   - Create new server instance via factory
   - Connect server ↔ transport
   - Handle initialize request
   - Store session in map

2. **Use** (POST /mcp): Client sends requests with `mcp-session-id` header
   - Lookup session by ID
   - Delegate to stored transport

3. **Stream** (GET /mcp): Client opens SSE for server messages
   - Requires valid `mcp-session-id`
   - Delegate to stored transport

4. **Close** (DELETE /mcp): Client terminates session
   - Lookup session by ID
   - Delegate to transport (triggers `onclose`)
   - Remove from session map

---

## Additional Features

### Comprehensive Logging
- ✅ All MCP JSON-RPC requests logged
- ✅ Tool calls with parameters and results
- ✅ Resource reads with URI and template matches
- ✅ HTTP transport details (method, sessionId, URL)
- ✅ Error logging with stack traces

**Location**: [base-server.js:143-171](../packages/core/src/base-server.js#L143-L171)

### Resource Template Support
- ✅ `registerResourceTemplate()` method
- ✅ Fallback order: static resources → templates
- ✅ Parameter extraction from URI
- ✅ Logging of template matches

**Location**: [base-server.js:193-228](../packages/core/src/base-server.js#L193-L228)

### Dual Transport
- ✅ **Stdio**: For local CLI usage (Claude Desktop, etc.)
- ✅ **HTTP**: For remote access (dashboard, web clients)
- ✅ Same codebase supports both transparently
- ✅ Configuration via `config.transport`

**Location**: [base-server.js:639-649](../packages/core/src/base-server.js#L639-L649)

### HTTP Endpoints
- ✅ **POST /mcp**: MCP JSON-RPC protocol
- ✅ **GET /mcp**: SSE stream (with session ID)
- ✅ **DELETE /mcp**: Session termination
- ✅ **GET /health**: Health check `{"status":"healthy","name":"..."}`
- ✅ **GET /info**: Server metadata (tools, resources, capabilities)
- ✅ **CORS**: Full support for cross-origin requests

**Location**: [base-server.js:572-620](../packages/core/src/base-server.js#L572-L620)

---

## Testing Checklist

### Unit Tests (To Do)
- [ ] `_jsonSchemaToZod()` converter
- [ ] `_matchUriTemplate()` RFC 6570 matching
- [ ] Tool registration and handler wrapping
- [ ] Resource registration and handler wrapping
- [ ] Session lifecycle

### Integration Tests (To Do)
- [ ] Stdio transport with tools/resources
- [ ] HTTP transport initialization
- [ ] HTTP session management
- [ ] Multi-session concurrency
- [ ] Session cleanup on disconnect

### Manual Tests (Done)
- ✅ Echo server with 3 tools (echo, reverse, uppercase)
- ✅ Static resource (echo://info)
- ✅ Template resources (echo://content/{type}, echo://data/{format}/{name})
- ✅ HTTP health and info endpoints
- ✅ Dashboard connection and tool execution

---

## SDK Version

**Current**: `@modelcontextprotocol/sdk@^1.26.0`
**Zod**: `zod@^3.24.1`

---

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [RFC 6570 - URI Template](https://tools.ietf.org/html/rfc6570)
- [Zod Documentation](https://zod.dev/)

---

Last updated: February 13, 2026
