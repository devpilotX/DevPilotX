'use strict';

/**
 * ============================================================
 * admin.js — Admin Panel Routes
 * ============================================================
 * Handles:
 *   GET  /admin/login              — Login page
 *   POST /admin/login              — Authenticate admin
 *   POST /admin/logout             — Destroy admin session
 *   GET  /admin                    — Redirect to /admin/articles
 *   GET  /admin/articles           — Article list dashboard
 *   GET  /admin/articles/new       — Create article form
 *   POST /admin/articles/new       — Save new article
 *   GET  /admin/articles/edit/:id  — Edit article form
 *   POST /admin/articles/edit/:id  — Update article
 *   POST /admin/articles/delete/:id— Delete article
 *   GET  /admin/categories         — Category management
 *   POST /admin/categories/new     — Create category
 *   POST /admin/categories/edit/:id— Update category
 *   POST /admin/categories/delete/:id — Delete category
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/adminAuth');

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

/** Sanitize HTML to prevent XSS in stored content */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
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

/* ========== LOGIN ========== */

router.get('/login', (req, res) => {
  if (req.session.isAdminLoggedIn) return res.redirect('/admin/articles');
  adminRender(res, 'admin/login', {
    title: 'Admin Login — Value.Codes',
    error: req.session.loginError || null,
    schema: null
  });
  delete req.session.loginError;
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminEmail || !adminPassword) {
    req.session.loginError = 'Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env';
    return res.redirect('/admin/login');
  }

  if (email === adminEmail && password === adminPassword) {
    req.session.isAdminLoggedIn = true;
    delete req.session.loginError;
    const redirectTo = req.session.adminRedirectTo || '/admin/articles';
    delete req.session.adminRedirectTo;
    return res.redirect(redirectTo);
  }

  req.session.loginError = 'Invalid email or password.';
  res.redirect('/admin/login');
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
      pageJS: ['/js/admin-editor.js'],
      flash: null,
      schema: null
    });
  } catch (err) {
    next(err);
  }
});

router.post('/articles/new', requireAdmin, async (req, res, next) => {
  try {
    let {
      title, summary, content, author, category_id,
      tags, status, thumbnail, meta_title, meta_description, published_at
    } = req.body;

    title = sanitizeInput(title);
    if (!title) {
      req.session.flash = { type: 'error', message: 'Title is required.' };
      return res.redirect('/admin/articles/new');
    }

    const slug = toSlug(title);
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
          tags, status, meta_title, meta_description, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        sanitizeInput(thumbnail) || null,
        sanitizeInput(summary) || null,
        content || '',
        sanitizeInput(author) || 'Dipanshu Kumar',
        category_id || null,
        sanitizeInput(tags) || null,
        status === 'published' ? 'published' : 'draft',
        sanitizeInput(meta_title) || null,
        sanitizeInput(meta_description) || null,
        publishedAt
      ]
    );

    req.session.flash = { type: 'success', message: `Article "${title}" created successfully.` };
    res.redirect('/admin/articles');
  } catch (err) {
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
      pageJS: ['/js/admin-editor.js'],
      flash: req.session.flash || null,
      schema: null
    });
    delete req.session.flash;
  } catch (err) {
    next(err);
  }
});

router.post('/articles/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    let {
      title, summary, content, author, category_id,
      tags, status, thumbnail, meta_title, meta_description, published_at
    } = req.body;

    title = sanitizeInput(title);
    if (!title) {
      req.session.flash = { type: 'error', message: 'Title is required.' };
      return res.redirect(`/admin/articles/edit/${id}`);
    }

    const [[existing]] = await db.query('SELECT slug, status FROM articles WHERE id = ?', [id]);
    if (!existing) return next();

    /* Determine published_at value */
    let publishedAtQuery = '';
    let publishedAtValue = null;

    if (published_at) {
      /* Admin explicitly set a date — always honour it */
      const parsed = new Date(published_at);
      if (!isNaN(parsed.getTime())) {
        publishedAtValue = parsed;
        publishedAtQuery = ', published_at = ?';
      }
    } else if (status === 'published' && existing.status === 'draft') {
      /* First publish with no custom date — use NOW() */
      publishedAtQuery = ', published_at = NOW()';
    }

    const queryParams = [
      title,
      sanitizeInput(thumbnail) || null,
      sanitizeInput(summary) || null,
      content || '',
      sanitizeInput(author) || 'Dipanshu Kumar',
      category_id || null,
      sanitizeInput(tags) || null,
      status === 'published' ? 'published' : 'draft',
      sanitizeInput(meta_title) || null,
      sanitizeInput(meta_description) || null,
    ];
    if (publishedAtValue) queryParams.push(publishedAtValue);
    queryParams.push(id);

    await db.query(
      `UPDATE articles SET
         title = ?, thumbnail = ?, summary = ?, content = ?, author = ?,
         category_id = ?, tags = ?, status = ?, meta_title = ?, meta_description = ?
         ${publishedAtQuery}
       WHERE id = ?`,
      queryParams
    );

    req.session.flash = { type: 'success', message: `Article "${title}" updated successfully.` };
    res.redirect('/admin/articles');
  } catch (err) {
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
    req.session.flash = { type: 'success', message: `Category updated.` };
    res.redirect('/admin/categories');
  } catch (err) {
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
    next(err);
  }
});

/* ========== SNIPPETS ADMIN ========== */
router.use('/snippets', require('./admin/snippets'));

/* ========== APIS ADMIN ========== */
router.use('/apis', require('./admin/apis'));

module.exports = router;
