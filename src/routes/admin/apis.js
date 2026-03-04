/**
 * ================================================================
 * FILE: src/routes/admin/apis.js
 * PURPOSE: Admin CRUD for API Directory
 * URLS:
 *   GET  /admin/apis              → List all APIs
 *   GET  /admin/apis/create       → Create form
 *   POST /admin/apis/create       → Handle create
 *   GET  /admin/apis/edit/:id     → Edit form
 *   POST /admin/apis/edit/:id     → Handle update
 *   POST /admin/apis/delete/:id   → Handle delete
 * ================================================================
 */

'use strict';

var express = require('express');
var router = express.Router();
var Api = require('../../models/Api');
var { requireAdmin } = require('../../middleware/adminAuth');

/** Admin render helper — uses admin layout, dedupes admin.css */
function adminRender(res, view, data) {
  res.render(view, Object.assign({
    layout: 'layouts/admin',
    pageCSS: ['/css/admin.css', '/css/admin/apis.css'],
    pageJS: ['/js/admin/apis.js'],
    schema: null,
    breadcrumbs: [],
    description: '',
    keywords: '',
    canonical: '',
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: ''
  }, data));
}

/** Parse newline-separated textarea fields into arrays */
function parseLines(str) {
  if (!str) return [];
  return str.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
}

/** Parse tag IDs from form body */
function parseTagIds(body) {
  if (!body.tag_ids) return [];
  var ids = Array.isArray(body.tag_ids) ? body.tag_ids : [body.tag_ids];
  return ids.map(Number);
}

/* ========== LIST ========== */
router.get('/', requireAdmin, async function (req, res, next) {
  try {
    var apis = await Api.adminGetAll();
    adminRender(res, 'admin/apis/index', {
      title: 'Manage APIs — Admin',
      apis: apis,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) { next(err); }
});

/* ========== CREATE FORM ========== */
router.get('/create', requireAdmin, async function (req, res, next) {
  try {
    var categories = await Api.adminGetAllCategories();
    var tags = await Api.adminGetAllTags();
    adminRender(res, 'admin/apis/create', {
      title: 'Add API — Admin',
      categories: categories,
      tags: tags,
      error: null
    });
  } catch (err) { next(err); }
});

/* ========== HANDLE CREATE ========== */
router.post('/create', requireAdmin, async function (req, res, next) {
  try {
    var body = req.body;

    await Api.create({
      category_id: parseInt(body.category_id, 10),
      slug: body.slug,
      name: body.name,
      description: body.description,
      website_url: body.website_url,
      docs_url: body.docs_url || null,
      base_url: body.base_url || null,
      logo_url: body.logo_url || null,
      auth_type: body.auth_type,
      cors_support: body.cors_support,
      https_support: body.https_support === 'on' || body.https_support === '1' ? 1 : 0,
      rate_limit: body.rate_limit || null,
      pricing: body.pricing,
      endpoints: Api.parseFormEndpoints(body),
      sample_response: body.sample_response || null,
      sample_response_language: body.sample_response_language || 'json',
      features: parseLines(body.features),
      use_cases: parseLines(body.use_cases),
      notes: parseLines(body.notes),
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      seo_keywords: body.seo_keywords || null,
      status: body.status,
      is_featured: body.is_featured === 'on' || body.is_featured === '1' ? 1 : 0,
      sort_order: parseInt(body.sort_order, 10) || 0,
      tag_ids: parseTagIds(body)
    });

    res.redirect('/admin/apis?success=API added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      try {
        var categories = await Api.adminGetAllCategories();
        var tags = await Api.adminGetAllTags();
        return adminRender(res, 'admin/apis/create', {
          title: 'Add API — Admin',
          categories: categories,
          tags: tags,
          error: 'An API with that slug already exists.'
        });
      } catch (innerErr) { return next(innerErr); }
    }
    next(err);
  }
});

/* ========== EDIT FORM ========== */
router.get('/edit/:id', requireAdmin, async function (req, res, next) {
  try {
    var api = await Api.adminGetById(parseInt(req.params.id, 10));
    if (!api) return next();

    var categories = await Api.adminGetAllCategories();
    var tags = await Api.adminGetAllTags();

    adminRender(res, 'admin/apis/edit', {
      title: 'Edit: ' + api.name + ' — Admin',
      api: api,
      categories: categories,
      tags: tags,
      error: null
    });
  } catch (err) { next(err); }
});

/* ========== HANDLE UPDATE ========== */
router.post('/edit/:id', requireAdmin, async function (req, res, next) {
  try {
    var id = parseInt(req.params.id, 10);
    var body = req.body;

    await Api.update(id, {
      category_id: parseInt(body.category_id, 10),
      slug: body.slug,
      name: body.name,
      description: body.description,
      website_url: body.website_url,
      docs_url: body.docs_url || null,
      base_url: body.base_url || null,
      logo_url: body.logo_url || null,
      auth_type: body.auth_type,
      cors_support: body.cors_support,
      https_support: body.https_support === 'on' || body.https_support === '1' ? 1 : 0,
      rate_limit: body.rate_limit || null,
      pricing: body.pricing,
      endpoints: Api.parseFormEndpoints(body),
      sample_response: body.sample_response || null,
      sample_response_language: body.sample_response_language || 'json',
      features: parseLines(body.features),
      use_cases: parseLines(body.use_cases),
      notes: parseLines(body.notes),
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      seo_keywords: body.seo_keywords || null,
      status: body.status,
      is_featured: body.is_featured === 'on' || body.is_featured === '1' ? 1 : 0,
      sort_order: parseInt(body.sort_order, 10) || 0,
      tag_ids: parseTagIds(body)
    });

    res.redirect('/admin/apis?success=API updated successfully');
  } catch (err) { next(err); }
});

/* ========== HANDLE DELETE ========== */
router.post('/delete/:id', requireAdmin, async function (req, res, next) {
  try {
    await Api.delete(parseInt(req.params.id, 10));
    res.redirect('/admin/apis?success=API deleted');
  } catch (err) { next(err); }
});

module.exports = router;
