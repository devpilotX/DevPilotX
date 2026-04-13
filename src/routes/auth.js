/**
 * ============================================================
 * Value.Codes — Authentication Routes (CLEANED UP)
 * ============================================================
 * Changes from original:
 * - Extracted renderLogin() and renderRegister() helpers
 *   (eliminates 8× copy-paste of render config)
 * - All catch blocks now log errors
 * - OG image changed from SVG to PNG
 * - CSRF tokens handled globally by server.js middleware
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authLimiter } = require('../middleware/rateLimiter');
const pino = require('pino');
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

/* ========== BCRYPT CONFIGURATION ========== */
const SALT_ROUNDS = 12;

/* ========== RENDER HELPERS ========== */

function renderLogin(res, statusCode, overrides = {}) {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  res.status(statusCode).render('auth/login', {
    title: 'Login — Value.Codes | Sign In to Your Account',
    description: 'Sign in to your Value.Codes account to access the developer community, save preferences, and unlock Pro features.',
    keywords: 'login, sign in, value.codes account, developer login',
    canonical: `${siteUrl}/login`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.png`,
    schema: null,
    pageCSS: ['/css/auth.css'],
    pageJS: ['/js/auth.js'],
    errors: [],
    oldInput: {},
    ...overrides
  });
}

function renderRegister(res, statusCode, overrides = {}) {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  res.status(statusCode).render('auth/register', {
    title: 'Register — Value.Codes | Create Your Free Account',
    description: 'Create a free Value.Codes account to join the developer community, save tool preferences, and access exclusive features.',
    keywords: 'register, sign up, create account, value.codes, developer account',
    canonical: `${siteUrl}/register`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.png`,
    schema: null,
    pageCSS: ['/css/auth.css'],
    pageJS: ['/js/auth.js'],
    errors: [],
    oldInput: {},
    ...overrides
  });
}

/* ========== GET /login ========== */
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }
  renderLogin(res, 200);
});

/* ========== POST /login ========== */
router.post('/login',
  authLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return renderLogin(res, 400, {
        errors: errors.array(),
        oldInput: { email: req.body.email }
      });
    }

    try {
      const { email, password } = req.body;

      const [rows] = await db.execute(
        'SELECT id, username, email, password_hash, is_pro, avatar FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows.length === 0) {
        return renderLogin(res, 401, {
          errors: [{ msg: 'Invalid email or password.' }],
          oldInput: { email }
        });
      }

      const user = rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return renderLogin(res, 401, {
          errors: [{ msg: 'Invalid email or password.' }],
          oldInput: { email }
        });
      }

      /* Regenerate session to prevent session fixation */
      req.session.regenerate((err) => {
        if (err) {
          logger.error({ err }, '[Auth] Session regeneration failed during login');
          return renderLogin(res, 500, {
            errors: [{ msg: 'An error occurred. Please try again.' }],
            oldInput: { email }
          });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.isPro = !!user.is_pro;
        req.session.avatar = user.avatar;

        const returnTo = req.session.returnTo || '/profile';
        delete req.session.returnTo;

        return res.redirect(returnTo);
      });
    } catch (err) {
      logger.error({ err }, '[Auth] Login error');
      return renderLogin(res, 500, {
        errors: [{ msg: 'An error occurred. Please try again.' }],
        oldInput: { email: req.body.email }
      });
    }
  }
);

/* ========== GET /register ========== */
router.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }
  renderRegister(res, 200);
});

/* ========== POST /register ========== */
router.post('/register',
  authLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3–30 characters.')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, hyphens, and underscores.'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
    body('confirmPassword')
      .custom((value, { req: r }) => {
        if (value !== r.body.password) {
          throw new Error('Passwords do not match.');
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return renderRegister(res, 400, {
        errors: errors.array(),
        oldInput: { username: req.body.username, email: req.body.email }
      });
    }

    try {
      const { username, email, password } = req.body;

      const [existingEmail] = await db.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      if (existingEmail.length > 0) {
        return renderRegister(res, 409, {
          errors: [{ msg: 'An account with this email already exists.' }],
          oldInput: { username, email }
        });
      }

      const [existingUsername] = await db.execute(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [username]
      );
      if (existingUsername.length > 0) {
        return renderRegister(res, 409, {
          errors: [{ msg: 'This username is already taken.' }],
          oldInput: { username, email }
        });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const [result] = await db.execute(
        'INSERT INTO users (username, email, password_hash, is_pro, created_at) VALUES (?, ?, ?, 0, NOW())',
        [username, email, passwordHash]
      );

      req.session.regenerate((err) => {
        if (err) {
          logger.error({ err }, '[Auth] Session regeneration failed during register');
          req.session.flashSuccess = 'Account created successfully! Please log in.';
          return res.redirect('/login');
        }

        req.session.userId = result.insertId;
        req.session.username = username;
        req.session.email = email;
        req.session.isPro = false;
        req.session.avatar = null;

        return res.redirect('/profile');
      });
    } catch (err) {
      logger.error({ err }, '[Auth] Registration error');
      return renderRegister(res, 500, {
        errors: [{ msg: 'An error occurred. Please try again.' }],
        oldInput: { username: req.body.username, email: req.body.email }
      });
    }
  }
);

/* ========== GET /logout ========== */
router.get('/logout', (req, res) => {
  if (!req.session) {
    return res.redirect('/');
  }

  req.session.destroy((err) => {
    if (err) logger.error({ err }, '[Auth] Session destroy failed during logout');
    res.clearCookie('vc_sid');
    return res.redirect('/');
  });
});

module.exports = router;