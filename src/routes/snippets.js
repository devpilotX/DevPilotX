/**
 * ================================================================
 * FILE: src/routes/snippets.js
 * PURPOSE: Public snippet routes (listing, category, single)
 * URLS:
 *   GET /snippets                    → All categories
 *   GET /snippets/:category          → Category listing
 *   GET /snippets/:category/:slug    → Single snippet
 * ================================================================
 */

'use strict';

var express = require('express');
var router = express.Router();
var Snippet = require('../models/snippet');

var SITE = process.env.SITE_URL || 'https://value.codes';

/* ========== ALL CATEGORIES — /snippets ========== */
router.get('/', async function (req, res, next) {
  try {
    var categories = await Snippet.getAllCategories();
    var totalCount = await Snippet.getPublishedCount();

    res.render('snippets/index', {
      title: 'Code Snippets — Value.Codes | Copy-Paste Ready Developer Snippets',
      description: 'Browse ' + totalCount + ' production-ready code snippets for CSS, JavaScript, Node.js, React, and DevOps. Copy-paste into your projects instantly.',
      keywords: 'code snippets, css snippets, javascript snippets, react hooks, node.js snippets, developer snippets',
      canonical: SITE + '/snippets/',
      robots: 'index, follow',
      ogType: 'website',
      ogImage: SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Code Snippets',
        'description': 'Browse production-ready code snippets for web developers.',
        'url': SITE + '/snippets',
        'isPartOf': { '@type': 'WebSite', 'name': 'Value.Codes', 'url': SITE }
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'Snippets', url: SITE + '/snippets' }
      ],
      pageCSS: ['/css/snippets.css'],
      pageJS: ['/js/snippets.js'],
      categories: categories,
      totalCount: totalCount
    });
  } catch (err) {
    next(err);
  }
});

/* ========== CATEGORY LISTING — /snippets/:category ========== */
router.get('/:category', async function (req, res, next) {
  try {
    var categorySlug = req.params.category;
    var category = await Snippet.getCategoryBySlug(categorySlug);

    if (!category) return next();

    var snippets = await Snippet.getPublishedByCategory(categorySlug);

    res.render('snippets/category', {
      title: category.emoji + ' ' + category.name + ' Snippets — Value.Codes',
      description: category.description + ' ' + snippets.length + ' copy-paste ready code snippets.',
      keywords: categorySlug.replace(/-/g, ' ') + ', code snippets, ' + category.name.toLowerCase() + ' snippets',
      canonical: SITE + '/snippets/' + categorySlug + '/',
      robots: 'index, follow',
      ogType: 'website',
      ogImage: SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': category.name + ' Code Snippets',
        'description': category.description,
        'url': SITE + '/snippets/' + categorySlug
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'Snippets', url: SITE + '/snippets' },
        { name: category.name, url: SITE + '/snippets/' + categorySlug }
      ],
      pageCSS: ['/css/snippets.css'],
      pageJS: ['/js/snippets.js'],
      category: category,
      snippets: snippets
    });
  } catch (err) {
    next(err);
  }
});

/* ========== SINGLE SNIPPET — /snippets/:category/:slug ========== */
router.get('/:category/:slug', async function (req, res, next) {
  try {
    var snippet = await Snippet.getPublishedBySlug(req.params.slug);

    if (!snippet || snippet.category_slug !== req.params.category) {
      return next();
    }

    /* Increment view count (fire and forget — don't await) */
    Snippet.incrementViews(snippet.id);

    /* Get prev/next navigation */
    var prevNext = await Snippet.getPrevNext(snippet);

    /* Get related snippets */
    var relatedSnippets = await Snippet.getRelatedBySlugs(snippet.related_slugs);

    /* SEO fallbacks */
    var seoTitle = snippet.seo_title || snippet.title + ' — Value.Codes Snippets';
    var seoDesc = snippet.seo_description || snippet.description.substring(0, 160);
    var seoKeys = snippet.seo_keywords || snippet.tags.map(function (t) { return t.name; }).join(', ');

    res.render('snippets/single', {
      title: seoTitle,
      description: seoDesc,
      keywords: seoKeys,
      canonical: SITE + '/snippets/' + snippet.category_slug + '/' + snippet.slug + '/',
      robots: 'index, follow',
      ogType: 'article',
      ogImage: SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        'name': snippet.title,
        'description': snippet.description,
        'url': SITE + '/snippets/' + snippet.category_slug + '/' + snippet.slug,
        'author': { '@type': 'Organization', 'name': 'Value.Codes' },
        'datePublished': snippet.published_at,
        'dateModified': snippet.updated_at,
        'proficiencyLevel': snippet.difficulty === 'beginner' ? 'Beginner' : snippet.difficulty === 'intermediate' ? 'Intermediate' : 'Expert'
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'Snippets', url: SITE + '/snippets' },
        { name: snippet.category_name, url: SITE + '/snippets/' + snippet.category_slug },
        { name: snippet.title, url: SITE + '/snippets/' + snippet.category_slug + '/' + snippet.slug }
      ],
      pageCSS: ['/css/snippets.css', '/css/snippet-single.css'],
      pageJS: ['/js/snippet-single.js'],
      snippet: snippet,
      relatedSnippets: relatedSnippets,
      prevSnippet: prevNext.prev,
      nextSnippet: prevNext.next
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
