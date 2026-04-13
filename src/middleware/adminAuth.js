'use strict';

const pino = require('pino');
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

/**
 * adminAuth.js — Admin Authentication Middleware
 * Protects all /admin/* routes.
 * Admin credentials are verified via bcrypt in admin.js login route.
 * This middleware only checks the session flag.
 */

/**
 * requireAdmin — blocks non-admin requests, redirects to /admin/login
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdminLoggedIn === true) {
    return next();
  }
  logger.info({ url: req.originalUrl, ip: req.ip }, '[Admin] Unauthorized access attempt');
  req.session.adminRedirectTo = req.originalUrl;
  res.redirect('/admin/login');
}

module.exports = { requireAdmin };