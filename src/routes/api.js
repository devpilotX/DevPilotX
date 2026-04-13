/* ================================================================
   src/routes/api.js
   Value.Codes — API Routes (JSON endpoints) — SECURED
   ================================================================
   Changes from original:
   - All var → const/let
   - Error logging with pino
   - GitHub webhook signature verification
   - XSS protection via helpers.stripTags
   - CSRF handled globally by server.js (forms send _csrf token)
   ================================================================ */

'use strict';

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const helpers = require('../utils/helpers');
const { compilerLimiter, formLimiter } = require('../middleware/rateLimiter');
const pino = require('pino');
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

/* ========== GITHUB API ========== */
const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_ORG = 'Value-Codes';
const GITHUB_REPO = 'value-codes-platform';

/* ========== PISTON API CONFIG ========== */

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';
const PISTON_TIMEOUT = parseInt(process.env.PISTON_TIMEOUT, 10) || 30000;
const MAX_CODE_SIZE = 65536;
const MAX_STDIN_SIZE = 16384;
const MAX_OUTPUT_SIZE = 100000;

/* ========== LRU CACHE ========== */

const CACHE_MAX = 200;
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

function cacheKey(language, code, stdin) {
  return crypto.createHash('sha256')
    .update(language + '::' + code + '::' + (stdin || ''))
    .digest('hex');
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.result;
}

function cacheSet(key, result) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { result: result, timestamp: Date.now() });
}

/* ========== OUTPUT SANITIZATION ========== */

const ANSI_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

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

const inflight = new Set();

/* ========== LANGUAGE MAP ========== */

const PISTON_LANGUAGES = {
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
   POST /api/contact — Contact Form Submission
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    try {
      const ip = req.headers['x-forwarded-for']
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
      logger.error({ err, route: '/api/contact' }, 'Contact form submission failed');
      return res.status(500).json({
        success: false,
        error: 'Something went wrong. Please try again later.'
      });
    }
  }
);

/* ==============================================================
   POST /api/newsletter — Newsletter Subscription
   ============================================================== */
router.post('/newsletter',
  formLimiter,
  [
    body('email')
      .trim()
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    try {
      const [existing] = await db.execute(
        'SELECT id, is_unsubscribed FROM subscribers WHERE email = ? LIMIT 1',
        [req.body.email]
      );

      if (existing.length > 0) {
        if (existing[0].is_unsubscribed) {
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

      await db.execute(
        'INSERT INTO subscribers (email) VALUES (?)',
        [req.body.email]
      );

      return res.json({
        success: true,
        message: 'Thank you for subscribing! You will receive our next newsletter.'
      });
    } catch (err) {
      logger.error({ err, route: '/api/newsletter' }, 'Newsletter subscription failed');
      return res.status(500).json({
        success: false,
        error: 'Something went wrong. Please try again later.'
      });
    }
  }
);

/* ==============================================================
   POST /api/compiler/run — Code Compilation via Piston API Proxy
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const langId = req.body.language;
    const langConfig = PISTON_LANGUAGES[langId];

    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported language: "' + langId + '".'
      });
    }

    const code = req.body.code;
    const stdin = req.body.stdin || '';

    if (!code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Code is empty.'
      });
    }

    /* ===== Step 2: LRU Cache Lookup ===== */
    const key = cacheKey(langId, code, stdin);
    const cached = cacheGet(key);
    if (cached) {
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
      const controller = new AbortController();
      const timeout = setTimeout(() => { controller.abort(); }, PISTON_TIMEOUT + 5000);
      const startTime = performance.now();

      const FILENAME_OVERRIDES = { java: 'Main.java', scala: 'Main.scala' };
      const filename = FILENAME_OVERRIDES[langId] || ('main.' + langConfig.ext);

      const response = await fetch(PISTON_URL, {
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
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

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
      const data = await response.json();
      const compile = data.compile || {};
      const run = data.run || {};
      let result;

      /* Compilation error — NOT cached */
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

      /* Runtime error — NOT cached */
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

      /* ===== Step 6: Success — Cache the result ===== */
      const stdout = sanitizeOutput(run.stdout || run.output || '');
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
          error: 'Execution timed out (' + (PISTON_TIMEOUT / 1000) + 's). Your code may have an infinite loop.',
          exitCode: 1,
          time: (PISTON_TIMEOUT / 1000) + 's (timeout)'
        });
      }
      logger.error({ err, route: '/api/compiler/run' }, 'Compiler proxy error');
      return res.status(500).json({
        success: false,
        output: '',
        error: 'Server error. Please try again in a moment.',
        exitCode: 1
      });
    } finally {
      inflight.delete(key);
    }
  }
);

/* ==============================================================
   GET /api/github-stats — Live repo star & fork counts
   ============================================================== */
router.get('/github-stats', async (req, res) => {
  try {
    const { data: repo } = await octokit.rest.repos.get({ owner: GITHUB_ORG, repo: GITHUB_REPO });
    res.json({
      success: true,
      stats: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count
      }
    });
  } catch (err) {
    logger.error({ err, route: '/api/github-stats' }, 'GitHub stats fetch failed');
    res.status(500).json({ success: false });
  }
});

/* ==============================================================
   GET /api/github-issues — Open "good first issue" issues
   ============================================================== */
router.get('/github-issues', async (req, res) => {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      state: 'open',
      labels: 'good first issue',
      per_page: 5
    });
    res.json({ success: true, issues: issues });
  } catch (err) {
    logger.error({ err, route: '/api/github-issues' }, 'GitHub issues fetch failed');
    res.status(500).json({ success: false });
  }
});

/* ==============================================================
   POST /api/github-webhook — GitHub webhook receiver (SECURED)
   ============================================================== */
router.post('/github-webhook', (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  /* If no secret is configured, reject all webhooks */
  if (!secret) {
    logger.warn('[Webhook] GITHUB_WEBHOOK_SECRET not set — rejecting webhook');
    return res.status(401).send('Webhook secret not configured');
  }

  if (!sig) {
    return res.status(401).send('Missing signature');
  }

  /* Verify HMAC signature */
  const body = JSON.stringify(req.body);
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      logger.warn('[Webhook] Invalid signature received');
      return res.status(401).send('Invalid signature');
    }
  } catch (err) {
    logger.error({ err }, '[Webhook] Signature verification error');
    return res.status(401).send('Signature verification failed');
  }

  /* Signature valid — process the webhook */
  const event = req.headers['x-github-event'] || 'unknown';
  logger.info({ event }, '[Webhook] Valid GitHub webhook received');

  // Add your webhook processing logic here

  res.status(200).send('OK');
});

module.exports = router;