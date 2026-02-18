import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer(
  { name: 'test', version: '1.0' },
  { capabilities: {} }
);

// Test 1: Try with name, description, parameters, execute
try {
  server.registerTool({
    name: 'test1',
    description: 'Test tool',
    parameters: z.object({ text: z.string() }),
    execute: async (params) => ({ result: 'ok' })
  });
  console.log('✅ Test 1 passed: name, description, parameters, execute');
} catch (e) {
  console.log('❌ Test 1 failed:', e.message);
}

// Test 2: Try with title, description, inputSchema
try {
  server.registerTool({
    title: 'test2',
    description: 'Test tool 2',
    inputSchema: z.object({ text: z.string() })
  });
  console.log('✅ Test 2 passed: title, description, inputSchema');
} catch (e) {
  console.log('❌ Test 2 failed:', e.message);
}

// Test 3: Check what methods are available
console.log('\nAvailable methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(server)).filter(m => !m.startsWith('_')));
