/**
 * ============================================================
 * Value.Codes — Authentication Routes
 * ============================================================
 * GET  /login    — Render login form
 * POST /login    — Process login with bcrypt verification
 * GET  /register — Render registration form
 * POST /register — Process registration with validation
 * GET  /logout   — Destroy session and redirect to homepage
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authLimiter } = require('../middleware/rateLimiter');

/* ========== BCRYPT CONFIGURATION ========== */
const SALT_ROUNDS = 12;

/* ========== GET /login ========== */
router.get('/login', (req, res) => {
  /* Redirect already-authenticated users to profile */
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }

  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('auth/login', {
    title: 'Login — Value.Codes | Sign In to Your Account',
    description: 'Sign in to your Value.Codes account to access the developer community, save preferences, and unlock Pro features.',
    keywords: 'login, sign in, value.codes account, developer login',
    canonical: `${siteUrl}/login`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/auth.css'],
    pageJS: ['/js/auth.js'],
    errors: [],
    oldInput: {}
  });
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
    const siteUrl = process.env.SITE_URL || 'https://value.codes';

    /* Collect validation errors */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/login', {
        title: 'Login — Value.Codes | Sign In to Your Account',
        description: 'Sign in to your Value.Codes account to access the developer community, save preferences, and unlock Pro features.',
        keywords: 'login, sign in, value.codes account, developer login',
        canonical: `${siteUrl}/login`,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogImage: `${siteUrl}/images/og-image.svg`,
        schema: null,
        pageCSS: ['/css/auth.css'],
        pageJS: ['/js/auth.js'],
        errors: errors.array(),
        oldInput: { email: req.body.email }
      });
    }

    try {
      const { email, password } = req.body;

      /* Look up user by email */
      const [rows] = await db.execute(
        'SELECT id, username, email, password_hash, is_pro, avatar FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      /* User not found — generic message to prevent user enumeration */
      if (rows.length === 0) {
        return res.status(401).render('auth/login', {
          title: 'Login — Value.Codes | Sign In to Your Account',
          description: 'Sign in to your Value.Codes account to access the developer community, save preferences, and unlock Pro features.',
          keywords: 'login, sign in, value.codes account, developer login',
          canonical: `${siteUrl}/login`,
          robots: 'noindex, nofollow',
          ogType: 'website',
          ogImage: `${siteUrl}/images/og-image.svg`,
          schema: null,
          pageCSS: ['/css/auth.css'],
          pageJS: ['/js/auth.js'],
          errors: [{ msg: 'Invalid email or password.' }],
          oldInput: { email }
        });
      }

      const user = rows[0];

      /* Verify password against stored hash */
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).render('auth/login', {
          title: 'Login — Value.Codes | Sign In to Your Account',
          description: 'Sign in to your Value.Codes account to access the developer community, save preferences, and unlock Pro features.',
          keywords: 'login, sign in, value.codes account, developer login',
          canonical: `${siteUrl}/login`,
          robots: 'noindex, nofollow',
          ogType: 'website',
          ogImage: `${siteUrl}/images/og-image.svg`,
          schema: null,
          pageCSS: ['/css/auth.css'],
          pageJS: ['/js/auth.js'],
          errors: [{ msg: 'Invalid email or password.' }],
          oldInput: { email }
        });
      }

      /* Regenerate session to prevent session fixation */
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).render('auth/login', {
            title: 'Login — Value.Codes | Sign In to Your Account',
            description: 'Sign in to your Value.Codes account.',
            keywords: 'login, sign in',
            canonical: `${siteUrl}/login`,
            robots: 'noindex, nofollow',
            ogType: 'website',
            ogImage: `${siteUrl}/images/og-image.svg`,
            schema: null,
            pageCSS: ['/css/auth.css'],
            pageJS: ['/js/auth.js'],
            errors: [{ msg: 'An error occurred. Please try again.' }],
            oldInput: { email }
          });
        }

        /* Store user data in session */
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.isPro = !!user.is_pro;
        req.session.avatar = user.avatar;

        /* Redirect to originally requested page or profile */
        const returnTo = req.session.returnTo || '/profile';
        delete req.session.returnTo;

        return res.redirect(returnTo);
      });
    } catch (err) {
      return res.status(500).render('auth/login', {
        title: 'Login — Value.Codes | Sign In to Your Account',
        description: 'Sign in to your Value.Codes account.',
        keywords: 'login, sign in',
        canonical: `${siteUrl}/login`,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogImage: `${siteUrl}/images/og-image.svg`,
        schema: null,
        pageCSS: ['/css/auth.css'],
        pageJS: ['/js/auth.js'],
        errors: [{ msg: 'An error occurred. Please try again.' }],
        oldInput: { email: req.body.email }
      });
    }
  }
);

/* ========== GET /register ========== */
router.get('/register', (req, res) => {
  /* Redirect already-authenticated users to profile */
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }

  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('auth/register', {
    title: 'Register — Value.Codes | Create Your Free Account',
    description: 'Create a free Value.Codes account to join the developer community, save tool preferences, and access exclusive features.',
    keywords: 'register, sign up, create account, value.codes, developer account',
    canonical: `${siteUrl}/register`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/auth.css'],
    pageJS: ['/js/auth.js'],
    errors: [],
    oldInput: {}
  });
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
    const siteUrl = process.env.SITE_URL || 'https://value.codes';

    /* Collect validation errors */
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/register', {
        title: 'Register — Value.Codes | Create Your Free Account',
        description: 'Create a free Value.Codes account.',
        keywords: 'register, sign up, create account',
        canonical: `${siteUrl}/register`,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogImage: `${siteUrl}/images/og-image.svg`,
        schema: null,
        pageCSS: ['/css/auth.css'],
        pageJS: ['/js/auth.js'],
        errors: errors.array(),
        oldInput: { username: req.body.username, email: req.body.email }
      });
    }

    try {
      const { username, email, password } = req.body;

      /* Check if email already exists */
      const [existingEmail] = await db.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      if (existingEmail.length > 0) {
        return res.status(409).render('auth/register', {
          title: 'Register — Value.Codes | Create Your Free Account',
          description: 'Create a free Value.Codes account.',
          keywords: 'register, sign up, create account',
          canonical: `${siteUrl}/register`,
          robots: 'noindex, nofollow',
          ogType: 'website',
          ogImage: `${siteUrl}/images/og-image.svg`,
          schema: null,
          pageCSS: ['/css/auth.css'],
          pageJS: ['/js/auth.js'],
          errors: [{ msg: 'An account with this email already exists.' }],
          oldInput: { username, email }
        });
      }

      /* Check if username already exists */
      const [existingUsername] = await db.execute(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [username]
      );
      if (existingUsername.length > 0) {
        return res.status(409).render('auth/register', {
          title: 'Register — Value.Codes | Create Your Free Account',
          description: 'Create a free Value.Codes account.',
          keywords: 'register, sign up, create account',
          canonical: `${siteUrl}/register`,
          robots: 'noindex, nofollow',
          ogType: 'website',
          ogImage: `${siteUrl}/images/og-image.svg`,
          schema: null,
          pageCSS: ['/css/auth.css'],
          pageJS: ['/js/auth.js'],
          errors: [{ msg: 'This username is already taken.' }],
          oldInput: { username, email }
        });
      }

      /* Hash the password */
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      /* Insert new user */
      const [result] = await db.execute(
        'INSERT INTO users (username, email, password_hash, is_pro, created_at) VALUES (?, ?, ?, 0, NOW())',
        [username, email, passwordHash]
      );

      /* Automatically log the user in */
      req.session.regenerate((err) => {
        if (err) {
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
      return res.status(500).render('auth/register', {
        title: 'Register — Value.Codes | Create Your Free Account',
        description: 'Create a free Value.Codes account.',
        keywords: 'register, sign up, create account',
        canonical: `${siteUrl}/register`,
        robots: 'noindex, nofollow',
        ogType: 'website',
        ogImage: `${siteUrl}/images/og-image.svg`,
        schema: null,
        pageCSS: ['/css/auth.css'],
        pageJS: ['/js/auth.js'],
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
    /* Clear the session cookie regardless */
    res.clearCookie('vc_sid');
    return res.redirect('/');
  });
});

module.exports = router;
