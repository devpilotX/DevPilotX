/**
 * ================================================================
 * FILE: src/models/Api.js
 * PURPOSE: All database queries for the Public API Directory
 * ================================================================
 */

'use strict';

var db = require('../config/database');

var Api = {};

/* ========== PUBLIC QUERIES ========== */

/**
 * Get all active categories with published API counts
 */
Api.getAllCategories = async function () {
  var sql = `
    SELECT
      ac.id,
      ac.slug,
      ac.name,
      ac.emoji,
      ac.description,
      ac.sort_order,
      COUNT(a.id) AS api_count
    FROM api_categories ac
    LEFT JOIN apis a ON a.category_id = ac.id AND a.status = 'published'
    WHERE ac.is_active = 1
    GROUP BY ac.id
    ORDER BY ac.sort_order ASC
  `;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get single category by slug
 */
Api.getCategoryBySlug = async function (slug) {
  var sql = `
    SELECT * FROM api_categories
    WHERE slug = ? AND is_active = 1
    LIMIT 1
  `;
  var [rows] = await db.query(sql, [slug]);
  return rows[0] || null;
};

/**
 * Get all published APIs in a category
 */
Api.getPublishedByCategory = async function (categorySlug) {
  var sql = `
    SELECT
      a.id,
      a.slug,
      a.name,
      a.description,
      a.website_url,
      a.logo_url,
      a.auth_type,
      a.cors_support,
      a.https_support,
      a.pricing,
      a.rate_limit,
      a.is_featured,
      a.views,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.emoji AS category_emoji
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE ac.slug = ? AND a.status = 'published'
    ORDER BY a.is_featured DESC, a.sort_order ASC, a.name ASC
  `;
  var [rows] = await db.query(sql, [categorySlug]);

  for (var i = 0; i < rows.length; i++) {
    rows[i].tags = await Api.getTagsForApi(rows[i].id);
  }

  return rows;
};

/**
 * Get all published APIs (for main page with client-side search)
 */
Api.getAllPublished = async function () {
  var sql = `
    SELECT
      a.id,
      a.slug,
      a.name,
      a.description,
      a.website_url,
      a.logo_url,
      a.auth_type,
      a.cors_support,
      a.https_support,
      a.pricing,
      a.rate_limit,
      a.is_featured,
      a.views,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.emoji AS category_emoji
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE a.status = 'published'
    ORDER BY a.is_featured DESC, ac.sort_order ASC, a.sort_order ASC
  `;
  var [rows] = await db.query(sql);

  for (var i = 0; i < rows.length; i++) {
    rows[i].tags = await Api.getTagsForApi(rows[i].id);
  }

  return rows;
};

/**
 * Get single published API by slug (full detail)
 */
Api.getPublishedBySlug = async function (slug) {
  var sql = `
    SELECT
      a.*,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.emoji AS category_emoji
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE a.slug = ? AND a.status = 'published'
    LIMIT 1
  `;
  var [rows] = await db.query(sql, [slug]);
  var api = rows[0] || null;

  if (!api) return null;

  api.tags = await Api.getTagsForApi(api.id);
  api.endpoints = Api.parseJSON(api.endpoints);
  api.features = Api.parseJSON(api.features);
  api.use_cases = Api.parseJSON(api.use_cases);
  api.notes = Api.parseJSON(api.notes);

  return api;
};

/**
 * Get tags for an API
 */
Api.getTagsForApi = async function (apiId) {
  var sql = `
    SELECT t.name, t.slug
    FROM api_tags t
    JOIN api_tag_map atm ON atm.tag_id = t.id
    WHERE atm.api_id = ?
    ORDER BY t.name ASC
  `;
  var [rows] = await db.query(sql, [apiId]);
  return rows;
};

/**
 * Get related APIs in same category (exclude current)
 */
Api.getRelated = async function (api, limit) {
  if (!limit) limit = 4;
  var sql = `
    SELECT
      a.slug,
      a.name,
      a.description,
      a.auth_type,
      a.cors_support,
      a.pricing,
      a.logo_url,
      ac.slug AS category_slug
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE a.category_id = ? AND a.id != ? AND a.status = 'published'
    ORDER BY a.is_featured DESC, a.sort_order ASC
    LIMIT ?
  `;
  var [rows] = await db.query(sql, [api.category_id, api.id, limit]);
  return rows;
};

/**
 * Increment view count
 */
Api.incrementViews = async function (apiId) {
  var sql = `UPDATE apis SET views = views + 1 WHERE id = ?`;
  await db.query(sql, [apiId]);
};

/**
 * Full-text search
 */
Api.search = async function (query, limit) {
  if (!limit) limit = 30;
  var sql = `
    SELECT
      a.slug,
      a.name,
      a.description,
      a.auth_type,
      a.cors_support,
      a.pricing,
      a.logo_url,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.emoji AS category_emoji,
      MATCH(a.name, a.description) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE a.status = 'published'
      AND MATCH(a.name, a.description) AGAINST(? IN NATURAL LANGUAGE MODE)
    ORDER BY relevance DESC
    LIMIT ?
  `;
  var [rows] = await db.query(sql, [query, query, limit]);
  return rows;
};

/**
 * Get featured APIs (for homepage or sidebar)
 */
Api.getFeatured = async function (limit) {
  if (!limit) limit = 6;
  var sql = `
    SELECT
      a.slug,
      a.name,
      a.description,
      a.auth_type,
      a.cors_support,
      a.pricing,
      a.logo_url,
      ac.slug AS category_slug,
      ac.name AS category_name,
      ac.emoji AS category_emoji
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    WHERE a.status = 'published' AND a.is_featured = 1
    ORDER BY a.sort_order ASC
    LIMIT ?
  `;
  var [rows] = await db.query(sql, [limit]);
  return rows;
};

/**
 * Get total published count
 */
Api.getPublishedCount = async function () {
  var sql = `SELECT COUNT(*) AS total FROM apis WHERE status = 'published'`;
  var [rows] = await db.query(sql);
  return rows[0].total;
};

/* ========== ADMIN QUERIES ========== */

/**
 * Get all APIs (admin — includes drafts)
 */
Api.adminGetAll = async function () {
  var sql = `
    SELECT
      a.id,
      a.slug,
      a.name,
      a.status,
      a.auth_type,
      a.pricing,
      a.is_featured,
      a.views,
      a.sort_order,
      a.created_at,
      ac.name AS category_name,
      ac.emoji AS category_emoji
    FROM apis a
    JOIN api_categories ac ON ac.id = a.category_id
    ORDER BY ac.sort_order ASC, a.sort_order ASC, a.name ASC
  `;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get single API by ID (admin — for editing)
 */
Api.adminGetById = async function (id) {
  var sql = `SELECT * FROM apis WHERE id = ? LIMIT 1`;
  var [rows] = await db.query(sql, [id]);
  var api = rows[0] || null;

  if (!api) return null;

  api.tags = await Api.getTagsForApi(api.id);
  api.endpoints = Api.parseJSON(api.endpoints);
  api.features = Api.parseJSON(api.features);
  api.use_cases = Api.parseJSON(api.use_cases);
  api.notes = Api.parseJSON(api.notes);

  return api;
};

/**
 * Create a new API
 */
Api.create = async function (data) {
  var connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    var publishedAt = data.status === 'published' ? new Date() : null;

    var sql = `
      INSERT INTO apis
        (category_id, slug, name, description, website_url, docs_url, base_url, logo_url,
         auth_type, cors_support, https_support, rate_limit, pricing,
         endpoints, sample_response, sample_response_language,
         features, use_cases, notes,
         seo_title, seo_description, seo_keywords,
         status, is_featured, sort_order, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    var [result] = await connection.query(sql, [
      data.category_id,
      data.slug,
      data.name,
      data.description,
      data.website_url,
      data.docs_url || null,
      data.base_url || null,
      data.logo_url || null,
      data.auth_type || 'none',
      data.cors_support || 'unknown',
      data.https_support !== undefined ? data.https_support : 1,
      data.rate_limit || null,
      data.pricing || 'free',
      JSON.stringify(data.endpoints || []),
      data.sample_response || null,
      data.sample_response_language || 'json',
      JSON.stringify(data.features || []),
      JSON.stringify(data.use_cases || []),
      JSON.stringify(data.notes || []),
      data.seo_title || null,
      data.seo_description || null,
      data.seo_keywords || null,
      data.status || 'draft',
      data.is_featured ? 1 : 0,
      data.sort_order || 0,
      publishedAt
    ]);

    var apiId = result.insertId;

    /* Attach tags */
    if (data.tag_ids && data.tag_ids.length > 0) {
      await Api.attachTags(connection, apiId, data.tag_ids);
    }

    await connection.commit();
    return apiId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Update an existing API
 */
Api.update = async function (id, data) {
  var connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    /* Check if being published for first time */
    var publishedAt = undefined;
    if (data.status === 'published') {
      var [existing] = await connection.query(
        'SELECT published_at FROM apis WHERE id = ?', [id]
      );
      if (existing[0] && !existing[0].published_at) {
        publishedAt = new Date();
      }
    }

    var sql = `
      UPDATE apis SET
        category_id = ?,
        slug = ?,
        name = ?,
        description = ?,
        website_url = ?,
        docs_url = ?,
        base_url = ?,
        logo_url = ?,
        auth_type = ?,
        cors_support = ?,
        https_support = ?,
        rate_limit = ?,
        pricing = ?,
        endpoints = ?,
        sample_response = ?,
        sample_response_language = ?,
        features = ?,
        use_cases = ?,
        notes = ?,
        seo_title = ?,
        seo_description = ?,
        seo_keywords = ?,
        status = ?,
        is_featured = ?,
        sort_order = ?
        ${publishedAt !== undefined ? ', published_at = ?' : ''}
      WHERE id = ?
    `;

    var params = [
      data.category_id,
      data.slug,
      data.name,
      data.description,
      data.website_url,
      data.docs_url || null,
      data.base_url || null,
      data.logo_url || null,
      data.auth_type || 'none',
      data.cors_support || 'unknown',
      data.https_support !== undefined ? data.https_support : 1,
      data.rate_limit || null,
      data.pricing || 'free',
      JSON.stringify(data.endpoints || []),
      data.sample_response || null,
      data.sample_response_language || 'json',
      JSON.stringify(data.features || []),
      JSON.stringify(data.use_cases || []),
      JSON.stringify(data.notes || []),
      data.seo_title || null,
      data.seo_description || null,
      data.seo_keywords || null,
      data.status || 'draft',
      data.is_featured ? 1 : 0,
      data.sort_order || 0
    ];
    if (publishedAt !== undefined) params.push(publishedAt);
    params.push(id);

    await connection.query(sql, params);

    /* Replace tags */
    await connection.query('DELETE FROM api_tag_map WHERE api_id = ?', [id]);
    if (data.tag_ids && data.tag_ids.length > 0) {
      await Api.attachTags(connection, id, data.tag_ids);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Delete an API
 */
Api.delete = async function (id) {
  await db.query('DELETE FROM apis WHERE id = ?', [id]);
};

/**
 * Get all categories (admin)
 */
Api.adminGetAllCategories = async function () {
  var sql = `SELECT * FROM api_categories ORDER BY sort_order ASC`;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get all tags (admin)
 */
Api.adminGetAllTags = async function () {
  var sql = `SELECT * FROM api_tags ORDER BY name ASC`;
  var [rows] = await db.query(sql);
  return rows;
};

/* ========== INTERNAL HELPERS ========== */

Api.attachTags = async function (connection, apiId, tagIds) {
  var sql = `INSERT INTO api_tag_map (api_id, tag_id) VALUES ?`;
  var values = tagIds.map(function (tagId) {
    return [apiId, tagId];
  });
  await connection.query(sql, [values]);
};

Api.parseJSON = function (value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return [];
  }
};

/**
 * Parse endpoints from admin form
 * Form sends: endpoint_method_0, endpoint_path_0, endpoint_desc_0, etc.
 */
Api.parseFormEndpoints = function (body) {
  var endpoints = [];
  var i = 0;
  while (body['endpoint_method_' + i] !== undefined) {
    if (body['endpoint_path_' + i] && body['endpoint_path_' + i].trim()) {
      endpoints.push({
        method: body['endpoint_method_' + i],
        path: body['endpoint_path_' + i],
        description: body['endpoint_desc_' + i] || ''
      });
    }
    i++;
  }
  return endpoints;
};

module.exports = Api;