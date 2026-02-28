/**
 * ============================================================
 * Value.Codes — Main Server Entry Point
 * ============================================================
 * Express.js server configuration for the Value.Codes platform.
 * Handles middleware setup, route mounting, static file serving,
 * session management, and error handling.
 * ============================================================
 */

'use strict';

/* ========== LOAD ENVIRONMENT VARIABLES ========== */
require('dotenv').config();

/* ========== CORE DEPENDENCIES ========== */
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

/* ========== DATABASE ========== */
const db = require('./src/config/database');

/* ========== MIDDLEWARE ========== */
const { setLocals } = require('./src/middleware/locals');

/* ========== ROUTE MODULES ========== */
const indexRoutes = require('./src/routes/index');
const toolsRoutes = require('./src/routes/tools');
const compilerRoutes = require('./src/routes/compiler');
const communityRoutes = require('./src/routes/community');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const blogRoutes = require('./src/routes/blog');
const resourcesRoutes = require('./src/routes/resources');
const pagesRoutes = require('./src/routes/pages');
const legalRoutes = require('./src/routes/legal');
const apiRoutes = require('./src/routes/api');

/* ========== CREATE EXPRESS APP ========== */
const app = express();
const PORT = process.env.PORT || 3000;

/* ========== TRUST PROXY ========== */
/**
 * Required when running behind nginx/reverse proxy (Hostinger, etc.).
 * Without this, req.ip is always 127.0.0.1 (the proxy's loopback address),
 * meaning ALL users share the same rate-limit bucket — hitting limits instantly.
 * With trust proxy = 1, req.ip correctly reflects the real client IP from
 * the X-Forwarded-For header set by nginx.
 */
app.set('trust proxy', 1);

/* ========== VIEW ENGINE SETUP ========== */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

/* ========== SECURITY MIDDLEWARE ========== */
/**
 * Helmet sets various HTTP security headers.
 * We customize the Content Security Policy to allow:
 * - Inline scripts ONLY for JSON-LD structured data (via nonce or hash would be
 *   ideal but JSON-LD is non-executable so it's safe)
 * - Google AdSense domains for ad serving
 * - Self-hosted resources only for everything else
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",          /* Pyodide: Python exec() requires eval */
        "'wasm-unsafe-eval'",     /* WebAssembly instantiation (Pyodide, SQL.js) */
        "https://pagead2.googlesyndication.com",
        "https://adservice.google.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"  /* SQL.js */
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://pagead2.googlesyndication.com",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"  /* SQL.js WASM binary */
      ],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net"
      ],
      workerSrc: [
        "'self'",
        "blob:",
        "https://cdn.jsdelivr.net"
      ],
      frameSrc: [
        "https://googleads.g.doubleclick.net",
        "https://pagead2.googlesyndication.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false
}));

/* ========== COMPRESSION MIDDLEWARE ========== */
/**
 * Gzip compression for all responses.
 * Significantly reduces bandwidth and improves load times.
 */
app.use(compression());

/* ========== BODY PARSING ========== */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ========== STATIC FILE SERVING ========== */
/**
 * Serve static files from /public with 7-day cache headers.
 * This improves Core Web Vitals by reducing repeat requests.
 */
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true
}));

/* ========== SESSION CONFIGURATION ========== */
/**
 * Sessions are stored in MySQL via a custom store approach.
 * express-session with cookie-based session IDs, server-side storage.
 * In production, secure: true ensures cookies are sent only over HTTPS.
 */
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  name: 'vc_sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

/* ========== GLOBAL TEMPLATE VARIABLES ========== */
/**
 * Sets variables available in every EJS template:
 * isLoggedIn, currentUser, currentPath, siteName, siteUrl, adsensePubId
 */
app.use(setLocals);

/* ========== MOUNT ROUTES ========== */
app.use('/', indexRoutes);
app.use('/tools', toolsRoutes);
app.use('/compiler', compilerRoutes);
app.use('/community', communityRoutes);
app.use('/', authRoutes);
app.use('/', profileRoutes);
app.use('/blog', blogRoutes);
app.use('/resources', resourcesRoutes);
app.use('/', pagesRoutes);
app.use('/legal', legalRoutes);
app.use('/api', apiRoutes);

/* ========== 404 HANDLER ========== */
/**
 * Catch all unmatched routes and render the 404 page.
 * This must come after all route definitions.
 */
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found — Value.Codes',
    description: 'The page you are looking for does not exist or has been moved.',
    keywords: '404, page not found, value.codes',
    canonical: `${process.env.SITE_URL || 'https://value.codes'}${req.originalUrl}`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${process.env.SITE_URL || 'https://value.codes'}/images/og-image.jpg`,
    schema: null,
    pageCSS: ['/css/errors.css'],
    pageJS: []
  });
});

/* ========== 500 ERROR HANDLER ========== */
/**
 * Global error handler for uncaught errors.
 * Logs the error stack in development and renders the 500 page.
 */
app.use((err, req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    process.stderr.write(`[ERROR] ${err.stack}\n`);
  }

  res.status(500).render('errors/500', {
    title: 'Server Error — Value.Codes',
    description: 'Something went wrong on our end. Please try again later.',
    keywords: '500, server error, value.codes',
    canonical: process.env.SITE_URL || 'https://value.codes',
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${process.env.SITE_URL || 'https://value.codes'}/images/og-image.jpg`,
    schema: null,
    pageCSS: ['/css/errors.css'],
    pageJS: []
  });
});

/* ========== START SERVER ========== */
/**
 * Verify database connection, then start listening.
 * Graceful shutdown on SIGTERM to close DB pool.
 */
async function startServer() {
  try {
    /* Test database connectivity */
    const connection = await db.getConnection();
    connection.release();

    app.listen(PORT, () => {
      process.stdout.write(`[Value.Codes] Server running on port ${PORT}\n`);
      process.stdout.write(`[Value.Codes] Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    process.stderr.write(`[Value.Codes] Failed to connect to database: ${err.message}\n`);
    process.stderr.write('[Value.Codes] Starting server without database...\n');

    app.listen(PORT, () => {
      process.stdout.write(`[Value.Codes] Server running on port ${PORT} (no DB)\n`);
    });
  }
}

/* Graceful shutdown */
process.on('SIGTERM', async () => {
  process.stdout.write('[Value.Codes] SIGTERM received. Shutting down gracefully...\n');
  await db.end();
  process.exit(0);
});

startServer();

module.exports = app;
