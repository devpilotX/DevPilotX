/**
 * ============================================================
 * Value.Codes — Authentication Middleware
 * ============================================================
 * Provides route-level guards to protect pages and features
 * that require authentication or a Pro subscription.
 * ============================================================
 */

'use strict';

/* ========== IS LOGGED IN GUARD ========== */
/**
 * Redirects unauthenticated users to the login page.
 * Stores the originally requested URL so we can redirect
 * back after successful login.
 */
function isLoggedIn(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  /* Remember where they were trying to go */
  req.session.returnTo = req.originalUrl;

  return res.redirect('/login');
}

/* ========== IS PRO GUARD ========== */
/**
 * Requires both authentication AND an active Pro subscription.
 * If not logged in, redirects to login.
 * If logged in but not Pro, redirects to pricing page.
 */
function isPro(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  if (!req.session.isPro) {
    return res.redirect('/pricing');
  }

  return next();
}

module.exports = { isLoggedIn, isPro };
