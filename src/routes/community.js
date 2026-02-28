/**
 * ============================================================
 * Value.Codes — Community Route
 * ============================================================
 * GET /community — Renders the Discord-style developer community
 * chat page. Login-gated: only authenticated users can participate.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET /community ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('community', {
    title: 'Developer Community — Value.Codes | Chat with Developers',
    description: 'Join the Value.Codes developer community. Chat with developers, share knowledge, get help with coding problems, and collaborate on projects in real time.',
    keywords: 'developer community, developer chat, coding community, programming forum, developer discord, coding help',
    canonical: `${siteUrl}/community`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.jpg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Developer Community',
        'description': 'Discord-style developer community for real-time chat and collaboration.',
        'url': `${siteUrl}/community`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Community', 'item': `${siteUrl}/community` }
        ]
      }
    ],
    pageCSS: ['/css/community.css'],
    pageJS: ['/js/community.js']
  });
});

module.exports = router;
