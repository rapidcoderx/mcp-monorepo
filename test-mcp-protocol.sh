#!/bin/bash
# Test MCP protocol end-to-end

echo "=== Step 1: Initialize session ==="
INIT_RESPONSE=$(curl -si -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }')

# Extract session ID from headers
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "mcp-session-id:" | awk '{print $2}' | tr -d '\r')

# Extract JSON from SSE response (data: lines)
JSON_DATA=$(echo "$INIT_RESPONSE" | grep "^data:" | sed 's/^data: //')
echo "$JSON_DATA" | jq .
echo ""
echo "Session ID: $SESSION_ID"

if [ -z "$SESSION_ID" ]; then
  echo "ERROR: No session ID returned"
  exit 1
fi

echo ""
echo "=== Step 2: Call echo tool ==="
TOOL_RESPONSE=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {"text": "Hello MCP!"}
    },
    "id": 2
  }')
echo "$TOOL_RESPONSE" | grep "^data:" | sed 's/^data: //' | jq .

echo ""
echo "=== Step 3: List resource templates ==="
TEMPLATES_RESPONSE=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/templates/list",
    "params": {},
    "id": 3
  }')
echo "$TEMPLATES_RESPONSE" | grep "^data:" | sed 's/^data: //' | jq .

echo ""
echo "=== Step 4: Read resource template ==="
READ_RESPONSE=$(curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": {
      "uri": "echo://content/json"
    },
    "id": 4
  }')
echo "$READ_RESPONSE" | grep "^data:" | sed 's/^data: //' | jq .
