# MCP Server Endpoints Guide

This guide describes all HTTP endpoints available when running MCP servers in HTTP transport mode.

## Overview

MCP servers in HTTP mode expose three main endpoints:
- `/health` - Health check endpoint
- `/info` - Server information and capabilities
- `/mcp` - MCP protocol endpoint (JSON-RPC 2.0)

All endpoints support CORS with `Access-Control-Allow-Origin: *` by default.

---

## Health Check Endpoint

### GET /health

Returns the health status of the server.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "name": "echo-server"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

**Use Cases:**
- Health checks in container orchestration (Kubernetes, Docker)
- Load balancer health probes
- Monitoring systems
- Uptime checks

---

## Server Information Endpoint

### GET /info

Returns comprehensive information about the server, including available tools, resources, and capabilities.

**Request:**
```bash
curl http://localhost:3000/info
```

**Response:**
```json
{
  "name": "echo-server",
  "version": "1.0.0",
  "transport": "http",
  "endpoint": "http://0.0.0.0:3000/mcp",
  "capabilities": {
    "tools": {},
    "resources": {}
  },
  "tools": [
    {
      "name": "echo",
      "description": "Echoes back the provided text",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "Text to echo back"
          }
        },
        "required": ["text"]
      }
    },
    {
      "name": "reverse",
      "description": "Reverses the provided text",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "Text to reverse"
          }
        },
        "required": ["text"]
      }
    },
    {
      "name": "uppercase",
      "description": "Converts text to uppercase",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "Text to convert to uppercase"
          }
        },
        "required": ["text"]
      }
    }
  ],
  "resources": [
    {
      "uri": "echo://info",
      "name": "Server Information",
      "description": "Information about the echo server",
      "mimeType": "text/plain"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Information retrieved successfully

**Use Cases:**
- Service discovery
- Dynamic client configuration
- Dashboard UIs
- Documentation generation
- API exploration

---

## MCP Protocol Endpoint

### POST /mcp

The main MCP protocol endpoint supporting JSON-RPC 2.0 over HTTP.

**Method:** POST  
**Content-Type:** `application/json`  
**Protocol:** JSON-RPC 2.0

### Request Format

All requests must follow JSON-RPC 2.0 format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method_name",
  "params": {}
}
```

### Supported Methods

#### 1. tools/list

List all available tools.

**Request:**
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

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "echo",
        "description": "Echoes back the provided text",
        "inputSchema": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string",
              "description": "Text to echo back"
            }
          },
          "required": ["text"]
        }
      }
    ]
  }
}
```

#### 2. tools/call

Execute a specific tool.

**Request:**
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
        "text": "Hello, MCP!"
      }
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Echo: Hello, MCP!"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Missing required parameter: text"
  }
}
```

#### 3. resources/list

List all available resources.

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "resources/list",
    "params": {}
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
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

#### 4. resources/read

Read a specific resource.

**Request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": {
      "uri": "echo://info"
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
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

## Error Handling

### HTTP Status Codes

- `200 OK` - Request successful
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error

### JSON-RPC Error Codes

- `-32700` - Parse error
- `-32600` - Invalid Request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Missing required parameter: text",
    "data": {
      "parameter": "text"
    }
  }
}
```

---

## CORS Headers

All endpoints include CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

For `OPTIONS` requests, servers return `204 No Content`.

---

## Server Configuration

### Starting a Server in HTTP Mode

```bash
# Using npm scripts
npm run start:http -w @mcp/echo-server

# Or directly with Node.js
node packages/servers/echo-server/src/index.js --transport=http --port=3000 --host=0.0.0.0
```

### CLI Arguments

- `--transport` - Transport type (`stdio` or `http`)
- `--port` - HTTP port (default: 3000)
- `--host` - HTTP host (default: `0.0.0.0`)

### Example Configuration

```javascript
const server = new EchoServer({
  transport: 'http',
  port: 3000,
  host: '0.0.0.0',
});

await server.start();
```

---

## Testing with Dashboard

The integrated dashboard provides a visual interface to test all endpoints:

```bash
# Start server and dashboard
npm run start:demo
```

Then open http://localhost:5173 to:
- Test all endpoints visually
- Execute tools with custom parameters
- View formatted responses
- Validate JSON-RPC requests

---

## Integration Examples

### JavaScript/Node.js

```javascript
// Fetch server info
const info = await fetch('http://localhost:3000/info').then(r => r.json());

// Call a tool
const response = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'echo',
      arguments: { text: 'Hello!' }
    }
  })
});
const result = await response.json();
console.log(result.result.content[0].text); // "Echo: Hello!"
```

### Python

```python
import requests

# Fetch server info
info = requests.get('http://localhost:3000/info').json()

# Call a tool
response = requests.post('http://localhost:3000/mcp', json={
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'tools/call',
    'params': {
        'name': 'echo',
        'arguments': {'text': 'Hello!'}
    }
})
result = response.json()
print(result['result']['content'][0]['text'])  # "Echo: Hello!"
```

### curl

```bash
# Health check
curl http://localhost:3000/health

# Server info
curl http://localhost:3000/info

# Call tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"text":"Hello!"}}}'
```

---

## Security Considerations

1. **Authentication**: Not implemented by default. Add middleware for auth if needed.
2. **CORS**: Wide-open by default (`*`). Restrict in production.
3. **Rate Limiting**: Not implemented. Add if exposing publicly.
4. **Input Validation**: Implemented via JSON Schema validators.
5. **HTTPS**: Use reverse proxy (nginx, Caddy) for TLS in production.

---

## Performance

- Health checks: < 5ms
- Info endpoint: < 10ms
- Tool execution: Varies by tool implementation
- Connection: Keep-alive supported
- Payload: No size limits (configure at reverse proxy)

---

## Monitoring

### Prometheus Metrics (Future)

```
mcp_requests_total{endpoint="/mcp",method="tools/call",status="success"} 100
mcp_request_duration_seconds{endpoint="/mcp"} 0.05
```

### Logging

All endpoints log to stderr:
- Request method and path
- Response status
- Error messages
- Client disconnections

---

## Related Documentation

- [Core Framework](../packages/core/README.md)
- [Echo Server](../packages/servers/echo-server/README.md)
- [Dashboard](../packages/dashboard/README.md)
- [Architecture Guide](./architecture.md)
- [Transport Guide](./transport-guide.md)

---

**Last Updated:** February 12, 2026
