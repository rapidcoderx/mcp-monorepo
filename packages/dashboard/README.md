# @mcp/dashboard

Interactive web dashboard for testing, exploring, and validating MCP (Model Context Protocol) servers.

## Features

- 🔌 **Server Connection**: Connect to any MCP server via HTTP endpoint
- 🛠️ **Tool Inspector**: Browse and execute MCP tools with real-time testing
- 📦 **Resource Viewer**: View and inspect MCP resources
- 🧪 **Endpoint Tester**: Test HTTP endpoints with custom requests
- 📊 **Server Information**: View server metadata and capabilities
- ⚡ **Real-time Validation**: Instant feedback on tool execution

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- An MCP server running in HTTP mode

### Installation

```bash
# From the monorepo root
npm install

# Or install dashboard specifically
npm install -w @mcp/dashboard
```

### Running the Dashboard

#### Option 1: Dashboard Only

```bash
npm run dev:dashboard
```

The dashboard will start at http://localhost:5173

#### Option 2: Dashboard + Echo Server (Recommended)

```bash
# Start both server and dashboard together
npm run dev:all

# Or use the demo alias
npm run start:demo
```

This will start:
- Echo server at http://localhost:3000
- Dashboard at http://localhost:5173

The dashboard will auto-connect to the echo server.

## Usage

### 1. Connect to a Server

- Enter the server URL (default: `http://localhost:3000`)
- Click "Connect"
- The dashboard will fetch server information and display available tools/resources

### 2. Inspect and Test Tools

Navigate to the **Tools** tab to:
- Browse available tools
- View tool descriptions and parameters
- Fill in parameter values
- Execute tools and see results in real-time
- View formatted responses

### 3. View Resources

Navigate to the **Resources** tab to:
- List available resources
- View resource metadata (URI, MIME type)
- Read resource content

### 4. Test Endpoints

Navigate to the **Endpoints** tab to:
- Test `/health` endpoint
- Test `/info` endpoint  
- Test `/mcp` protocol endpoint with custom JSON-RPC requests
- View response headers, status codes, and timing
- Copy and modify example requests

## Available Endpoints

The dashboard can interact with these MCP server endpoints:

- **GET /health** - Health check endpoint
- **GET /info** - Server information and capabilities
- **POST /mcp** - MCP protocol endpoint (JSON-RPC 2.0)

## Architecture

```
dashboard/
├── src/
│   ├── components/
│   │   ├── ServerConnection.jsx   # Server connection UI
│   │   ├── ServerInfo.jsx         # Server metadata display
│   │   ├── ToolInspector.jsx      # Tool testing interface
│   │   ├── ResourceViewer.jsx     # Resource browser
│   │   └── EndpointTester.jsx     # HTTP endpoint tester
│   ├── App.jsx                    # Main application
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
└── package.json                   # Package configuration
```

## Configuration

### Dashboard Configuration Files

The dashboard uses a JSON configuration file to manage multiple MCP servers:

- **`dashboard-config.json`**: Active configuration with currently implemented servers
- **`dashboard-config.sample.json`**: Example configuration showing all planned servers

#### Configuration Format

```json
{
  "dashboard": {
    "title": "MCP Server Dashboard",
    "port": 8080,
    "description": "Centralized management interface for MCP servers"
  },
  "servers": [
    {
      "id": "echo",
      "name": "Echo Server",
      "url": "http://localhost:3000",
      "enabled": true,
      "description": "Text transformation tools (echo, reverse, uppercase)",
      "color": "#4CAF50"
    }
  ]
}
```

#### Adding a New Server

1. Implement your MCP server extending `BaseMCPServer`
2. Start it in HTTP mode on a specific port
3. Add an entry to `dashboard-config.json`:
   ```json
   {
     "id": "your-server",
     "name": "Your Server",
     "url": "http://localhost:3001",
     "enabled": true,
     "description": "What your server does",
     "color": "#2196F3"
   }
   ```
4. Restart the dashboard to see the new server

### Vite Configuration

The dashboard uses Vite with:
- React plugin for JSX support
- Port 5173 (configurable)
- Proxy for API requests to avoid CORS issues

### Connecting to Different Servers

You can connect to any MCP server by:

1. Starting your MCP server in HTTP mode:
   ```bash
   npm run start:http -w @mcp/your-server
   ```

2. Entering the server URL in the dashboard connection form

3. Click "Connect"

## Development

### Local Development

```bash
# Start in development mode with hot reload
npm run dev -w @mcp/dashboard

# Or from the dashboard directory
cd packages/dashboard
npm run dev
```

### Building for Production

```bash
# Build the dashboard
npm run build -w @mcp/dashboard

# Preview production build
npm run preview -w @mcp/dashboard
```

### Linting and Formatting

```bash
# Lint code
npm run lint -w @mcp/dashboard

# Fix linting issues
npm run lint:fix -w @mcp/dashboard

# Format code
npm run format -w @mcp/dashboard
```

## Example: Testing the Echo Server

1. Start the echo server and dashboard:
   ```bash
   npm run start:demo
   ```

2. Open http://localhost:5173 in your browser

3. The dashboard auto-connects to http://localhost:3000

4. Try the **echo** tool:
   - Go to Tools tab
   - Click "echo"
   - Enter text: "Hello, MCP!"
   - Click "Execute Tool"
   - See the result: "Echo: Hello, MCP!"

5. Try the **reverse** tool:
   - Click "reverse"
   - Enter text: "Hello"
   - See the result: "olleH"

6. View the server resource:
   - Go to Resources tab
   - Click "Server Information"
   - See server details and capabilities

7. Test endpoints directly:
   - Go to Endpoints tab
   - Select endpoint (health, info, or mcp)
   - Click "Test Request"
   - View response with timing and headers

## MCP Protocol Testing

The dashboard supports full MCP protocol validation:

### Example: List Tools via MCP Endpoint

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Example: Call a Tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "text": "Hello from MCP!"
    }
  }
}
```

### Example: List Resources

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list",
  "params": {}
}
```

### Example: Read Resource

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "echo://info"
  }
}
```

## Troubleshooting

### Dashboard won't connect to server

- Ensure the MCP server is running in HTTP mode
- Check that the server URL is correct
- Verify the server is accessible (try `curl http://localhost:3000/health`)
- Check browser console for CORS or network errors

### Tools fail to execute

- Verify all required parameters are filled
- Check the parameter types match the schema
- Look at the error message for details
- Test the endpoint directly in the Endpoints tab

### CORS errors

- The dashboard's Vite config includes a proxy to avoid CORS issues
- If you're deploying to production, ensure your server has proper CORS headers
- The base-server already includes CORS headers for `Access-Control-Allow-Origin: *`

## Tech Stack

- **React 18.3+**: UI framework
- **Vite 6.0+**: Build tool and dev server
- **@modelcontextprotocol/sdk**: MCP protocol support
- **Native Fetch API**: HTTP requests
- **CSS3**: Styling with CSS variables

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Related Packages

- [@mcp/core](../core/README.md) - Core MCP framework
- [@mcp/echo-server](../servers/echo-server/README.md) - Sample MCP server

---

**Part of the MCP Monorepo Framework**
