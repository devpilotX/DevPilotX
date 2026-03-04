/**
 * ============================================================
 * Value.Codes — Global Template Locals Middleware
 * ============================================================
 * Injects variables into every EJS template render context.
 * These variables are available in all views and partials
 * without needing to pass them explicitly from each route.
 * ============================================================
 */

'use strict';

/* ========== SET LOCALS ========== */
/**
 * Attaches global data to res.locals so every template can access:
 * - isLoggedIn: boolean — whether user has an active session
 * - currentUser: object|null — user data (username, email, isPro, avatar)
 * - currentPath: string — the current URL path (for active nav highlighting)
 * - siteName: string — site display name
 * - siteUrl: string — full site URL (for canonical links, OG tags)
 * - adsensePubId: string — Google AdSense publisher ID
 * - currentYear: number — for copyright notices in footer
 */
function setLocals(req, res, next) {
  /* Authentication state */
  res.locals.isLoggedIn = !!(req.session && req.session.userId);

  /* User data (populated during login, stored in session) */
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
  res.locals.adsensePubId = process.env.ADSENSE_PUB_ID || 'ca-pub-6484525483464374';

  /* Google Search Console site verification token */
  res.locals.googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION || '';

  /* Current year for footer copyright */
  res.locals.currentYear = new Date().getFullYear();

  /* Flash messages (success/error feedback after form submissions) */
  res.locals.flashSuccess = req.session ? req.session.flashSuccess || null : null;
  res.locals.flashError = req.session ? req.session.flashError || null : null;

  /* Clear flash messages after reading them */
  if (req.session) {
    delete req.session.flashSuccess;
    delete req.session.flashError;
  }

  next();
}

module.exports = { setLocals };
