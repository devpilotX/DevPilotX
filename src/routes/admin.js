'use strict';

/**
 * ============================================================
 * admin.js — Admin Panel Routes (SECURED)
 * ============================================================
 * Changes from original:
 * - Admin login uses bcrypt hash comparison (ADMIN_PASSWORD_HASH)
 * - sanitizeInput() now uses DOMPurify for real XSS protection
 * - Article content sanitized with DOMPurify before DB insert
 * - All catch blocks log errors with context
 * - CSRF tokens required on all POST forms (handled by server.js)
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { requireAdmin } = require('../middleware/adminAuth');
const pino = require('pino');
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

/* ========== DOM PURIFY SETUP ========== */
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const DOMPurify = createDOMPurify(new JSDOM('').window);

/** Allowed HTML tags for blog article content */
const CONTENT_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1','h2','h3','h4','h5','h6','p','a','ul','ol','li','strong','em','b','i',
    'code','pre','blockquote','img','br','hr','table','thead','tbody','tr','th','td',
    'span','div','figure','figcaption','section','article','aside','details','summary',
    'mark','del','ins','sub','sup','small','abbr','iframe'
  ],
  ALLOWED_ATTR: [
    'href','src','alt','class','id','target','rel','title','width','height',
    'loading','decoding','style','data-language','data-line'
  ],
  ALLOW_DATA_ATTR: true
};

/* ========== HELPERS ========== */

/** Convert a title string to a URL slug */
function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sanitize plain-text input fields (titles, tags, meta, etc.).
 * Strips ALL HTML — only use for non-rich-text fields.
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return DOMPurify.sanitize(str.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitize rich HTML content (article body).
 * Allows safe HTML tags for blog formatting.
 */
function sanitizeContent(html) {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, CONTENT_PURIFY_CONFIG);
}

/** Admin render helper — uses the admin layout */
function adminRender(res, view, data = {}) {
  res.render(view, {
    layout: 'layouts/admin',
    pageCSS: ['/css/admin.css'],
    pageJS: [],
    ...data
  });
}

/* ========== LOGIN (BCRYPT) ========== */

router.get('/login', (req, res) => {
  if (req.session.isAdminLoggedIn) return res.redirect('/admin/articles');
  adminRender(res, 'admin/login', {
    title: 'Admin Login — Value.Codes',
    error: req.session.loginError || null,
    schema: null
  });
  delete req.session.loginError;
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || '';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
const adminPasswordPlain = process.env.ADMIN_PASSWORD || '';

    if (!adminEmail || !adminPasswordHash) {
      req.session.loginError = 'Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env';
      return res.redirect('/admin/login');
    }

    const isAdmin = adminPasswordHash
  ? await bcrypt.compare(password, adminPasswordHash)
  : (password === adminPasswordPlain);

if (email === adminEmail && isAdmin) {
      req.session.isAdminLoggedIn = true;
      delete req.session.loginError;
      const redirectTo = req.session.adminRedirectTo || '/admin/articles';
      delete req.session.adminRedirectTo;
      return res.redirect(redirectTo);
    }

    req.session.loginError = 'Invalid email or password.';
    res.redirect('/admin/login');
  } catch (err) {
    logger.error({ err }, '[Admin] Login error');
    req.session.loginError = 'An error occurred. Please try again.';
    res.redirect('/admin/login');
  }
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.isAdminLoggedIn = false;
  res.redirect('/admin/login');
});

/* ========== ADMIN ROOT ========== */

router.get('/', requireAdmin, (req, res) => {
  res.redirect('/admin/articles');
});

/* ========== ARTICLES LIST ========== */

router.get('/articles', requireAdmin, async (req, res, next) => {
  try {
    const search = sanitizeInput(req.query.search || '');
    const statusFilter = req.query.status || 'all';

    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND a.title LIKE ?';
      params.push(`%${search}%`);
    }
    if (statusFilter !== 'all') {
      where += ' AND a.status = ?';
      params.push(statusFilter);
    }

    const [articles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.status, a.views, a.published_at, a.created_at,
              c.name AS category_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE ${where}
       ORDER BY a.created_at DESC`,
      params
    );

    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM articles');
    const [[{ published }]] = await db.query("SELECT COUNT(*) AS published FROM articles WHERE status = 'published'");
    const [[{ draft }]] = await db.query("SELECT COUNT(*) AS draft FROM articles WHERE status = 'draft'");

    adminRender(res, 'admin/dashboard', {
      title: 'Articles — Admin Panel — Value.Codes',
      articles,
      search,
      statusFilter,
      stats: { total, published, draft },
      flash: req.session.flash || null,
      schema: null
    });
    delete req.session.flash;
  } catch (err) {
    logger.error({ err }, '[Admin] Failed to load articles');
    next(err);
  }
});

/* ========== NEW ARTICLE FORM ========== */

router.get('/articles/new', requireAdmin, async (req, res, next) => {
  try {
    const [categories] = await db.query('SELECT id, name FROM categories ORDER BY name');
    adminRender(res, 'admin/article-form', {
      title: 'New Article — Admin — Value.Codes',
      article: null,
      categories,
      pageJS: [],
      flash: null,
      schema: null
    });
  } catch (err) {
    logger.error({ err }, '[Admin] Failed to load new article form');
    next(err);
  }
});

router.post('/articles/new', requireAdmin, async (req, res, next) => {
  try {
    let {
      title, summary, content, author, category_id,
      tags, status, thumbnail, meta_title, meta_description, focus_keyword, published_at
    } = req.body;

    title = sanitizeInput(title);
    if (!title) {
      req.session.flash = { type: 'error', message: 'Title is required.' };
      return res.redirect('/admin/articles/new');
    }

    const slug = toSlug(title);
    const cleanContent = sanitizeContent(content);

    let publishedAt = null;
    if (status === 'published') {
      if (published_at) {
        const parsed = new Date(published_at);
        publishedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
      } else {
        publishedAt = new Date();
      }
    }

    await db.query(
      `INSERT INTO articles
         (title, slug, thumbnail, summary, content, author, category_id,
          tags, status, meta_title, meta_description, focus_keyword, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        sanitizeInput(thumbnail) || null,
        sanitizeInput(summary) || null,
        cleanContent,
        sanitizeInput(author) || 'Dipanshu Kumar',
        category_id || null,
        sanitizeInput(tags) || null,
        status === 'published' ? 'published' : 'draft',
        sanitizeInput(meta_title) || null,
        sanitizeInput(meta_description) || null,
        sanitizeInput(focus_keyword) || null,
        publishedAt
      ]
    );

    req.session.flash = { type: 'success', message: `Article "${title}" created successfully.` };
    res.redirect('/admin/articles');
  } catch (err) {
    logger.error({ err }, '[Admin] Failed to create article');
    if (err.code === 'ER_DUP_ENTRY') {
      req.session.flash = { type: 'error', message: 'A slug with that title already exists. Please use a slightly different title.' };
      return res.redirect('/admin/articles/new');
    }
    next(err);
  }
});

/* ========== EDIT ARTICLE ========== */

router.get('/articles/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const [[article]] = await db.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return next();

    const [categories] = await db.query('SELECT id, name FROM categories ORDER BY name');
    adminRender(res, 'admin/article-form', {
      title: `Edit: ${article.title} — Admin — Value.Codes`,
      article,
      categories,
      pageJS: [],
      flash: req.session.flash || null,
      schema: null
    });
    delete req.session.flash;
  } catch (err) {
    logger.error({ err, articleId: req.params.id }, '[Admin] Failed to load article for edit');
    next(err);
  }
});

router.post('/articles/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    let {
      title, summary, content, author, category_id,
      tags, status, thumbnail, meta_title, meta_description, focus_keyword, published_at
    } = req.body;

    title = sanitizeInput(title);
    if (!title) {
      req.session.flash = { type: 'error', message: 'Title is required.' };
      return res.redirect(`/admin/articles/edit/${id}`);
    }

    const cleanContent = sanitizeContent(content);

    const [[existing]] = await db.query('SELECT slug, status FROM articles WHERE id = ?', [id]);
    if (!existing) return next();

    let publishedAtQuery = '';
    let publishedAtValue = null;

    if (published_at) {
      const parsed = new Date(published_at);
      if (!isNaN(parsed.getTime())) {
        publishedAtValue = parsed;
        publishedAtQuery = ', published_at = ?';
      }
    } else if (status === 'published' && existing.status === 'draft') {
      publishedAtQuery = ', published_at = NOW()';
    }

    const queryParams = [
      title,
      sanitizeInput(thumbnail) || null,
      sanitizeInput(summary) || null,
      cleanContent,
      sanitizeInput(author) || 'Dipanshu Kumar',
      category_id || null,
      sanitizeInput(tags) || null,
      status === 'published' ? 'published' : 'draft',
      sanitizeInput(meta_title) || null,
      sanitizeInput(meta_description) || null,
      sanitizeInput(focus_keyword) || null,
    ];
    if (publishedAtValue) queryParams.push(publishedAtValue);
    queryParams.push(id);

    await db.query(
      `UPDATE articles SET
         title = ?, thumbnail = ?, summary = ?, content = ?, author = ?,
         category_id = ?, tags = ?, status = ?, meta_title = ?, meta_description = ?,
         focus_keyword = ?
         ${publishedAtQuery}
       WHERE id = ?`,
      queryParams
    );

    req.session.flash = { type: 'success', message: `Article "${title}" updated successfully.` };
    res.redirect('/admin/articles');
  } catch (err) {
    logger.error({ err, articleId: req.params.id }, '[Admin] Failed to update article');
    next(err);
  }
});

/* ========== DELETE ARTICLE ========== */

router.post('/articles/delete/:id', requireAdmin, async (req, res, next) => {
  try {
    const [[article]] = await db.query('SELECT title FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return next();

    await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    req.session.flash = { type: 'success', message: `Article "${article.title}" deleted.` };
    res.redirect('/admin/articles');
  } catch (err) {
    logger.error({ err, articleId: req.params.id }, '[Admin] Failed to delete article');
    next(err);
  }
});

/* ========== CATEGORIES ========== */

router.get('/categories', requireAdmin, async (req, res, next) => {
  try {
    const [categories] = await db.query(
      `SELECT c.*, COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );

    adminRender(res, 'admin/categories', {
      title: 'Categories — Admin Panel — Value.Codes',
      categories,
      flash: req.session.flash || null,
      schema: null
    });
    delete req.session.flash;
  } catch (err) {
    logger.error({ err }, '[Admin] Failed to load categories');
    next(err);
  }
});

router.post('/categories/new', requireAdmin, async (req, res, next) => {
  try {
    const name = sanitizeInput(req.body.name);
    const description = sanitizeInput(req.body.description || '');
    if (!name) {
      req.session.flash = { type: 'error', message: 'Category name is required.' };
      return res.redirect('/admin/categories');
    }
    const slug = toSlug(name);
    await db.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    req.session.flash = { type: 'success', message: `Category "${name}" created.` };
    res.redirect('/admin/categories');
  } catch (err) {
    logger.error({ err }, '[Admin] Failed to create category');
    if (err.code === 'ER_DUP_ENTRY') {
      req.session.flash = { type: 'error', message: 'A category with that name already exists.' };
      return res.redirect('/admin/categories');
    }
    next(err);
  }
});

router.post('/categories/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const name = sanitizeInput(req.body.name);
    const description = sanitizeInput(req.body.description || '');
    if (!name) {
      req.session.flash = { type: 'error', message: 'Category name is required.' };
      return res.redirect('/admin/categories');
    }
    await db.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, req.params.id]
    );
    req.session.flash = { type: 'success', message: 'Category updated.' };
    res.redirect('/admin/categories');
  } catch (err) {
    logger.error({ err, categoryId: req.params.id }, '[Admin] Failed to update category');
    next(err);
  }
});

router.post('/categories/delete/:id', requireAdmin, async (req, res, next) => {
  try {
    const [[cat]] = await db.query('SELECT name FROM categories WHERE id = ?', [req.params.id]);
    if (!cat) return res.redirect('/admin/categories');
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    req.session.flash = { type: 'success', message: `Category "${cat.name}" deleted. Articles in this category are now uncategorised.` };
    res.redirect('/admin/categories');
  } catch (err) {
    logger.error({ err, categoryId: req.params.id }, '[Admin] Failed to delete category');
    next(err);
  }
});

/* ========== SNIPPETS ADMIN ========== */
router.use('/snippets', require('./admin/snippets'));

/* ========== APIS ADMIN ========== */
router.use('/apis', require('./admin/apis'));

module.exports = router;