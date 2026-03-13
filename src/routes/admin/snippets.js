/**
 * ================================================================
 * FILE: src/routes/admin/snippets.js
 * PURPOSE: Admin CRUD routes for managing snippets
 * URLS:
 *   GET  /admin/snippets              → List all snippets
 *   GET  /admin/snippets/create       → Create form
 *   POST /admin/snippets/create       → Handle create
 *   GET  /admin/snippets/edit/:id     → Edit form
 *   POST /admin/snippets/edit/:id     → Handle update
 *   POST /admin/snippets/delete/:id   → Handle delete
 * ================================================================
 */

'use strict';

var express = require('express');
var router = express.Router();
var Snippet = require('../../models/snippet');
var { requireAdmin } = require('../../middleware/adminAuth');

/** Admin render helper for snippets | uses the admin layout */
function adminRender(res, view, data) {
  res.render(view, Object.assign({
    layout: 'layouts/admin',
    pageCSS: ['/css/admin.css', '/css/admin/snippets.css'],
    pageJS: ['/js/admin/snippets.js'],
    schema: null,
    breadcrumbs: []
  }, data));
}

/* ========== LIST ALL SNIPPETS ========== */
router.get('/', requireAdmin, async function (req, res, next) {
  try {
    var snippets = await Snippet.adminGetAll();

    adminRender(res, 'admin/snippets/index', {
      title: 'Manage Snippets | Admin',
      snippets: snippets,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    next(err);
  }
});

/* ========== CREATE FORM ========== */
router.get('/create', requireAdmin, async function (req, res, next) {
  try {
    var categories = await Snippet.adminGetAllCategories();
    var tags = await Snippet.adminGetAllTags();

    adminRender(res, 'admin/snippets/create', {
      title: 'Create Snippet | Admin',
      categories: categories,
      tags: tags,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

/* ========== HANDLE CREATE ========== */
router.post('/create', requireAdmin, async function (req, res, next) {
  try {
    var body = req.body;

    /* Parse tabs from form data */
    var tabs = parseFormTabs(body);

    /* Parse notes (textarea, one per line) */
    var notes = [];
    if (body.notes) {
      notes = body.notes.split('\n').map(function (n) { return n.trim(); }).filter(Boolean);
    }

    /* Parse related slugs (comma-separated) */
    var relatedSlugs = [];
    if (body.related_slugs) {
      relatedSlugs = body.related_slugs.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    /* Parse tag IDs */
    var tagIds = [];
    if (body.tag_ids) {
      tagIds = Array.isArray(body.tag_ids) ? body.tag_ids : [body.tag_ids];
      tagIds = tagIds.map(Number);
    }

    await Snippet.create({
      category_id: parseInt(body.category_id, 10),
      slug: body.slug,
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      browser_support: body.browser_support,
      notes: notes,
      related_slugs: relatedSlugs,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      seo_keywords: body.seo_keywords,
      status: body.status,
      sort_order: parseInt(body.sort_order, 10) || 0,
      tabs: tabs,
      tag_ids: tagIds
    });

    res.redirect('/admin/snippets?success=Snippet created successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      try {
        var categories = await Snippet.adminGetAllCategories();
        var tags = await Snippet.adminGetAllTags();
        return adminRender(res, 'admin/snippets/create', {
          title: 'Create Snippet | Admin',
          categories: categories,
          tags: tags,
          error: 'A snippet with that slug already exists.'
        });
      } catch (innerErr) {
        return next(innerErr);
      }
    }
    next(err);
  }
});

/* ========== EDIT FORM ========== */
router.get('/edit/:id', requireAdmin, async function (req, res, next) {
  try {
    var snippet = await Snippet.adminGetById(parseInt(req.params.id, 10));
    if (!snippet) return next();

    var categories = await Snippet.adminGetAllCategories();
    var tags = await Snippet.adminGetAllTags();

    adminRender(res, 'admin/snippets/edit', {
      title: 'Edit: ' + snippet.title + ' | Admin',
      snippet: snippet,
      categories: categories,
      tags: tags,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

/* ========== HANDLE UPDATE ========== */
router.post('/edit/:id', requireAdmin, async function (req, res, next) {
  try {
    var id = parseInt(req.params.id, 10);
    var body = req.body;

    var tabs = parseFormTabs(body);

    var notes = [];
    if (body.notes) {
      notes = body.notes.split('\n').map(function (n) { return n.trim(); }).filter(Boolean);
    }

    var relatedSlugs = [];
    if (body.related_slugs) {
      relatedSlugs = body.related_slugs.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    var tagIds = [];
    if (body.tag_ids) {
      tagIds = Array.isArray(body.tag_ids) ? body.tag_ids : [body.tag_ids];
      tagIds = tagIds.map(Number);
    }

    await Snippet.update(id, {
      category_id: parseInt(body.category_id, 10),
      slug: body.slug,
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      browser_support: body.browser_support,
      notes: notes,
      related_slugs: relatedSlugs,
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      seo_keywords: body.seo_keywords,
      status: body.status,
      sort_order: parseInt(body.sort_order, 10) || 0,
      tabs: tabs,
      tag_ids: tagIds
    });

    res.redirect('/admin/snippets?success=Snippet updated successfully');
  } catch (err) {
    next(err);
  }
});

/* ========== HANDLE DELETE ========== */
router.post('/delete/:id', requireAdmin, async function (req, res, next) {
  try {
    await Snippet.delete(parseInt(req.params.id, 10));
    res.redirect('/admin/snippets?success=Snippet deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

/**
 * Parse tab data from flat form fields.
 * Form sends: tab_label_0, tab_language_0, tab_file_name_0, tab_code_0, etc.
 */
function parseFormTabs(body) {
  var tabs = [];
  var i = 0;
  while (body['tab_label_' + i] !== undefined) {
    if (body['tab_code_' + i] && body['tab_code_' + i].trim()) {
      tabs.push({
        label: body['tab_label_' + i],
        language: body['tab_language_' + i],
        file_name: body['tab_file_name_' + i] || null,
        code: body['tab_code_' + i],
        sort_order: i
      });
    }
    i++;
  }
  return tabs;
}

/* Also attach to Snippet model for backward compatibility */
Snippet.parseFormTabs = parseFormTabs;
