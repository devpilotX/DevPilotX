/* ================================================================
   src/routes/api.js
   Value.Codes | API Routes (JSON endpoints)
   POST /api/contact       | Contact form submission
   POST /api/newsletter    | Newsletter subscription
   POST /api/compiler/run  | Code compilation via Piston API proxy

   COMPILER PROXY FEATURES:
   - LRU Cache: SHA-256 keyed, 5min TTL, 200 max entries
   - Output Sanitization: ANSI stripping, newline normalization
   - Request Deduplication: prevents processing identical in-flight requests
   - Input Validation: code size (64KB), stdin size (16KB), language whitelist
   - Output Truncation: server-side 100KB limit
   - AbortController: configurable timeout with graceful abort
   - Structured Response: { success, output, error, exitCode, time, cached }

   All endpoints are rate-limited and validated.
   ================================================================ */

'use strict';

var router = require('express').Router();
var { body, validationResult } = require('express-validator');
var crypto = require('crypto');
var db = require('../config/database');
var helpers = require('../utils/helpers');
var { compilerLimiter, formLimiter } = require('../middleware/rateLimiter');

/* ========== GITHUB API ========== */
var { Octokit } = require('@octokit/rest');
var octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
var GITHUB_ORG = 'Value-Codes';
var GITHUB_REPO = 'value-codes-platform';

/* ========== PISTON API CONFIG ========== */

var PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';
var PISTON_TIMEOUT = parseInt(process.env.PISTON_TIMEOUT, 10) || 30000;
var MAX_CODE_SIZE = 65536;
var MAX_STDIN_SIZE = 16384;
var MAX_OUTPUT_SIZE = 100000;

/* ========== LRU CACHE ========== */
/* In-memory LRU cache for compiler results.
   Key: SHA-256 hash of (language + code + stdin)
   Value: { result, timestamp }
   Max entries: 200 (tuned for 1536MB RAM on Hostinger)
   TTL: 5 minutes (results expire after this)
   Only successful executions are cached.
   Compilation/runtime errors are NOT cached (user will fix and retry). */

var CACHE_MAX = 200;
var CACHE_TTL = 5 * 60 * 1000;
var cache = new Map();

function cacheKey(language, code, stdin) {
  return crypto.createHash('sha256')
    .update(language + '::' + code + '::' + (stdin || ''))
    .digest('hex');
}

function cacheGet(key) {
  var entry = cache.get(key);
  if (!entry) return null;
  /* Check TTL expiry */
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  /* Move to end (most recently used) for LRU ordering */
  cache.delete(key);
  cache.set(key, entry);
  return entry.result;
}

function cacheSet(key, result) {
  /* Evict oldest entry if at capacity */
  if (cache.size >= CACHE_MAX) {
    var oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { result: result, timestamp: Date.now() });
}

/* ========== OUTPUT SANITIZATION ========== */
/* Strip ANSI escape codes (colors, cursor movement),
   normalize line endings (\r\n → \n, \r → \n),
   truncate to MAX_OUTPUT_SIZE for safety and bandwidth. */

var ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function sanitizeOutput(str) {
  if (!str) return '';
  return str
    .replace(ANSI_REGEX, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .substring(0, MAX_OUTPUT_SIZE)
    .trimEnd();
}

/* ========== REQUEST DEDUPLICATION ========== */
/* Prevents processing the same request twice if user double-clicks Run.
   Uses a Set of in-flight cache keys, cleared on completion. */

var inflight = new Set();

/* ========== LANGUAGE MAP ========== */
/* Maps frontend language IDs to Piston language names,
   versions, and file extensions for the execution payload. */

var PISTON_LANGUAGES = {
  python:     { piston: 'python',     version: '3.10.0',  ext: 'py' },
  javascript: { piston: 'javascript', version: '18.15.0', ext: 'js' },
  typescript: { piston: 'typescript', version: '5.0.3',   ext: 'ts' },
  'c++':      { piston: 'c++',        version: '10.2.0',  ext: 'cpp' },
  c:          { piston: 'c',          version: '10.2.0',  ext: 'c' },
  java:       { piston: 'java',       version: '15.0.2',  ext: 'java' },
  csharp:     { piston: 'csharp',     version: '6.12.0',  ext: 'cs' },
  go:         { piston: 'go',         version: '1.16.2',  ext: 'go' },
  rust:       { piston: 'rust',       version: '1.68.2',  ext: 'rs' },
  ruby:       { piston: 'ruby',       version: '3.0.1',   ext: 'rb' },
  php:        { piston: 'php',        version: '8.2.3',   ext: 'php' },
  swift:      { piston: 'swift',      version: '5.3.3',   ext: 'swift' },
  kotlin:     { piston: 'kotlin',     version: '1.8.20',  ext: 'kt' },
  scala:      { piston: 'scala',      version: '3.2.2',   ext: 'scala' },
  r:          { piston: 'r',          version: '4.1.1',   ext: 'r' },
  perl:       { piston: 'perl',       version: '5.36.0',  ext: 'pl' },
  lua:        { piston: 'lua',        version: '5.4.4',   ext: 'lua' },
  bash:       { piston: 'bash',       version: '5.2.0',   ext: 'sh' },
  sql:        { piston: 'sqlite3',    version: '3.36.0',  ext: 'sql' }
};

/* ==============================================================
   POST /api/contact | Contact Form Submission
   ============================================================== */
router.post('/contact',
  formLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('subject')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 }).withMessage('Subject must be under 200 characters.'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 5000 }).withMessage('Message must be 10–5000 characters.')
  ],
  async function (req, res) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    try {
      var ip = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip;

      await db.execute(
        'INSERT INTO contacts (name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)',
        [
          helpers.stripTags(req.body.name),
          req.body.email,
          helpers.stripTags(req.body.subject || ''),
          helpers.stripTags(req.body.message),
          ip
        ]
      );

      return res.json({
        success: true,
        message: 'Thank you! Your message has been sent. We will reply within 24 hours.'
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Something went wrong. Please try again later.'
      });
    }
  }
);

/* ==============================================================
   POST /api/newsletter | Newsletter Subscription
   ============================================================== */
router.post('/newsletter',
  formLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail()
  ],
  async function (req, res) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    try {
      /* Check if already subscribed */
      var [existing] = await db.execute(
        'SELECT id, is_unsubscribed FROM subscribers WHERE email = ? LIMIT 1',
        [req.body.email]
      );

      if (existing.length > 0) {
        if (existing[0].is_unsubscribed) {
          /* Re-subscribe */
          await db.execute(
            'UPDATE subscribers SET is_unsubscribed = 0 WHERE id = ?',
            [existing[0].id]
          );
          return res.json({
            success: true,
            message: 'Welcome back! You have been re-subscribed to our newsletter.'
          });
        }
        return res.json({
          success: true,
          message: 'You are already subscribed to our newsletter!'
        });
      }

      /* New subscriber */
      await db.execute(
        'INSERT INTO subscribers (email) VALUES (?)',
        [req.body.email]
      );

      return res.json({
        success: true,
        message: 'Thank you for subscribing! You will receive our next newsletter.'
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Something went wrong. Please try again later.'
      });
    }
  }
);

/* ==============================================================
   POST /api/compiler/run | Code Compilation via Piston API Proxy
   ==============================================================
   Request:  { language: string, code: string, stdin?: string }
   Response: { success, output, error, exitCode, time, cached? }

   Flow:
   1. Validate input (language whitelist, code size, stdin size)
   2. Check LRU cache → instant response if hit
   3. Check inflight dedup → 429 if duplicate in-flight
   4. Proxy to Piston API with AbortController timeout
   5. Sanitize output (ANSI strip, newline normalize, truncate)
   6. Cache successful results only
   7. Return structured response
   ============================================================== */
router.post('/compiler/run',
  compilerLimiter,
  [
    body('language')
      .trim()
      .notEmpty().withMessage('Language is required.'),
    body('code')
      .notEmpty().withMessage('Code is required.')
      .isLength({ max: MAX_CODE_SIZE }).withMessage('Code exceeds maximum size (64 KB).'),
    body('stdin')
      .optional({ checkFalsy: true })
      .isLength({ max: MAX_STDIN_SIZE }).withMessage('Stdin exceeds maximum size (16 KB).')
  ],
  async function (req, res) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    var langId = req.body.language;
    var langConfig = PISTON_LANGUAGES[langId];

    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language: "' + langId + '".'
      });
    }

    var code = req.body.code;
    var stdin = req.body.stdin || '';

    /* Empty code check */
    if (!code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Code is empty.'
      });
    }

    /* ===== Step 2: LRU Cache Lookup ===== */
    var key = cacheKey(langId, code, stdin);
    var cached = cacheGet(key);
    if (cached) {
      /* Return cached result with cached flag for UI indicator */
      return res.json(Object.assign({}, cached, { cached: true }));
    }

    /* ===== Step 3: Request Deduplication ===== */
    if (inflight.has(key)) {
      return res.status(429).json({
        success: false,
        error: 'This exact code is already being executed. Please wait.'
      });
    }
    inflight.add(key);

    try {
      /* ===== Step 4: Proxy to Piston API ===== */
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, PISTON_TIMEOUT + 5000);
      var startTime = performance.now();

      /* Java requires the filename to match the public class name (Main.java).
         Scala uses object names by convention (Main.scala).
         All other languages use generic main.ext. */
      var FILENAME_OVERRIDES = { java: 'Main.java', scala: 'Main.scala' };
      var filename = FILENAME_OVERRIDES[langId] || ('main.' + langConfig.ext);

      var response = await fetch(PISTON_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ValueCodes-Compiler/2.0'
        },
        body: JSON.stringify({
          language: langConfig.piston,
          version: langConfig.version,
          files: [{ name: filename, content: code }],
          stdin: stdin,
          run_timeout: 30000,
          compile_timeout: 30000
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      var elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      if (!response.ok) {
        return res.json({
          success: false,
          output: '',
          error: 'Execution service returned error (' + response.status + ').',
          exitCode: 1,
          time: elapsed + 's'
        });
      }

      /* ===== Step 5: Parse and Sanitize Response ===== */
      var data = await response.json();
      var compile = data.compile || {};
      var run = data.run || {};
      var result;

      /* Compilation error | NOT cached (user will fix) */
      if (compile.code !== undefined && compile.code !== 0) {
        result = {
          success: false,
          output: sanitizeOutput(compile.output),
          error: sanitizeOutput(compile.stderr || compile.output || 'Compilation failed.'),
          exitCode: compile.code || 1,
          time: elapsed + 's'
        };
        return res.json(result);
      }

      /* Runtime error | NOT cached (user will fix) */
      if (run.code !== 0 && run.code !== undefined && run.code !== null) {
        result = {
          success: false,
          output: sanitizeOutput(run.stdout),
          error: sanitizeOutput(run.stderr || run.output || 'Runtime error.'),
          exitCode: run.code,
          time: elapsed + 's'
        };
        return res.json(result);
      }

      /* ===== Step 6: Success | Cache the result ===== */
      var stdout = sanitizeOutput(run.stdout || run.output || '');
      result = {
        success: true,
        output: stdout || '(No output)',
        error: sanitizeOutput(run.stderr),
        exitCode: run.code || 0,
        time: elapsed + 's'
      };

      cacheSet(key, result);
      return res.json(result);

    } catch (err) {
      if (err.name === 'AbortError') {
        return res.json({
          success: false,
          output: '',
          error: 'Execution timed out (' + (PISTON_TIMEOUT / 1000) + 's). Your code may have an infinite loop or excessive processing.',
          exitCode: 1,
          time: (PISTON_TIMEOUT / 1000) + 's (timeout)'
        });
      }
      return res.status(500).json({
        success: false,
        output: '',
        error: 'Server error. Please try again in a moment.',
        exitCode: 1
      });
    } finally {
      /* Always remove from inflight set */
      inflight.delete(key);
    }
  }
);

/* ==============================================================
   GET /api/github-stats | Live repo star & fork counts
   ============================================================== */
router.get('/github-stats', async function (req, res) {
  try {
    var { data: repo } = await octokit.rest.repos.get({ owner: GITHUB_ORG, repo: GITHUB_REPO });
    res.json({
      success: true,
      stats: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count
      }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ==============================================================
   GET /api/github-issues | Open "good first issue" issues
   ============================================================== */
router.get('/github-issues', async function (req, res) {
  try {
    var { data: issues } = await octokit.rest.issues.listForRepo({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      state: 'open',
      labels: 'good first issue',
      per_page: 5
    });
    res.json({ success: true, issues: issues });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ==============================================================
   POST /api/github-webhook | GitHub webhook receiver
   Webhook URL: https://value.codes/api/github-webhook
   ============================================================== */
router.post('/github-webhook', function (req, res) {
  res.status(200).send('Webhook received');
});

module.exports = router;