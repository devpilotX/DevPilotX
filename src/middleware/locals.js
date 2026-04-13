/**
 * ============================================================
 * Value.Codes — Global Template Locals Middleware (UPDATED)
 * ============================================================
 * Changes from original:
 * - Documents cspNonce and cacheBuster (set in server.js)
 * - csrfToken is set in server.js CSRF middleware
 * ============================================================
 */

'use strict';

/* ========== SET LOCALS ========== */
function setLocals(req, res, next) {
  /* Authentication state */
  res.locals.isLoggedIn = !!(req.session && req.session.userId);

  /* User data */
  res.locals.currentUser = req.session && req.session.userId
    ? {
      id: req.session.userId,
      username: req.session.username || '',
      email: req.session.email || '',
      isPro: req.session.isPro || false,
      avatar: req.session.avatar || null
    }
    : null;

  /* Current path for active nav link highlighting */
  res.locals.currentPath = req.path;

  /* Site-wide constants */
  res.locals.siteName = process.env.SITE_NAME || 'Value.Codes';
  res.locals.siteUrl = process.env.SITE_URL || 'https://value.codes';
  res.locals.adsensePubId = process.env.ADSENSE_PUB_ID || '';

  /* Google Analytics Measurement ID */
  res.locals.gaMeasurementId = process.env.GA_MEASUREMENT_ID || '';

  /* Google Search Console site verification token */
  res.locals.googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION || '';

  /* Current year for footer copyright */
  res.locals.currentYear = new Date().getFullYear();

  /* Flash messages */
  res.locals.flashSuccess = req.session ? req.session.flashSuccess || null : null;
  res.locals.flashError = req.session ? req.session.flashError || null : null;

  /* Clear flash messages after reading them */
  if (req.session) {
    delete req.session.flashSuccess;
    delete req.session.flashError;
  }

  /*
   * The following are set in server.js middleware and available in all templates:
   * - res.locals.cspNonce    — CSP nonce for inline scripts
   * - res.locals.csrfToken   — CSRF token for forms
   * - res.locals.cacheBuster — Cache bust string for static assets
   */

  next();
}

module.exports = { setLocals };