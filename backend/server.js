// server.js - API Gateway & Reverse Proxy to Spring Boot Backend
const express = require('express');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const {
  corsMiddleware,
  helmetMiddleware,
  authRateLimiter,
  generalRateLimiter,
  headerSanitizer,
} = require('./middleware/gatewaySecurity');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SPRING_BOOT_URL = process.env.SPRING_BOOT_URL || 'http://localhost:8080';

// Trust proxy for rate limiting behind reverse proxies (if deployed in containers)
app.set('trust proxy', 1);

// 1. Core Gateway Security Layers
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(headerSanitizer);

// 2. Gateway Health Check (Local - responds immediately without depending on upstream)
app.get(['/health', '/api/gateway-health'], (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'RBFS API Gateway',
    timestamp: new Date().toISOString(),
    upstream: SPRING_BOOT_URL,
  });
});

// 3. Tiered Rate Limiting
app.use('/api/auth', authRateLimiter);
app.use('/api', generalRateLimiter);

// 4. Reverse Proxy to Spring Boot 3.2 Backend
// Note: We mount the proxy BEFORE any body-parsers to preserve raw streams for
// AES-256 multipart file uploads and streaming decrypted downloads.
const springBootProxy = createProxyMiddleware({
  target: SPRING_BOOT_URL,
  changeOrigin: true,
  pathRewrite: (pathStr, req) => req.originalUrl,
  ws: true, // Support WebSocket if needed
  logLevel: 'info',
  on: {
    error: (err, req, res) => {
      console.error(`[API Gateway Error] Failed to proxy ${req.method} ${req.url} -> ${SPRING_BOOT_URL}:`, err.message);
      if (res && res.writeHead && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 502,
            error: 'Bad Gateway',
            message: 'Upstream Spring Boot backend service is unreachable or initializing.',
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
    proxyReq: (proxyReq, req, res) => {
      // Forward client IP and original host headers cleanly
      if (req.ip) {
        proxyReq.setHeader('X-Forwarded-For', req.ip);
      }
    },
    proxyRes: (proxyRes, req, res) => {
      // Ensure Content-Disposition is retained for file downloads
      const disposition = proxyRes.headers['content-disposition'];
      if (disposition) {
        res.setHeader('Content-Disposition', disposition);
      }
    },
  },
});

// Proxy all /api traffic to Spring Boot (Spring Boot context-path is /api)
app.use('/api', springBootProxy);

// 5. Global 404 handler for routes outside /api
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl} on API Gateway`,
  });
});

// 6. Global Exception Handler
app.use((err, req, res, next) => {
  console.error('[API Gateway Global Error]:', err.stack);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      status: err.status || 500,
      error: 'Gateway Error',
      message: err.message || 'Internal gateway error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🛡️  API Gateway running on port ${PORT}`);
  console.log(`🔀 Reverse proxying /api/** to Spring Boot at ${SPRING_BOOT_URL}`);
  console.log(`🔒 Static file serving disabled — unauthenticated file exposure blocked`);
});
