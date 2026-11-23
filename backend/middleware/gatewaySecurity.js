// middleware/gatewaySecurity.js - Hardened API Gateway Security Middleware
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. Strict CORS Whitelist for Frontend
const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server) or matching frontend
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
};

// 2. Helmet Security Headers
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disabled for API Gateway to prevent interfering with API responses
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// 3. Tiered Rate Limiting
// Strict rate limit for auth endpoints to thwart brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// General rate limit for all API routes
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests. Please slow down and try again later.',
  },
});

// 4. Request Header Sanitization
const headerSanitizer = (req, res, next) => {
  // Strip dangerous/untrusted spoofed proxy headers
  delete req.headers['x-powered-by'];

  // Validate and sanitize Authorization header
  if (req.headers.authorization) {
    const auth = String(req.headers.authorization).trim();
    if (/^Bearer\s+[A-Za-z0-9\-._~+/]+=*$/.test(auth)) {
      req.headers.authorization = auth;
    } else if (auth.startsWith('Bearer ') && auth.length > 7) {
      req.headers.authorization = auth;
    } else {
      // Malformed authorization header stripped
      delete req.headers.authorization;
    }
  }

  next();
};

module.exports = {
  corsMiddleware: cors(corsOptions),
  helmetMiddleware,
  authRateLimiter,
  generalRateLimiter,
  headerSanitizer,
};
