/**
 * ============================================================
 * Value.Codes — Blog Routes
 * ============================================================
 * GET /blog — Renders the blog listing page with articles.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET /blog ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('blog/index', {
    title: 'Blog — Value.Codes | Developer Tips, Tutorials & News',
    description: 'Read developer tips, tutorials, and industry news on the Value.Codes blog. Stay up to date with the latest in web development and programming.',
    keywords: 'developer blog, programming tutorials, web development tips, coding articles, tech news, developer news',
    canonical: `${siteUrl}/blog`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.jpg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'Value.Codes Blog',
        'description': 'Developer tips, tutorials, and news.',
        'url': `${siteUrl}/blog`,
        'publisher': {
          '@type': 'Organization',
          'name': 'Value.Codes',
          'url': siteUrl
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${siteUrl}/blog` }
        ]
      }
    ],
    pageCSS: ['/css/blog.css'],
    pageJS: []
  });
});

module.exports = router;
