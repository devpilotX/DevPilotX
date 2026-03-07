/**
 * ================================================================
 * FILE: src/routes/apis.js
 * PURPOSE: Public API Directory routes
 * URLS:
 *   GET /apis                       → Hub page (all categories + search)
 *   GET /apis/:category             → Category page
 *   GET /apis/:category/:slug       → Single API detail page (SEO!)
 * ================================================================
 */

'use strict';

var express = require('express');
var router = express.Router();
var Api = require('../models/api');

var SITE = process.env.SITE_URL || 'https://value.codes';

/* ========== HUB PAGE — /apis ========== */
router.get('/', async function (req, res, next) {
  try {
    var categories = await Api.getAllCategories();
    var allApis = await Api.getAllPublished();
    var featuredApis = await Api.getFeatured(6);
    var totalCount = await Api.getPublishedCount();

    res.render('apis/index', {
      title: 'Free Public API Directory for Developers — Value.Codes',
      description: 'Discover ' + totalCount + ' free public APIs for your next project. Finance, Crypto, Weather, AI, Mock Data, and more. Live JSON previews included.',
      keywords: 'free public apis, api directory, free api for developers, rest api list, json api free',
      canonical: SITE + '/apis/',
      robots: 'index, follow',
      ogType: 'website',
      ogImage: SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Free Public API Directory',
        'description': 'Curated directory of free public APIs for developers.',
        'url': SITE + '/apis'
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'APIs', url: SITE + '/apis' }
      ],
      pageCSS: ['/css/apis.css'],
      pageJS: ['/js/apis.js'],
      categories: categories,
      allApis: allApis,
      featuredApis: featuredApis,
      totalCount: totalCount
    });
  } catch (err) {
    next(err);
  }
});

/* ========== CATEGORY PAGE — /apis/:category ========== */
router.get('/:category', async function (req, res, next) {
  try {
    var category = await Api.getCategoryBySlug(req.params.category);
    if (!category) return next();

    var apis = await Api.getPublishedByCategory(req.params.category);

    res.render('apis/category', {
      title: 'Free ' + category.name + ' APIs — Public API Directory | Value.Codes',
      description: 'Browse ' + apis.length + ' free ' + category.name.toLowerCase() + ' APIs for developers. Auth methods, CORS details, endpoint examples, and live JSON previews. No signup required.',
      keywords: category.name.toLowerCase() + ' api, free ' + category.slug.replace(/-/g, ' ') + ' api, public ' + category.name.toLowerCase() + ' api, ' + category.name.toLowerCase() + ' rest api free',
      canonical: SITE + '/apis/' + category.slug + '/',
      robots: 'index, follow',
      ogType: 'website',
      ogImage: SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': category.name + ' APIs',
        'description': category.description,
        'url': SITE + '/apis/' + category.slug
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'APIs', url: SITE + '/apis' },
        { name: category.name, url: SITE + '/apis/' + category.slug }
      ],
      pageCSS: ['/css/apis.css'],
      pageJS: ['/js/apis.js'],
      category: category,
      apis: apis
    });
  } catch (err) {
    next(err);
  }
});

/* ========== SINGLE API — /apis/:category/:slug (Programmatic SEO) ========== */
router.get('/:category/:slug', async function (req, res, next) {
  try {
    var api = await Api.getPublishedBySlug(req.params.slug);

    if (!api || api.category_slug !== req.params.category) {
      return next();
    }

    /* Increment views (fire and forget) */
    Api.incrementViews(api.id);

    /* Get related APIs */
    var relatedApis = await Api.getRelated(api, 4);

    /* SEO */
    var seoTitle = api.seo_title || api.name + ' API — Free ' + api.category_name + ' API | Value.Codes';
    var seoDesc = api.seo_description || api.description.substring(0, 140) + '. Free public API with auth details, endpoint docs, and live JSON preview.';
    var seoKeys = api.seo_keywords || api.tags.map(function (t) { return t.name; }).join(', ') + ', ' + api.name.toLowerCase() + ' api, free ' + api.category_name.toLowerCase() + ' api';

    res.render('apis/single', {
      title: seoTitle,
      description: seoDesc,
      keywords: seoKeys,
      canonical: SITE + '/apis/' + api.category_slug + '/' + api.slug + '/',
      robots: 'index, follow',
      ogType: 'article',
      ogImage: api.logo_url || SITE + '/images/og-image.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': api.name + ' API',
        'description': api.description,
        'url': api.website_url,
        'applicationCategory': 'WebApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      },
      breadcrumbs: [
        { name: 'Home', url: SITE + '/' },
        { name: 'APIs', url: SITE + '/apis' },
        { name: api.category_name, url: SITE + '/apis/' + api.category_slug },
        { name: api.name, url: SITE + '/apis/' + api.category_slug + '/' + api.slug }
      ],
      pageCSS: ['/css/apis.css', '/css/api-single.css'],
      pageJS: ['/js/api-single.js'],
      api: api,
      relatedApis: relatedApis
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
