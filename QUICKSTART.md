# 🚀 MCP Monorepo Framework - Quickstart Guide

Get up and running with the MCP Monorepo Framework in under 5 minutes!

---

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Terminal**: Any terminal (bash, zsh, etc.)
- **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)

---

## Step 1: Install Dependencies

```bash
cd /Users/sathishkr/Work/mcp-monorepo
npm install
```

**Expected Output:**
```
added X packages, and audited Y packages in Zs
found 0 vulnerabilities
```

---

## Step 2: Start the Demo Environment

This single command starts both the echo server and the dashboard:

```bash
npm run start:demo
```

**Expected Output:**
```
[0] echo-server MCP server running on http://0.0.0.0:3000
[0]   - MCP endpoint: http://0.0.0.0:3000/mcp
[0]   - Info endpoint: http://0.0.0.0:3000/info
[0]   - Health check: http://0.0.0.0:3000/health
[1] 
[1]   VITE v6.4.1  ready in XXXms
[1] 
[1]   ➜  Local:   http://localhost:5173/
[1]   ➜  Network: http://10.0.0.X:5173/
```

**What's Running:**
- **Echo Server**: http://localhost:3000 (MCP server with 3 tools)
- **Dashboard**: http://localhost:5173 (Interactive UI)

---

## Step 3: Test with the Dashboard

### Open the Dashboard

Navigate to **http://localhost:5173** in your browser.

### Test Server Connection

The dashboard should **auto-connect** to the echo server at `http://localhost:3000`.

**✅ Success Indicator:** You'll see "Connected to echo-server v1.0.0" with a green status.

### Test the Tools

1. **Click on the "Tools" tab**
2. **Select a tool from the dropdown:**
   - `echo` - Echoes back your text
   - `reverse` - Reverses your text
   - `uppercase` - Converts text to uppercase

3. **Fill in the parameter form:**
   - For example, type "Hello, MCP!" in the text field

4. **Click "Execute Tool"**

**Expected Results:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Echo: Hello, MCP!"
    }
  ]
}
```

### Test Resources

1. **Click on the "Resources" tab**
2. **Select the resource:** `echo://info`
3. **Click "Read Resource"**

**Expected Output:**
```
Echo Server v1.0.0

This is a sample MCP server demonstrating the framework capabilities...
```

### Test Endpoints

1. **Click on the "Endpoints" tab**
2. **Select an endpoint to test:**
   - `/health` - Server health check
   - `/info` - Server information
   - `/mcp` - MCP protocol endpoint

3. **Click "Send Request"**

**Expected Results for /health:**
```json
{
  "status": "healthy",
  "name": "echo-server"
}
```

**Expected Results for /info:**
```json
{
  "name": "echo-server",
  "version": "1.0.0",
  "transport": "http",
  "tools": [...],
  "resources": [...]
}
```

---

## Step 4: Test with cURL (Command Line)

Open a **new terminal window** (keep the demo running in the first one).

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Output:**
```json
{"status":"healthy","name":"echo-server"}
```

### Test Info Endpoint

```bash
curl http://localhost:3000/info
```

**Expected Output:**
```json
{
  "name": "echo-server",
  "version": "1.0.0",
  "transport": "http",
  "endpoint": "http://0.0.0.0:3000/mcp",
  "capabilities": {...},
  "tools": [
    {
      "name": "echo",
      "description": "Echoes back the provided text",
      ...
    }
  ]
}
```

### Test MCP Protocol - List Tools

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "echo",
        "description": "Echoes back the provided text",
        "inputSchema": {...}
      },
      {
        "name": "reverse",
        "description": "Reverses the provided text",
        "inputSchema": {...}
      },
      {
        "name": "uppercase",
        "description": "Converts text to uppercase",
        "inputSchema": {...}
      }
    ]
  }
}
```

### Test MCP Protocol - Call a Tool

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "text": "Hello from cURL!"
      }
    }
  }'
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Echo: Hello from cURL!"
      }
    ]
  }
}
```

### Test All Three Tools

**Echo Tool:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"text":"Test"}}}'
```

**Reverse Tool:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"reverse","arguments":{"text":"Test"}}}'
```

**Expected:** `"text": "tseT"`

**Uppercase Tool:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"uppercase","arguments":{"text":"test"}}}'
```

**Expected:** `"text": "TEST"`

---

## Step 5: Test Resources via MCP Protocol

### List Resources

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/list",
    "params": {}
  }'
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resources": [
      {
        "uri": "echo://info",
        "name": "Server Information",
        "description": "Information about the echo server",
        "mimeType": "text/plain"
      }
    ]
  }
}
```

### Read a Resource

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "resources/read",
    "params": {
      "uri": "echo://info"
    }
  }'
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "contents": [
      {
        "uri": "echo://info",
        "mimeType": "text/plain",
        "text": "Echo Server v1.0.0\n\nThis is a sample MCP server..."
      }
    ]
  }
}
```

---

## Step 6: Run Components Separately (Optional)

If you want to run the echo server and dashboard separately:

### Terminal 1 - Echo Server Only
```bash
npm run dev:echo
```

Server runs at: http://localhost:3000

### Terminal 2 - Dashboard Only
```bash
npm run dev:dashboard
```

Dashboard runs at: http://localhost:5173

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
node packages/servers/echo-server/src/index.js --transport=http --port=3001
```

### Dependencies Not Installed

**Error:** `Cannot find module '@modelcontextprotocol/sdk'`

**Solution:**
```bash
npm install
```

### Dashboard Not Loading

**Issue:** Dashboard shows blank page

**Solution:**
1. Check browser console for errors (F12)
2. Verify echo server is running at localhost:3000
3. Clear browser cache and reload

### CORS Errors

**Error:** "Access to fetch at... has been blocked by CORS policy"

**This shouldn't happen** - the framework includes CORS headers by default. If you see this:
1. Verify echo server is running
2. Check you're accessing localhost:5173 (not 127.0.0.1)
3. Restart both server and dashboard

---

## What You've Tested

✅ **Core Framework** - Dual transport architecture working  
✅ **Echo Server** - All 3 tools functioning (echo, reverse, uppercase)  
✅ **HTTP Endpoints** - /health, /info, /mcp all responding  
✅ **MCP Protocol** - JSON-RPC 2.0 communication working  
✅ **Dashboard UI** - Interactive tool testing operational  
✅ **Resources** - Resource listing and reading working  
✅ **Endpoint Validation** - All HTTP methods verified  

---

## Next Steps

Now that everything is working, you can:

1. **Explore the Code:**
   - Core framework: `packages/core/src/base-server.js`
   - Echo server: `packages/servers/echo-server/src/index.js`
   - Dashboard: `packages/dashboard/src/`

2. **Read the Documentation:**
   - Main README: `README.md`
   - Endpoint Guide: `docs/endpoints.md`
   - Core README: `packages/core/README.md`
   - Dashboard README: `packages/dashboard/README.md`

3. **Create Your Own Server:**
   - Follow the echo-server pattern
   - See: `packages/servers/echo-server/` as reference
   - Extend `BaseMCPServer` from `@mcp/core`

4. **Review the Development Plan:**
   - See: `mcp-monorepo-development-plan.md`
   - Phase 2: Additional servers (api-server, docs-server, etc.)

---

## Stop the Demo

When you're done testing, stop the demo with:

```bash
# Press Ctrl+C in the terminal running npm run start:demo
```

Or if running in background:
```bash
# Find the process
ps aux | grep "npm run"

# Kill it
kill -9 <PID>
```

---

## Summary

You've successfully:
- ✅ Installed all dependencies
- ✅ Started the echo server and dashboard
- ✅ Tested all tools via the dashboard UI
- ✅ Tested all endpoints via cURL
- ✅ Validated the MCP protocol implementation
- ✅ Confirmed resources work correctly

**🎉 The MCP Monorepo Framework is working perfectly!**

---

## Getting Help

- **Issues?** Check `HANDOFF.md` for known limitations
- **Questions?** Review `prompt.md` for context
- **Development?** See `mcp-monorepo-development-plan.md`

---

**Last Updated:** February 12, 2026  
**Framework Version:** 1.0.0  
**Status:** Phase 1 Complete ✅
