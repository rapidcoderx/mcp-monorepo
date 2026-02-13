#!/usr/bin/env node

/**
 * Dashboard Static Server
 *
 * Serves the built dashboard and provides configuration API
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Logger setup
// ---------------------------------------------------------------------------
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { component: 'dashboard' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
          const comp = component ? ` [${component}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level.toUpperCase()}]${comp} ${message}${metaStr}`;
        }),
      ),
    }),
  ],
});

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug('HTTP request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
});

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
      logger.warn('Configuration file not found', { path: configPath });
      return res.status(404).json({ error: 'Configuration file not found' });
    }
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    logger.debug('Configuration loaded');
    res.json(config);
  } catch (error) {
    logger.error('Error reading config', { error: error.message });
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
  logger.warn('Dashboard dist directory not found — run "npm run build" first', { distPath });
  app.get('*', (req, res) => {
    res.status(503).json({
      error: 'Dashboard not built',
      message: 'Run "npm run build" in the dashboard package first',
    });
  });
}

app.listen(PORT, () => {
  logger.info('MCP Dashboard Server started', {
    dashboard: `http://localhost:${PORT}`,
    configApi: `http://localhost:${PORT}/api/config`,
    health: `http://localhost:${PORT}/api/health`,
  });
});
