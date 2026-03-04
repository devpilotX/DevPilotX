'use strict';

/**
 * adminAuth.js — Admin Authentication Middleware
 * Protects all /admin/* routes.
 * Credentials are read from environment variables:
 *   ADMIN_EMAIL    — admin login email
 *   ADMIN_PASSWORD — admin login password (plain text, store hashed in prod)
 */

/**
 * requireAdmin — blocks non-admin requests, redirects to /admin/login
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdminLoggedIn === true) {
    return next();
  }
  req.session.adminRedirectTo = req.originalUrl;
  res.redirect('/admin/login');
}

module.exports = { requireAdmin };
