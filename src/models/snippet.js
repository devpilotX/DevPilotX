/**
 * ================================================================
 * FILE: src/models/Snippet.js
 * PURPOSE: All database queries for the snippet system.
 *          Single source of truth — routes never write raw SQL.
 * ================================================================
 */

'use strict';

var db = require('../config/database');

var Snippet = {};

/* ========== PUBLIC QUERIES (for frontend routes) ========== */

/**
 * Get all active categories with published snippet counts
 */
Snippet.getAllCategories = async function () {
  var sql = `
    SELECT
      sc.id,
      sc.slug,
      sc.name,
      sc.emoji,
      sc.description,
      sc.sort_order,
      COUNT(s.id) AS snippet_count
    FROM snippet_categories sc
    LEFT JOIN snippets s ON s.category_id = sc.id AND s.status = 'published'
    WHERE sc.is_active = 1
    GROUP BY sc.id
    ORDER BY sc.sort_order ASC
  `;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get a single category by slug
 */
Snippet.getCategoryBySlug = async function (slug) {
  var sql = `
    SELECT * FROM snippet_categories
    WHERE slug = ? AND is_active = 1
    LIMIT 1
  `;
  var [rows] = await db.query(sql, [slug]);
  return rows[0] || null;
};

/**
 * Get all published snippets in a category
 */
Snippet.getPublishedByCategory = async function (categorySlug) {
  var sql = `
    SELECT
      s.id,
      s.slug,
      s.title,
      s.description,
      s.difficulty,
      s.views,
      s.published_at,
      sc.slug AS category_slug,
      sc.name AS category_name,
      sc.emoji AS category_emoji
    FROM snippets s
    JOIN snippet_categories sc ON sc.id = s.category_id
    WHERE sc.slug = ? AND s.status = 'published'
    ORDER BY s.sort_order ASC, s.published_at DESC
  `;
  var [rows] = await db.query(sql, [categorySlug]);

  /* Attach tags to each snippet */
  for (var i = 0; i < rows.length; i++) {
    rows[i].tags = await Snippet.getTagsForSnippet(rows[i].id);
  }

  return rows;
};

/**
 * Get a single published snippet by slug with all tabs and tags
 */
Snippet.getPublishedBySlug = async function (slug) {
  var sql = `
    SELECT
      s.*,
      sc.slug AS category_slug,
      sc.name AS category_name,
      sc.emoji AS category_emoji
    FROM snippets s
    JOIN snippet_categories sc ON sc.id = s.category_id
    WHERE s.slug = ? AND s.status = 'published'
    LIMIT 1
  `;
  var [rows] = await db.query(sql, [slug]);
  var snippet = rows[0] || null;

  if (!snippet) return null;

  /* Get code tabs */
  snippet.tabs = await Snippet.getTabsForSnippet(snippet.id);

  /* Get tags */
  snippet.tags = await Snippet.getTagsForSnippet(snippet.id);

  /* Parse JSON fields */
  snippet.notes = Snippet.parseJSON(snippet.notes);
  snippet.related_slugs = Snippet.parseJSON(snippet.related_slugs);

  return snippet;
};

/**
 * Get code tabs for a snippet
 */
Snippet.getTabsForSnippet = async function (snippetId) {
  var sql = `
    SELECT id, label, language, file_name, code, sort_order
    FROM snippet_tabs
    WHERE snippet_id = ?
    ORDER BY sort_order ASC
  `;
  var [rows] = await db.query(sql, [snippetId]);
  return rows;
};

/**
 * Get tags for a snippet
 */
Snippet.getTagsForSnippet = async function (snippetId) {
  var sql = `
    SELECT t.name, t.slug
    FROM snippet_tags t
    JOIN snippet_tag_map stm ON stm.tag_id = t.id
    WHERE stm.snippet_id = ?
    ORDER BY t.name ASC
  `;
  var [rows] = await db.query(sql, [snippetId]);
  return rows;
};

/**
 * Get previous and next snippets in the same category
 */
Snippet.getPrevNext = async function (snippet) {
  var sqlPrev = `
    SELECT slug, title, category_id
    FROM snippets
    WHERE category_id = ? AND status = 'published' AND sort_order < ?
    ORDER BY sort_order DESC
    LIMIT 1
  `;
  var sqlNext = `
    SELECT slug, title, category_id
    FROM snippets
    WHERE category_id = ? AND status = 'published' AND sort_order > ?
    ORDER BY sort_order ASC
    LIMIT 1
  `;

  var [prevRows] = await db.query(sqlPrev, [snippet.category_id, snippet.sort_order]);
  var [nextRows] = await db.query(sqlNext, [snippet.category_id, snippet.sort_order]);

  return {
    prev: prevRows[0] || null,
    next: nextRows[0] || null
  };
};

/**
 * Get related snippets by slug array
 */
Snippet.getRelatedBySlugs = async function (slugs) {
  if (!slugs || slugs.length === 0) return [];
  var placeholders = slugs.map(function () { return '?'; }).join(',');
  var sql = `
    SELECT s.slug, s.title, s.description, sc.slug AS category_slug
    FROM snippets s
    JOIN snippet_categories sc ON sc.id = s.category_id
    WHERE s.slug IN (${placeholders}) AND s.status = 'published'
  `;
  var [rows] = await db.query(sql, slugs);
  return rows;
};

/**
 * Increment view count
 */
Snippet.incrementViews = async function (snippetId) {
  var sql = `UPDATE snippets SET views = views + 1 WHERE id = ?`;
  await db.query(sql, [snippetId]);
};

/**
 * Full-text search published snippets
 */
Snippet.search = async function (query, limit) {
  if (!limit) limit = 20;
  var sql = `
    SELECT
      s.slug,
      s.title,
      s.description,
      s.difficulty,
      sc.slug AS category_slug,
      sc.name AS category_name,
      sc.emoji AS category_emoji,
      MATCH(s.title, s.description) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
    FROM snippets s
    JOIN snippet_categories sc ON sc.id = s.category_id
    WHERE s.status = 'published'
      AND MATCH(s.title, s.description) AGAINST(? IN NATURAL LANGUAGE MODE)
    ORDER BY relevance DESC
    LIMIT ?
  `;
  var [rows] = await db.query(sql, [query, query, limit]);
  return rows;
};

/**
 * Get total published snippet count
 */
Snippet.getPublishedCount = async function () {
  var sql = `SELECT COUNT(*) AS total FROM snippets WHERE status = 'published'`;
  var [rows] = await db.query(sql);
  return rows[0].total;
};

/* ========== ADMIN QUERIES (for admin panel) ========== */

/**
 * Get all snippets (admin — includes drafts)
 */
Snippet.adminGetAll = async function () {
  var sql = `
    SELECT
      s.id,
      s.slug,
      s.title,
      s.status,
      s.difficulty,
      s.views,
      s.sort_order,
      s.published_at,
      s.created_at,
      sc.name AS category_name,
      sc.emoji AS category_emoji
    FROM snippets s
    JOIN snippet_categories sc ON sc.id = s.category_id
    ORDER BY sc.sort_order ASC, s.sort_order ASC
  `;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get single snippet by ID (admin — for editing)
 */
Snippet.adminGetById = async function (id) {
  var sql = `SELECT * FROM snippets WHERE id = ? LIMIT 1`;
  var [rows] = await db.query(sql, [id]);
  var snippet = rows[0] || null;

  if (!snippet) return null;

  snippet.tabs = await Snippet.getTabsForSnippet(snippet.id);
  snippet.tags = await Snippet.getTagsForSnippet(snippet.id);
  snippet.notes = Snippet.parseJSON(snippet.notes);
  snippet.related_slugs = Snippet.parseJSON(snippet.related_slugs);

  return snippet;
};

/**
 * Create a new snippet
 */
Snippet.create = async function (data) {
  var connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    /* Insert snippet */
    var sql = `
      INSERT INTO snippets
        (category_id, slug, title, description, difficulty, browser_support,
         notes, related_slugs, seo_title, seo_description, seo_keywords,
         status, sort_order, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    var publishedAt = data.status === 'published' ? new Date() : null;
    var [result] = await connection.query(sql, [
      data.category_id,
      data.slug,
      data.title,
      data.description,
      data.difficulty || 'beginner',
      data.browser_support || null,
      JSON.stringify(data.notes || []),
      JSON.stringify(data.related_slugs || []),
      data.seo_title || null,
      data.seo_description || null,
      data.seo_keywords || null,
      data.status || 'draft',
      data.sort_order || 0,
      publishedAt
    ]);

    var snippetId = result.insertId;

    /* Insert tabs */
    if (data.tabs && data.tabs.length > 0) {
      await Snippet.insertTabs(connection, snippetId, data.tabs);
    }

    /* Attach tags */
    if (data.tag_ids && data.tag_ids.length > 0) {
      await Snippet.attachTags(connection, snippetId, data.tag_ids);
    }

    await connection.commit();
    return snippetId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/**
 * Update an existing snippet
 */
Snippet.update = async function (id, data) {
  var connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    /* Check if being published for first time */
    var publishedAt = undefined;
    if (data.status === 'published') {
      var [existing] = await connection.query(
        'SELECT published_at FROM snippets WHERE id = ?', [id]
      );
      if (existing[0] && !existing[0].published_at) {
        publishedAt = new Date();
      }
    }

    /* Update snippet */
    var sql = `
      UPDATE snippets SET
        category_id = ?,
        slug = ?,
        title = ?,
        description = ?,
        difficulty = ?,
        browser_support = ?,
        notes = ?,
        related_slugs = ?,
        seo_title = ?,
        seo_description = ?,
        seo_keywords = ?,
        status = ?,
        sort_order = ?
        ${publishedAt !== undefined ? ', published_at = ?' : ''}
      WHERE id = ?
    `;
    var params = [
      data.category_id,
      data.slug,
      data.title,
      data.description,
      data.difficulty || 'beginner',
      data.browser_support || null,
      JSON.stringify(data.notes || []),
      JSON.stringify(data.related_slugs || []),
      data.seo_title || null,
      data.seo_description || null,
      data.seo_keywords || null,
      data.status || 'draft',
      data.sort_order || 0
    ];
    if (publishedAt !== undefined) params.push(publishedAt);
    params.push(id);

    await connection.query(sql, params);

    /* Replace tabs (delete old, insert new) */
    await connection.query('DELETE FROM snippet_tabs WHERE snippet_id = ?', [id]);
    if (data.tabs && data.tabs.length > 0) {
      await Snippet.insertTabs(connection, id, data.tabs);
    }

    /* Replace tags */
    await connection.query('DELETE FROM snippet_tag_map WHERE snippet_id = ?', [id]);
    if (data.tag_ids && data.tag_ids.length > 0) {
      await Snippet.attachTags(connection, id, data.tag_ids);
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
 * Delete a snippet
 */
Snippet.delete = async function (id) {
  var sql = 'DELETE FROM snippets WHERE id = ?';
  await db.query(sql, [id]);
};

/**
 * Get all categories (admin — includes inactive)
 */
Snippet.adminGetAllCategories = async function () {
  var sql = `SELECT * FROM snippet_categories ORDER BY sort_order ASC`;
  var [rows] = await db.query(sql);
  return rows;
};

/**
 * Get all tags (admin)
 */
Snippet.adminGetAllTags = async function () {
  var sql = `SELECT * FROM snippet_tags ORDER BY name ASC`;
  var [rows] = await db.query(sql);
  return rows;
};

/* ========== INTERNAL HELPERS ========== */

/**
 * Insert tabs for a snippet (used in create/update)
 */
Snippet.insertTabs = async function (connection, snippetId, tabs) {
  var sql = `
    INSERT INTO snippet_tabs (snippet_id, label, language, file_name, code, sort_order)
    VALUES ?
  `;
  var values = tabs.map(function (tab, idx) {
    return [
      snippetId,
      tab.label,
      tab.language,
      tab.file_name || null,
      tab.code,
      tab.sort_order !== undefined ? tab.sort_order : idx
    ];
  });
  await connection.query(sql, [values]);
};

/**
 * Attach tags to a snippet
 */
Snippet.attachTags = async function (connection, snippetId, tagIds) {
  var sql = `INSERT INTO snippet_tag_map (snippet_id, tag_id) VALUES ?`;
  var values = tagIds.map(function (tagId) {
    return [snippetId, tagId];
  });
  await connection.query(sql, [values]);
};

/**
 * Safely parse JSON fields
 */
Snippet.parseJSON = function (value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return [];
  }
};

module.exports = Snippet;