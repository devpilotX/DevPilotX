/**
 * ============================================================
 * Value.Codes — Legal Pages Routes
 * ============================================================
 * GET /legal/privacy-policy    — Privacy Policy page
 * GET /legal/terms-of-service  — Terms of Service page
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET /legal/privacy-policy ========== */
router.get('/privacy-policy', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('legal/privacy-policy', {
    title: 'Privacy Policy — Value.Codes | How We Protect Your Data',
    description: 'Read the Value.Codes privacy policy. Learn how we collect, use, and protect your personal data, including our use of Google AdSense and cookies.',
    keywords: 'privacy policy, data protection, cookies, google adsense, personal data, value.codes privacy',
    canonical: `${siteUrl}/legal/privacy-policy`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.jpg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Privacy Policy',
        'description': 'Value.Codes privacy policy — how we collect, use, and protect your data.',
        'url': `${siteUrl}/legal/privacy-policy`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Privacy Policy', 'item': `${siteUrl}/legal/privacy-policy` }
        ]
      }
    ],
    pageCSS: ['/css/legal.css'],
    pageJS: []
  });
});

/* ========== GET /legal/terms-of-service ========== */
router.get('/terms-of-service', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('legal/terms-of-service', {
    title: 'Terms of Service — Value.Codes | Usage Terms & Conditions',
    description: 'Read the Value.Codes terms of service. Understand the terms and conditions for using our developer tools, compiler, and community platform.',
    keywords: 'terms of service, terms and conditions, usage terms, value.codes terms, legal, user agreement',
    canonical: `${siteUrl}/legal/terms-of-service`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.jpg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Terms of Service',
        'description': 'Value.Codes terms of service and conditions of use.',
        'url': `${siteUrl}/legal/terms-of-service`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Terms of Service', 'item': `${siteUrl}/legal/terms-of-service` }
        ]
      }
    ],
    pageCSS: ['/css/legal.css'],
    pageJS: []
  });
});

module.exports = router;
