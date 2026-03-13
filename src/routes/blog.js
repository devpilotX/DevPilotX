'use strict';

/**
 * ============================================================
 * blog.js | Blog Public Routes (DB-Driven)
 * ============================================================
 * GET /blog                     | Blog listing (paginated)
 * GET /blog/category/:slug      | Articles by category
 * GET /blog/:slug               | Single article (DB, views++)
 * GET /sitemap.xml              | Dynamic sitemap from DB
 * ============================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

const PER_PAGE = 12;
const SITE_URL = process.env.SITE_URL || 'https://value.codes';

/* ─── Helpers ─────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function estimateReadTime(content) {
  if (!content) return '1 min read';
  const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function parseTags(tagStr) {
  if (!tagStr) return [];
  return tagStr.split(',').map(t => t.trim()).filter(Boolean);
}

/** Ensure thumbnail is a usable URL | full URLs pass through, relative paths get SITE_URL prefix.
 *  Data URIs (SVG thumbnails) pass through as-is for <img> src use. */
function normalizeThumbnail(thumb) {
  if (!thumb) return null;
  const t = thumb.trim();
  if (t.startsWith('data:')) return t;                              /* data URI | pass through */
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return t.startsWith('/') ? `${SITE_URL}${t}` : `${SITE_URL}/${t}`;
}

/** Returns a publicly accessible absolute URL for OG/Twitter meta tags.
 *  Data URIs cannot be used as OG images | falls back to default. */
function ogThumbnail(thumb) {
  if (!thumb) return null;
  const t = thumb.trim();
  if (t.startsWith('data:')) return null;   /* data URI | not usable as OG image */
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return t.startsWith('/') ? `${SITE_URL}${t}` : `${SITE_URL}/${t}`;
}

/** Add id="..." attributes to bare h2/h3 tags so the TOC can reference them */
function addHeadingIds(html) {
  if (!html) return html;
  const used = {};
  return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    if (/\bid=/.test(attrs)) return match;          /* already has an id */
    const text = inner.replace(/<[^>]*>/g, '').trim();
    let base = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/, '') || tag;
    used[base] = (used[base] || 0) + 1;
    const id = used[base] > 1 ? `${base}-${used[base]}` : base;
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
}

function formatArticle(a) {
  return {
    ...a,
    formattedDate: formatDate(a.published_at || a.created_at),
    readTime: estimateReadTime(a.content),
    tags: parseTags(a.tags),
    effectiveDate: a.published_at || a.created_at,
    content: addHeadingIds(a.content)
  };
}

/* ─── GET /blog | Listing ─────────────────────────────── */

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const catSlug = req.query.category || '';
    const tag = req.query.tag || '';
    const offset = (page - 1) * PER_PAGE;

    let where = "a.status = 'published'";
    const params = [];

    if (catSlug) {
      where += ' AND c.slug = ?';
      params.push(catSlug);
    }
    if (tag) {
      where += ' AND FIND_IN_SET(?, REPLACE(REPLACE(a.tags, ", ", ","), " ,", ",")) > 0';
      params.push(tag);
    }

    const [articles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.thumbnail, a.summary, a.author,
              a.tags, a.published_at, a.created_at, a.views, a.content,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE ${where}
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT ? OFFSET ?`,
      [...params, PER_PAGE, offset]
    );

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE ${where}`,
      params
    );

    const [allCategories] = await db.query(
      'SELECT * FROM categories ORDER BY name'
    );

    /* Tag cloud | all unique tags across published articles */
    const [tagRows] = await db.query(
      "SELECT tags FROM articles WHERE status = 'published' AND tags IS NOT NULL"
    );
    const allTags = [...new Set(
      tagRows.flatMap(r => parseTags(r.tags))
    )].sort();

    const totalPages = Math.ceil(countRow.total / PER_PAGE);
    const formatted = articles.map(formatArticle);
    const featured = formatted.slice(0, 3);

    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Value.Codes Blog | Developer Insights & Tech Trends",
        "description": "In-depth articles on programming, developer tools, AI, web development, and cybersecurity.",
        "url": `${SITE_URL}/blog`,
        "publisher": { "@type": "Organization", "name": "Value.Codes", "url": SITE_URL }
      }
    ];

    res.render('blog/index', {
      title: 'Blog | Value.Codes | Developer Insights, Tutorials & Tech Trends',
      description: 'Read in-depth articles on programming, developer tools, AI, web development, cybersecurity, and emerging tech trends. Written by developers, for developers.',
      keywords: 'developer blog, programming articles, tech trends, web development, AI, cybersecurity, coding tutorials',
      canonical: `${SITE_URL}/blog/`,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: `${SITE_URL}/images/og-image.svg`,
      schema,
      pageCSS: ['/css/blog.css'],
      pageJS: ['/js/blog.js'],
      articles: formatted,
      blogs: formatted,       /* backward compat with existing template */
      featuredPosts: featured,
      categories: allCategories,
      allTags,
      currentPage: page,
      totalPages,
      currentCategory: catSlug,
      currentTag: tag
    });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /blog/category/:slug ────────────────────────── */

router.get('/category/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * PER_PAGE;

    const [[category]] = await db.query(
      'SELECT * FROM categories WHERE slug = ?', [slug]
    );
    if (!category) return next();

    const [articles] = await db.query(
      `SELECT a.id, a.title, a.slug, a.thumbnail, a.summary, a.author,
              a.tags, a.published_at, a.created_at, a.views, a.content,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'published' AND c.slug = ?
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT ? OFFSET ?`,
      [slug, PER_PAGE, offset]
    );

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'published' AND c.slug = ?`,
      [slug]
    );

    const [allCategories] = await db.query('SELECT * FROM categories ORDER BY name');

    const formatted = articles.map(formatArticle);
    const totalPages = Math.ceil(countRow.total / PER_PAGE);

    res.render('blog/index', {
      title: `${category.name} Articles | Value.Codes Blog`,
      description: category.description || `In-depth ${category.name} articles for developers.`,
      keywords: `${category.name}, developer blog, tutorials`,
      canonical: `${SITE_URL}/blog/category/${slug}/`,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: `${SITE_URL}/images/og-image.svg`,
      schema: null,
      pageCSS: ['/css/blog.css'],
      pageJS: ['/js/blog.js'],
      articles: formatted,
      blogs: formatted,
      featuredPosts: [],
      categories: allCategories,
      allTags: [],
      currentPage: page,
      totalPages,
      currentCategory: slug,
      currentTag: '',
      categoryHeading: category.name
    });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /blog/:slug | Single Article ───────────────── */

router.get('/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;

    const [[article]] = await db.query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.slug = ? AND a.status = 'published'`,
      [slug]
    );

    if (!article) return next();

    /* Increment views (fire-and-forget, don't block render) */
    db.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]).catch(() => {});

    /* Related: same category, fill with recents if < 3 */
    const [sameCategory] = await db.query(
      `SELECT a.slug, a.title, a.thumbnail, a.summary, a.published_at,
              a.tags, a.content, c.name AS category_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.status = 'published' AND a.id != ? AND a.category_id = ?
       ORDER BY a.published_at DESC LIMIT 3`,
      [article.id, article.category_id]
    );

    let relatedPosts = sameCategory.map(formatArticle);

    if (relatedPosts.length < 3) {
      const need = 3 - relatedPosts.length;
      const existingSlugs = [slug, ...relatedPosts.map(r => r.slug)];
      const placeholders = existingSlugs.map(() => '?').join(',');
      const [extras] = await db.query(
        `SELECT a.slug, a.title, a.thumbnail, a.summary, a.published_at,
                a.tags, a.content, c.name AS category_name
         FROM articles a
         LEFT JOIN categories c ON a.category_id = c.id
         WHERE a.status = 'published' AND a.slug NOT IN (${placeholders})
         ORDER BY a.published_at DESC LIMIT ?`,
        [...existingSlugs, need]
      );
      relatedPosts = [...relatedPosts, ...extras.map(formatArticle)];
    }

    /* Prev / Next navigation */
    const effectiveDate = article.published_at || article.created_at;
    const [[prevRow]] = await db.query(
      "SELECT slug, title FROM articles WHERE status = 'published' AND COALESCE(published_at, created_at) < ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1",
      [effectiveDate]
    ).catch(() => [[null]]);

    const [[nextRow]] = await db.query(
      "SELECT slug, title FROM articles WHERE status = 'published' AND COALESCE(published_at, created_at) > ? ORDER BY COALESCE(published_at, created_at) ASC LIMIT 1",
      [effectiveDate]
    ).catch(() => [[null]]);

    const formatted = formatArticle(article);

    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
          { "@type": "ListItem", "position": 3, "name": article.title, "item": `${SITE_URL}/blog/${slug}` }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.meta_description || article.summary,
        "image": ogThumbnail(article.thumbnail) || `${SITE_URL}/images/og-image.svg`,
        "author": { "@type": "Person", "name": article.author },
        "publisher": {
          "@type": "Organization",
          "name": "Value.Codes",
          "url": SITE_URL,
          "logo": { "@type": "ImageObject", "url": `${SITE_URL}/favicon.svg` }
        },
        "datePublished": article.published_at,
        "dateModified": article.updated_at || article.published_at,
        "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
        "keywords": article.tags
      }
    ];

    const heroImage = normalizeThumbnail(article.thumbnail) || '/images/blog/placeholder.svg';
    const ogImg = ogThumbnail(article.thumbnail) || `${SITE_URL}/images/og-image.svg`;

    res.render('blog/post', {
      title: article.meta_title || `${article.title} | Value.Codes Blog`,
      description: article.meta_description || article.summary || '',
      keywords: article.tags || '',
      canonical: `${SITE_URL}/blog/${slug}/`,
      robots: 'index, follow',
      ogType: 'article',
      ogImage: ogImg,
      preloadImage: heroImage.startsWith('data:') ? null : heroImage,
      schema,
      pageCSS: ['/css/blog.css'],
      pageJS: ['/js/blog.js'],
      blog: formatted,
      article: formatted,     /* new name, same data */
      relatedPosts,
      prevPost: prevRow || null,
      nextPost: nextRow || null,
      blogSlug: slug
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
