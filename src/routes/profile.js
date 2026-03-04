/**
 * ============================================================
 * Value.Codes — Profile & Settings Routes
 * ============================================================
 * GET  /profile           — User profile page (protected)
 * GET  /settings          — Account settings page (protected)
 * POST /settings          — Update profile info
 * POST /settings/password — Change password
 * POST /settings/delete   — Delete account
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { isLoggedIn } = require('../middleware/auth');
const db = require('../config/database');

const SALT_ROUNDS = 12;

/* ========== HELPER: render settings with errors ========== */
async function renderSettings(req, res, { activeSection = 'profile', errors = [], fieldErrors = {} } = {}) {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  const [rows] = await db.execute(
    'SELECT id, username, email, is_pro, avatar, bio, website, location FROM users WHERE id = ? LIMIT 1',
    [req.session.userId]
  );
  const user = rows[0] || null;
  if (!user) {
    req.session.destroy(() => { res.clearCookie('vc_sid'); return res.redirect('/login'); });
    return;
  }
  return res.render('profile/settings', {
    title: 'Account Settings — Value.Codes',
    description: 'Manage your Value.Codes account settings, update your profile, and change your password.',
    keywords: 'account settings, profile settings, value.codes',
    canonical: `${siteUrl}/settings`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/settings.css'],
    pageJS: ['/js/settings.js'],
    profileUser: user,
    activeSection,
    errors,
    fieldErrors
  });
}

/* ========== GET /profile ========== */
router.get('/profile', isLoggedIn, async (req, res, next) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  try {
    const [rows] = await db.execute(
      'SELECT id, username, email, is_pro, avatar, bio, website, location, created_at FROM users WHERE id = ? LIMIT 1',
      [req.session.userId]
    );
    const user = rows[0] || null;
    if (!user) {
      req.session.destroy(() => { res.clearCookie('vc_sid'); return res.redirect('/login'); });
      return;
    }
    res.render('profile/index', {
      title: `${user.username}'s Profile — Value.Codes`,
      description: `View ${user.username}'s profile on Value.Codes developer community.`,
      keywords: 'user profile, developer profile, value.codes',
      canonical: `${siteUrl}/profile`,
      robots: 'noindex, nofollow',
      ogType: 'profile',
      ogImage: `${siteUrl}/images/og-image.svg`,
      schema: null,
      pageCSS: ['/css/profile.css'],
      pageJS: ['/js/profile.js'],
      profileUser: user
    });
  } catch (err) { next(err); }
});

/* ========== GET /settings ========== */
router.get('/settings', isLoggedIn, async (req, res, next) => {
  try {
    await renderSettings(req, res);
  } catch (err) { next(err); }
});

/* ========== POST /settings — Update profile info ========== */
router.post('/settings', isLoggedIn,
  [
    body('username').trim()
      .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters.')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, hyphens, and underscores.'),
    body('bio').trim()
      .isLength({ max: 300 }).withMessage('Bio must be 300 characters or fewer.'),
    body('location').trim()
      .isLength({ max: 100 }).withMessage('Location must be 100 characters or fewer.'),
    body('website').trim()
      .custom((val) => {
        if (!val) return true;
        try { new URL(val); return true; } catch { throw new Error('Website must be a valid URL (e.g. https://example.com).'); }
      }),
    body('avatar').trim()
      .custom((val) => {
        if (!val) return true;
        try { new URL(val); return true; } catch { throw new Error('Avatar must be a valid image URL.'); }
      })
  ],
  async (req, res, next) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return renderSettings(req, res, { activeSection: 'profile', errors: result.array() });
      }

      const { username, bio, website, location, avatar } = req.body;

      /* Check username uniqueness (exclude self) */
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
        [username, req.session.userId]
      );
      if (existing.length > 0) {
        return renderSettings(req, res, {
          activeSection: 'profile',
          errors: [{ msg: 'That username is already taken.' }]
        });
      }

      await db.execute(
        'UPDATE users SET username = ?, bio = ?, website = ?, location = ?, avatar = ? WHERE id = ?',
        [username, bio || null, website || null, location || null, avatar || null, req.session.userId]
      );

      /* Sync session */
      req.session.username = username;
      req.session.avatar = avatar || null;

      req.session.flashSuccess = 'Profile updated successfully.';
      return res.redirect('/settings');
    } catch (err) { next(err); }
  }
);

/* ========== POST /settings/password — Change password ========== */
router.post('/settings/password', isLoggedIn,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
    body('confirmPassword').custom((val, { req: r }) => {
      if (val !== r.body.newPassword) throw new Error('Passwords do not match.');
      return true;
    })
  ],
  async (req, res, next) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return renderSettings(req, res, { activeSection: 'password', errors: result.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const [rows] = await db.execute(
        'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
        [req.session.userId]
      );
      if (!rows.length) return res.redirect('/login');

      const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!isMatch) {
        return renderSettings(req, res, {
          activeSection: 'password',
          errors: [{ msg: 'Current password is incorrect.' }]
        });
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.userId]);

      req.session.flashSuccess = 'Password changed successfully.';
      return res.redirect('/settings');
    } catch (err) { next(err); }
  }
);

/* ========== POST /settings/delete — Delete account ========== */
router.post('/settings/delete', isLoggedIn,
  [
    body('deletePassword').notEmpty().withMessage('Please enter your password to confirm deletion.')
  ],
  async (req, res, next) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return renderSettings(req, res, { activeSection: 'danger', errors: result.array() });
      }

      const [rows] = await db.execute(
        'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
        [req.session.userId]
      );
      if (!rows.length) return res.redirect('/login');

      const isMatch = await bcrypt.compare(req.body.deletePassword, rows[0].password_hash);
      if (!isMatch) {
        return renderSettings(req, res, {
          activeSection: 'danger',
          errors: [{ msg: 'Incorrect password. Account not deleted.' }]
        });
      }

      /* Delete user — cascades to sessions/messages via FK */
      await db.execute('DELETE FROM users WHERE id = ?', [req.session.userId]);

      req.session.destroy(() => {
        res.clearCookie('vc_sid');
        return res.redirect('/?deleted=1');
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
