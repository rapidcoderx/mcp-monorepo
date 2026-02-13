# MCP Inspector Guide

## Overview

The MCP Inspector is an official debugging tool for testing and inspecting MCP servers. It runs two components:
- **MCPI Client UI** - Default port **6274** (T9 dialpad: MCPI)
- **MCPP Proxy Server** - Default port **6277** (T9 dialpad: MCPP)

No port conflicts with the dashboard (port 5173)!

---

## Quick Start

### 1. Inspect Local Server (stdio mode)
```bash
npm run inspect:echo
```
Opens inspector at `http://localhost:5175` with echo-server loaded.

### 2. Inspect Remote Server (HTTP mode)
```bash
# Terminal 1: Start your server in HTTP mode
npm run dev:echo

# Terminal 2: Open inspector with HTTP endpoint
npm run inspect:echo:http
```

### 3. Inspect Any Remote Endpoint
```bash
npm run inspect:remote http://localhost:3000/mcp
npm run inspect:remote http://localhost:3001/mcp
npm run inspect:remote https://your-server.com/mcp
```

---

## Port Configuration

| Service | Default Port | Environment Variable |
|---------|-------------|---------------------|
| Dashboard | 5173 | `PORT` in vite.config.js |
| Inspector Client (MCPI) | 6274 | `CLIENT_PORT` |
| Inspector Server (MCPP) | 6277 | `SERVER_PORT` |
| Echo Server | 3000 | `--port` CLI arg |

### Custom Ports
If you need to customize inspector ports:
```bash
CLIENT_PORT=8080 SERVER_PORT=9000 npx @modelcontextprotocol/inspector node packages/servers/echo-server/src/index.js
```

---

## Known Issues

### Node.js v25 Compatibility
If you encounter `eventsource` module errors with Node v25:
- **Workaround 1**: Use Node.js LTS v20 or v22
- **Workaround 2**: Use stdio mode (`inspect:echo`) instead of HTTP mode
- **Workaround 3**: Use the dashboard instead for HTTP testing

### Port Conflicts
If default ports are in use, customize them:
```bash
# Check if ports are in use
lsof -ti:6274  # Client
lsof -ti:6277  # Server

# Use custom ports
CLIENT_PORT=8080 SERVER_PORT=9000 npm run inspect:echo
CLIENT_PORT=8080 SERVER_PORT=9000 npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

---

## Inspector Features

### 1. Connection Management
- **stdio**: Direct process connection (recommended for local dev)
- **HTTP**: Remote server connection via `/mcp` endpoint

### 2. Tool Testing
- View all available tools
- Test tool execution with custom inputs
- See request/response payloads
- Validate JSON schemas

### 3. Resource Browser
- List all available resources
- Read resource contents
- View resource metadata

### 4. Debug Console
- Real-time message logging
- Request/response inspection
- Error tracking

---

## Comparison: Inspector vs Dashboard

| Feature | Inspector | Dashboard |
|---------|-----------|-----------|
| **Purpose** | Debug & test single server | Showcase multiple servers |
| **Connection** | stdio or HTTP | HTTP only |
| **Best For** | Development & debugging | Demo & production testing |
| **Client Port** | 6274 | 5173 |
| **Tools** | Interactive testing | Interactive testing |
| **Resources** | Full browser | View only |
| **Multi-Server** | No | Yes (via config) |

---

## Usage Examples

### Test Echo Server Tools
```bash
# Start inspector with echo server
npm run inspect:echo

# In inspector UI:
# 1. Select "echo" tool
# 2. Input: { "message": "Hello MCP!" }
# 3. Click "Execute"
# 4. View response
```

### Test Remote API Server
```bash
# Terminal 1: Start API server
npm run start:http -w @mcp/api-server

# Terminal 2: Inspect HTTP endpoint
PORT=5175 npx @modelcontextprotocol/inspector http://localhost:3001/mcp
```

### Debug New Server Implementation
```bash
# Test your new server during development
PORT=5175 npx @modelcontextprotocol/inspector node packages/servers/my-server/src/index.js
```

---

## Troubleshooting

### Inspector won't start
```bash
# Check if ports are in use
lsof -ti:6274
lsof -ti:6277

# Kill processes using ports
kill -9 $(lsof -ti:6274)
kill -9 $(lsof -ti:6277)

# Try again
npm run inspector
```

### Can't connect to HTTP endpoint
```bash
# Verify server is running
curl http://localhost:3000/health

# Verify /mcp endpoint exists
curl http://localhost:3000/mcp

# Check server logs for errors
```

### Server not responding in inspector
- Check server transport mode (must be HTTP for HTTP inspection)
- Verify `/mcp` endpoint is accessible
- Check server logs for connection errors
- Try stdio mode instead: `npm run inspect:echo`

---

## Best Practices

1. **Use stdio for local development**: Faster, more reliable
2. **Use HTTP for remote testing**: Test deployed servers
3. **One inspector at a time**: Avoid port conflicts
4. **Keep inspector separate**: Don't mix with dashboard
5. **Check Node version**: Use LTS (v20/v22) for best compatibility

---

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `inspector` | `npx @modelcontextprotocol/inspector` | Open inspector UI (port 6274) |
| `inspect:echo` | + `node packages/servers/echo-server/src/index.js` | Inspect echo server (stdio) |
| `inspect:echo:http` | + `http://localhost:3000/mcp` | Inspect echo server (HTTP) |
| `inspect:remote` | + `<url>` | Inspect any remote endpoint |

### Custom Port Usage
```bash
# Use custom ports for all commands
CLIENT_PORT=8080 SERVER_PORT=9000 npm run inspect:echo
CLIENT_PORT=8080 SERVER_PORT=9000 npm run inspect:echo:http
```

---

## Additional Resources

- [MCP Inspector Documentation](https://github.com/modelcontextprotocol/inspector)
- [MCP Protocol Specification](https://modelcontextprotocol.org)
- [Dashboard Documentation](../packages/dashboard/README.md)
- [Endpoint Guide](./endpoints.md)

---

Last Updated: February 12, 2026
