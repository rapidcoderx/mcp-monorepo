# @mcp/echo-server

A sample MCP server that demonstrates the framework capabilities. This server provides simple text manipulation tools (echo, reverse, uppercase) and serves as a reference implementation for building new MCP servers.

## Purpose

This server is designed to:
- Demonstrate how to use the `@mcp/core` framework
- Provide a simple example for developers creating new MCP servers
- Test both stdio and HTTP transport modes
- Show best practices for tool and resource registration

## Features

### Tools

- **echo**: Echoes back the provided text
- **reverse**: Reverses the text character by character
- **uppercase**: Converts text to uppercase

### Resources

- **echo://info**: Server information and capabilities

## Installation

```bash
# From the monorepo root
npm install -w @mcp/echo-server
```

## Usage

### stdio Mode (Local Development)

```bash
npm run start:stdio -w @mcp/echo-server
```

Or directly:
```bash
node packages/servers/echo-server/src/index.js --transport=stdio
```

### HTTP Mode (Remote Access)

```bash
npm run start:http -w @mcp/echo-server
```

Or directly:
```bash
node packages/servers/echo-server/src/index.js --transport=http --port=3000
```

### Testing with curl

Once running in HTTP mode:

```bash
# Health check
curl http://localhost:3000/health

# Server info
curl http://localhost:3000/info

# MCP endpoint (requires MCP client)
# Use with the dashboard or MCP client library
```

### Testing with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "echo-server": {
      "command": "node",
      "args": [
        "/path/to/mcp-monorepo/packages/servers/echo-server/src/index.js",
        "--transport=stdio"
      ]
    }
  }
}
```

## Examples

### Using the Echo Tool

Input:
```json
{
  "name": "echo",
  "arguments": {
    "text": "Hello, MCP!"
  }
}
```

Output:
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

### Using the Reverse Tool

Input:
```json
{
  "name": "reverse",
  "arguments": {
    "text": "Hello"
  }
}
```

Output:
```json
{
  "content": [
    {
      "type": "text",
      "text": "olleH"
    }
  ]
}
```

### Using the Uppercase Tool

Input:
```json
{
  "name": "uppercase",
  "arguments": {
    "text": "hello world"
  }
}
```

Output:
```json
{
  "content": [
    {
      "type": "text",
      "text": "HELLO WORLD"
    }
  ]
}
```

## Development

### Run in Development Mode

With auto-reload on file changes:

```bash
# stdio mode
npm run dev -w @mcp/echo-server

# HTTP mode
npm run dev:http -w @mcp/echo-server
```

### Linting and Formatting

```bash
# Lint
npm run lint -w @mcp/echo-server

# Auto-fix linting issues
npm run lint:fix -w @mcp/echo-server

# Format code
npm run format -w @mcp/echo-server
```

## Architecture

This server extends `BaseMCPServer` from `@mcp/core` and demonstrates:

1. **Tool Registration**: How to register and implement MCP tools
2. **Resource Registration**: How to expose server resources
3. **Parameter Validation**: Using validators from the core framework
4. **Logging**: Using the Logger utility for debugging
5. **Error Handling**: Proper error handling and user feedback
6. **Transport Flexibility**: Supporting both stdio and HTTP modes

## Code Structure

```
echo-server/
├── package.json           # Package configuration
├── src/
│   └── index.js          # Main server implementation
└── README.md             # This file
```

## Extending This Example

To create your own server based on this example:

1. Copy the echo-server directory
2. Rename it and update package.json
3. Implement your own `setupHandlers()` method
4. Register your custom tools and resources
5. Update the README with your server's documentation

## License

MIT
