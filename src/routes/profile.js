/**
 * ============================================================
 * Value.Codes — Profile & Settings Routes
 * ============================================================
 * GET /profile  — User profile page (protected)
 * GET /settings — Account settings page (protected)
 * Both routes require authentication via isLoggedIn middleware.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');
const db = require('../config/database');

/* ========== GET /profile ========== */
router.get('/profile', isLoggedIn, async (req, res, next) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  try {
    /* Fetch fresh user data from database */
    const [rows] = await db.execute(
      'SELECT id, username, email, is_pro, avatar, bio, website, location, created_at FROM users WHERE id = ? LIMIT 1',
      [req.session.userId]
    );

    const user = rows.length > 0 ? rows[0] : null;

    if (!user) {
      /* Session references a deleted user — force logout */
      req.session.destroy(() => {
        res.clearCookie('vc_sid');
        return res.redirect('/login');
      });
      return;
    }

    res.render('profile/index', {
      title: `${user.username}'s Profile — Value.Codes`,
      description: `View ${user.username}'s profile on Value.Codes developer community.`,
      keywords: 'user profile, developer profile, value.codes',
      canonical: `${siteUrl}/profile`,
      robots: 'noindex, nofollow',
      ogType: 'profile',
      ogImage: `${siteUrl}/images/og-image.jpg`,
      schema: null,
      pageCSS: ['/css/profile.css'],
      pageJS: ['/js/profile.js'],
      profileUser: user
    });
  } catch (err) {
    next(err);
  }
});

/* ========== GET /settings ========== */
router.get('/settings', isLoggedIn, async (req, res, next) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  try {
    /* Fetch fresh user data from database */
    const [rows] = await db.execute(
      'SELECT id, username, email, is_pro, avatar, bio, website, location FROM users WHERE id = ? LIMIT 1',
      [req.session.userId]
    );

    const user = rows.length > 0 ? rows[0] : null;

    if (!user) {
      req.session.destroy(() => {
        res.clearCookie('vc_sid');
        return res.redirect('/login');
      });
      return;
    }

    res.render('profile/settings', {
      title: 'Account Settings — Value.Codes',
      description: 'Manage your Value.Codes account settings, update your profile, and change your password.',
      keywords: 'account settings, profile settings, value.codes',
      canonical: `${siteUrl}/settings`,
      robots: 'noindex, nofollow',
      ogType: 'website',
      ogImage: `${siteUrl}/images/og-image.jpg`,
      schema: null,
      pageCSS: ['/css/settings.css'],
      pageJS: ['/js/settings.js'],
      profileUser: user
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
