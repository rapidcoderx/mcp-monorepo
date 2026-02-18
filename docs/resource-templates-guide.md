# Resource Templates Guide

## Overview

Resource templates allow MCP servers to dynamically handle resource requests with parameterized URIs. Instead of registering individual resources for every possible variation, you can register a single template that matches patterns.

## What Are Resource Templates?

Resource templates are URI patterns with placeholders (parameters) that get extracted when matching actual resource requests. This is similar to URL routing in web frameworks.

### Example:
- **Template**: `echo://content/{type}`
- **Matches**: `echo://content/json`, `echo://content/html`, `echo://content/text`
- **Parameters**: `{ type: 'json' }`, `{ type: 'html' }`, `{ type: 'text' }`

## How It Works

### 1. Registration

Register a resource template in your server's `setupHandlers()` method:

```javascript
class MyServer extends BaseMCPServer {
  setupHandlers() {
    this.registerResourceTemplate({
      uriTemplate: 'echo://content/{type}',
      name: 'Dynamic Content',
      description: 'Get content by type',
      mimeType: 'text/plain',
      handler: async (uri, params) => {
        // params = { type: 'json' } for URI 'echo://content/json'
        const { type } = params;
        
        // Generate content based on type parameter
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ type, data: '...' }),
          }],
        };
      },
    });
  }
}
```

### 2. MCP Protocol Support

Resource templates are part of the MCP specification. Clients can:

1. **List available templates**:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "resources/templates/list",
     "id": 1
   }
   ```
   
   Response:
   ```json
   {
     "jsonrpc": "2.0",
     "result": {
       "resourceTemplates": [
         {
           "uriTemplate": "echo://content/{type}",
           "name": "Dynamic Content",
           "description": "Get content by type",
           "mimeType": "text/plain"
         }
       ]
     },
     "id": 1
   }
   ```

2. **Read resources using template URIs**:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "resources/read",
     "params": { "uri": "echo://content/json" },
     "id": 2
   }
   ```

### 3. URI Pattern Matching

The framework uses regex-based pattern matching to extract parameters:

- **Pattern**: `{param}` → Matches any non-slash characters
- **Example**: `echo://content/{type}` → Regex: `^echo://content/(?<type>[^/]+)$`

#### Single Parameter:
```javascript
// Template: 'file:///{path}'
// URI: 'file:///document.txt'
// Params: { path: 'document.txt' }
```

#### Multiple Parameters:
```javascript
// Template: 'data://{format}/{name}'
// URI: 'data://json/users'
// Params: { format: 'json', name: 'users' }
```

#### Deep Paths:
```javascript
// Template: 'repo://{owner}/{repo}/issues/{number}'
// URI: 'repo://octocat/hello-world/issues/42'
// Params: { owner: 'octocat', repo: 'hello-world', number: '42' }
```

## Echo Server Examples

The echo server demonstrates three resource approaches:

### 1. Static Resource
```javascript
this.registerResource({
  uri: 'echo://info',
  name: 'Server Information',
  description: 'Information about the echo server',
  mimeType: 'text/plain',
  handler: async () => ({
    contents: [{
      uri: 'echo://info',
      mimeType: 'text/plain',
      text: 'Static server information...',
    }],
  }),
});
```

**Access**: `echo://info` (exact match only)

### 2. Simple Template (One Parameter)
```javascript
this.registerResourceTemplate({
  uriTemplate: 'echo://content/{type}',
  name: 'Dynamic Content',
  description: 'Get content by type (text, json, html, markdown)',
  mimeType: 'text/plain',
  handler: async (uri, params) => {
    const { type } = params;
    
    const contentMap = {
      text: { mimeType: 'text/plain', text: 'Plain text...' },
      json: { mimeType: 'application/json', text: '{"key":"value"}' },
      html: { mimeType: 'text/html', text: '<html>...</html>' },
      markdown: { mimeType: 'text/markdown', text: '# Title...' },
    };
    
    const content = contentMap[type];
    if (!content) {
      throw new Error(`Unknown type: ${type}`);
    }
    
    return {
      contents: [{ uri, ...content }],
    };
  },
});
```

**Access**: 
- `echo://content/text`
- `echo://content/json`
- `echo://content/html`
- `echo://content/markdown`

### 3. Multi-Parameter Template
```javascript
this.registerResourceTemplate({
  uriTemplate: 'echo://data/{format}/{name}',
  name: 'Sample Data',
  description: 'Get sample data by format and name',
  mimeType: 'application/json',
  handler: async (uri, params) => {
    const { format, name } = params;
    
    const data = { format, name, timestamp: new Date().toISOString() };
    
    let text, mimeType;
    switch (format) {
      case 'json':
        text = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'yaml':
        text = `format: ${format}\nname: ${name}`;
        mimeType = 'text/yaml';
        break;
      case 'csv':
        text = 'format,name\n' + format + ',' + name;
        mimeType = 'text/csv';
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
    
    return {
      contents: [{ uri, mimeType, text }],
    };
  },
});
```

**Access**:
- `echo://data/json/users`
- `echo://data/yaml/config`
- `echo://data/csv/report`

## Resource Resolution Order

When a `resources/read` request comes in, the framework:

1. **Checks static resources first** (exact URI match)
2. **Checks resource templates** (pattern matching)
3. **Returns error** if no match found

This ensures static resources take precedence over templates.

## Logging

With enhanced logging, template matching is fully traced:

```
[INFO] resources/read request {"uri":"echo://content/json"}
[INFO] Resource template accessed {"uri":"echo://content/json","type":"json"}
[INFO] resources/read response (template) {
  "uri":"echo://content/json",
  "template":"echo://content/{type}",
  "success":true
}
```

## Best Practices

### 1. Use Templates for Dynamic Data
```javascript
// ✅ GOOD: Template for dynamic content
this.registerResourceTemplate({
  uriTemplate: 'file:///{path}',
  handler: async (uri, { path }) => readFileContent(path),
});

// ❌ BAD: Registering thousands of individual files
this.registerResource({ uri: 'file:///file1.txt', ... });
this.registerResource({ uri: 'file:///file2.txt', ... });
// ... (thousands more)
```

### 2. Validate Parameters
```javascript
handler: async (uri, params) => {
  const { type } = params;
  
  const allowedTypes = ['json', 'xml', 'yaml'];
  if (!allowedTypes.includes(type)) {
    throw new Error(`Invalid type: ${type}. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  // Continue with valid type
}
```

### 3. Use Appropriate MIME Types
```javascript
const mimeTypes = {
  json: 'application/json',
  yaml: 'text/yaml',
  xml: 'application/xml',
  html: 'text/html',
  markdown: 'text/markdown',
  csv: 'text/csv',
  plain: 'text/plain',
};
```

### 4. Document Template Parameters
```javascript
this.registerResourceTemplate({
  uriTemplate: 'api://{service}/{version}/{endpoint}',
  name: 'API Endpoint',
  description: 'Call API endpoints (service: users|orders|products, version: v1|v2)',
  handler: async (uri, { service, version, endpoint }) => {
    // Implementation
  },
});
```

## Testing Templates

### Using curl:
```bash
# List available templates
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/templates/list",
    "id": 1
  }'

# Read using template URI
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/read",
    "params": { "uri": "echo://content/json" },
    "id": 2
  }'
```

### Using the Dashboard:
1. Connect to your server
2. Navigate to "Resource Viewer"
3. See list of templates and static resources
4. Click on a template to view/test
5. Enter parameters to generate dynamic URLs

## Advanced Use Cases

### 1. Database Queries
```javascript
this.registerResourceTemplate({
  uriTemplate: 'db://{table}/{id}',
  handler: async (uri, { table, id }) => {
    const result = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(result),
      }],
    };
  },
});
```

### 2. API Proxying
```javascript
this.registerResourceTemplate({
  uriTemplate: 'proxy://{service}/{path}',
  handler: async (uri, { service, path }) => {
    const baseUrls = {
      github: 'https://api.github.com',
      gitlab: 'https://gitlab.com/api/v4',
    };
    
    const baseUrl = baseUrls[service];
    if (!baseUrl) throw new Error(`Unknown service: ${service}`);
    
    const response = await fetch(`${baseUrl}/${path}`);
    const data = await response.text();
    
    return {
      contents: [{
        uri,
        mimeType: response.headers.get('content-type'),
        text: data,
      }],
    };
  },
});
```

### 3. File System Navigation
```javascript
this.registerResourceTemplate({
  uriTemplate: 'fs://{path}',
  handler: async (uri, { path }) => {
    const fs = await import('fs/promises');
    
    const stats = await fs.stat(path);
    if (stats.isDirectory()) {
      const files = await fs.readdir(path);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ type: 'directory', files }),
        }],
      };
    } else {
      const content = await fs.readFile(path, 'utf-8');
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: content,
        }],
      };
    }
  },
});
```

## API Reference

### `registerResourceTemplate(template)`

Register a resource template with the server.

**Parameters:**
- `template.uriTemplate` (string) - URI pattern with `{param}` placeholders
- `template.name` (string) - Human-readable name
- `template.description` (string) - Description of what the template provides
- `template.mimeType` (string, optional) - Default MIME type
- `template.handler` (Function) - Async function `(uri, params) => ReadResourceResult`
  - `uri` - The actual requested URI
  - `params` - Object with extracted parameters

**Returns:** void

**Example:**
```javascript
this.registerResourceTemplate({
  uriTemplate: 'myscheme://{category}/{item}',
  name: 'Item Lookup',
  description: 'Look up items by category',
  handler: async (uri, { category, item }) => {
    // Return resource result
  },
});
```

### `getResourceTemplates()`

Get list of registered templates for metadata.

**Returns:** Array of template objects (without handlers)

### `_matchUriTemplate(template, uri)` (internal)

Match a URI against a template pattern.

**Parameters:**
- `template` (string) - URI template pattern
- `uri` (string) - Actual URI to match

**Returns:** Object with extracted parameters, or null if no match

## See Also

- [MCP Specification - Resources](https://spec.modelcontextprotocol.io/specification/resources/)
- [Echo Server Implementation](../packages/servers/echo-server/src/index.js)
- [Base Server Source](../packages/core/src/base-server.js)

---

**Last Updated**: February 13, 2026  
**Status**: ✅ Implemented and tested
