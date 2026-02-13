#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Dashboard Static Server
 *
 * Serves the built dashboard and provides configuration API
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// CORS for API endpoints
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API: Get dashboard configuration
app.get('/api/config', (req, res) => {
  try {
    const configPath = join(__dirname, 'dashboard-config.json');
    if (!existsSync(configPath)) {
      return res.status(404).json({ error: 'Configuration file not found' });
    }
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (error) {
    console.error('Error reading config:', error);
    res.status(500).json({ error: 'Failed to read configuration' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'mcp-dashboard' });
});

// Serve static files from dist directory
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).json({
      error: 'Dashboard not built',
      message: 'Run "npm run build" in the dashboard package first',
    });
  });
}

app.listen(PORT, () => {
  console.log('\n🎛️  MCP Dashboard Server');
  console.log(`   Dashboard: http://localhost:${PORT}`);
  console.log(`   Config API: http://localhost:${PORT}/api/config`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
