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
const adminRoutes = require('./src/routes/admin');
const snippetsRoutes = require('./src/routes/snippets');
const apisRoutes = require('./src/routes/apis');
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
        "https://www.googletagmanager.com",      /* Google Analytics gtag.js */
        "https://pagead2.googlesyndication.com",
        "https://adservice.google.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",  /* SQL.js */
        "https://cdn.tiny.cloud"          /* TinyMCE rich text editor (admin only) */
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",                                /* allow all HTTPS thumbnail URLs */
        "https://www.google-analytics.com",
        "https://pagead2.googlesyndication.com",
        "https://cdn.jsdelivr.net"
      ],
      connectSrc: [
        "'self'",
        "https://www.google-analytics.com",      /* GA event collection */
        "https://analytics.google.com",
        "https://stats.g.doubleclick.net",
        "https://region1.google-analytics.com",
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
  etag: true,
  setHeaders: (res, filePath) => {
    /* Immutable cache for CSS/JS (fingerprinted in production builds) */
    if (/\.(css|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');   /* 7 days */
    }
    /* Longer cache for images and fonts */
    if (/\.(svg|png|jpg|jpeg|webp|woff2|woff)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');  /* 30 days */
    }
    /* Add vary header for proper caching with compression */
    res.setHeader('Vary', 'Accept-Encoding');
  }
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
app.use('/snippets', snippetsRoutes);
app.use('/apis', apisRoutes);
app.use('/admin', adminRoutes);
app.use('/resources', resourcesRoutes);
app.use('/', pagesRoutes);
app.use('/legal', legalRoutes);
app.use('/api', apiRoutes);

/* ========== SITEMAP.XML ========== */
/**
 * Dynamically generated sitemap from all published articles + static pages.
 * Cached for 6 hours to avoid DB hits on every request.
 */
let sitemapCache = { xml: null, generatedAt: 0 };
const SITEMAP_TTL = 6 * 60 * 60 * 1000; /* 6 hours */

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (!sitemapCache.xml || now - sitemapCache.generatedAt > SITEMAP_TTL) {
      const SITE = process.env.SITE_URL || 'https://value.codes';
      const today = new Date().toISOString().split('T')[0];

      /* Fetch DB-driven content in parallel */
      const [
        [articles],
        [snippetCats],
        [apiCats],
        [snippets],
        [apis]
      ] = await Promise.all([
        db.query("SELECT slug, updated_at, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC"),
        db.query("SELECT slug FROM snippet_categories ORDER BY name").catch(() => [[]]),
        db.query("SELECT slug FROM api_categories ORDER BY name").catch(() => [[]]),
        db.query("SELECT s.slug, sc.slug AS category_slug, s.updated_at FROM snippets s JOIN snippet_categories sc ON s.category_id = sc.id WHERE s.status = 'published' ORDER BY s.updated_at DESC").catch(() => [[]]),
        db.query("SELECT a.slug, ac.slug AS category_slug, a.updated_at FROM apis a JOIN api_categories ac ON a.category_id = ac.id WHERE a.status = 'published' ORDER BY a.updated_at DESC").catch(() => [[]])
      ]);

      /* ---- Static pages ---- */
      const staticPages = [
        /* Core */
        { loc: `${SITE}/`,          priority: '1.0', changefreq: 'daily',   lastmod: today },
        { loc: `${SITE}/blog/`,     priority: '0.9', changefreq: 'daily',   lastmod: today },
        { loc: `${SITE}/tools/`,    priority: '0.9', changefreq: 'weekly',  lastmod: today },
        { loc: `${SITE}/compiler/`, priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/snippets/`, priority: '0.8', changefreq: 'weekly',  lastmod: today },
        { loc: `${SITE}/apis/`,     priority: '0.8', changefreq: 'weekly',  lastmod: today },
        /* Tools — individual pages */
        { loc: `${SITE}/tools/json-formatter/`,      priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/regex-builder/`,       priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/diff-checker/`,        priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/base64-encoder/`,      priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/color-picker/`,        priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/cron-builder/`,        priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/jwt-decoder/`,         priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/hash-generator/`,      priority: '0.8', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/mock-data-generator/`, priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/tools/code-formatter/`,      priority: '0.7', changefreq: 'monthly', lastmod: today },
        /* Resources */
        { loc: `${SITE}/resources/`,                    priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/developer-tools/`,    priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/best-practices/`,     priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/career-roadmaps/`,    priority: '0.7', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/essential-software/`, priority: '0.6', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/documentation/`,      priority: '0.6', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/resources/glossary/`,           priority: '0.6', changefreq: 'monthly', lastmod: today },
        /* Company */
        { loc: `${SITE}/about/`,   priority: '0.5', changefreq: 'monthly', lastmod: today },
        { loc: `${SITE}/contact/`, priority: '0.4', changefreq: 'monthly', lastmod: today },
        /* Legal */
        { loc: `${SITE}/legal/privacy-policy/`,  priority: '0.3', changefreq: 'yearly', lastmod: today },
        { loc: `${SITE}/legal/terms-of-service/`, priority: '0.3', changefreq: 'yearly', lastmod: today }
      ];

      const makeUrl = (loc, lastmod, changefreq, priority) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

      const staticEntries  = staticPages.map(p => makeUrl(p.loc, p.lastmod, p.changefreq, p.priority));
      const articleEntries = articles.map(a => makeUrl(
        `${SITE}/blog/${a.slug}/`,
        (a.updated_at || a.published_at || new Date()).toISOString().split('T')[0],
        'monthly', '0.8'
      ));
      const snippetCatEntries = snippetCats.map(c => makeUrl(`${SITE}/snippets/${c.slug}/`, today, 'weekly', '0.7'));
      const apiCatEntries     = apiCats.map(c => makeUrl(`${SITE}/apis/${c.slug}/`, today, 'weekly', '0.7'));
      const snippetEntries    = snippets.map(s => makeUrl(
        `${SITE}/snippets/${s.category_slug}/${s.slug}/`,
        (s.updated_at || new Date()).toISOString().split('T')[0],
        'monthly', '0.7'
      ));
      const apiEntries = apis.map(a => makeUrl(
        `${SITE}/apis/${a.category_slug}/${a.slug}/`,
        (a.updated_at || new Date()).toISOString().split('T')[0],
        'monthly', '0.7'
      ));

      const allEntries = [
        ...staticEntries,
        ...articleEntries,
        ...snippetCatEntries,
        ...snippetEntries,
        ...apiCatEntries,
        ...apiEntries
      ];

      sitemapCache.xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allEntries.join('\n')}\n</urlset>`;
      sitemapCache.generatedAt = now;
    }

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=21600'); /* 6 hours */
    res.send(sitemapCache.xml);
  } catch (err) {
    process.stderr.write(`[Sitemap] Error: ${err.message}\n`);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>');
  }
});

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
    ogImage: `${process.env.SITE_URL || 'https://value.codes'}/images/og-image.svg`,
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
    ogImage: `${process.env.SITE_URL || 'https://value.codes'}/images/og-image.svg`,
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
  const startListen = () => {
    app.listen(PORT, () => {
      process.stdout.write(`[Value.Codes] Server running on port ${PORT}\n`);
      process.stdout.write(`[Value.Codes] Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  };

  try {
    /* Test database connectivity with a hard 8-second timeout */
    const dbCheck = db.getConnection().then(conn => { conn.release(); });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB connection timed out after 8s')), 8000)
    );
    await Promise.race([dbCheck, timeout]);
    startListen();
  } catch (err) {
    process.stderr.write(`[Value.Codes] DB unavailable: ${err.message}\n`);
    process.stderr.write('[Value.Codes] Starting without database — set DB_* env vars in hosting panel.\n');
    startListen();
  }
}

/* ========== CRASH PROTECTION ========== */
/**
 * Prevent unhandled promise rejections from silently crashing the server
 * in Node 18+ where they are fatal by default.
 */
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[Value.Codes] Unhandled rejection: ${reason}\n`);
});

process.on('uncaughtException', (err) => {
  process.stderr.write(`[Value.Codes] Uncaught exception: ${err.stack || err.message}\n`);
});

/* Graceful shutdown */
process.on('SIGTERM', async () => {
  process.stdout.write('[Value.Codes] SIGTERM received. Shutting down gracefully...\n');
  await db.end();
  process.exit(0);
});

startServer();

module.exports = app;
