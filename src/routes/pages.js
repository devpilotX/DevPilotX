/**
 * ============================================================
 * Value.Codes — Static Pages Routes
 * ============================================================
 * GET  /about       — About page
 * GET  /contact     — Contact page
 * POST /contact     — Handle contact form submission
 * GET  /pricing     — Pricing page (Free vs Pro)
 * GET  /contribute  — Contribute / Open Source page
 * GET  /newsletter  — Newsletter signup page
 * GET  /search      — Search results page (noindex)
 * GET  /sitemap     — HTML sitemap page
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET /about ========== */
router.get('/about', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/about', {
    title: 'About — Value.Codes | Our Mission & Story',
    description: 'Learn about Value.Codes, our mission to provide free developer tools, and the team behind the platform. Built by developers, for developers.',
    keywords: 'about value.codes, developer tools platform, our mission, about us, developer community',
    canonical: `${siteUrl}/about/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': 'About Value.Codes',
        'description': 'Learn about our mission to provide free developer tools.',
        'url': `${siteUrl}/about/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'About', 'item': `${siteUrl}/about/` }
        ]
      }
    ],
    pageCSS: ['/css/about.css'],
    pageJS: []
  });
});

/* ========== GET /contact ========== */
router.get('/contact', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/contact', {
    title: 'Contact Us — Value.Codes | Get in Touch',
    description: 'Have a question, suggestion, or found a bug? Contact the Value.Codes team. We typically respond within 24 hours.',
    keywords: 'contact value.codes, get in touch, support, feedback, bug report, developer tools support',
    canonical: `${siteUrl}/contact/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': 'Contact Value.Codes',
        'description': 'Get in touch with the Value.Codes team.',
        'url': `${siteUrl}/contact/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Contact', 'item': `${siteUrl}/contact/` }
        ]
      }
    ],
    pageCSS: ['/css/contact.css'],
    pageJS: ['/js/contact.js'],
    errors: [],
    success: false
  });
});

/* ========== POST /contact — Handle Form Submission ========== */
router.post('/contact', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  const { name, email, subject, message, website } = req.body;

  /* Honeypot check — bots fill hidden fields */
  if (website && website.trim()) {
    return res.redirect('/contact');
  }

  const errors = [];

  /* Validation */
  if (!name || name.trim().length < 2) {
    errors.push({ msg: 'Name must be at least 2 characters.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    errors.push({ msg: 'A valid email address is required.' });
  }
  if (!subject || !subject.trim()) {
    errors.push({ msg: 'Please select a topic.' });
  }
  if (!message || message.trim().length < 20) {
    errors.push({ msg: 'Message must be at least 20 characters.' });
  }

  if (errors.length > 0) {
    return res.render('pages/contact', {
      title: 'Contact Us — Value.Codes | Get in Touch',
      description: 'Have a question, suggestion, or found a bug? Contact the Value.Codes team.',
      keywords: 'contact value.codes, get in touch, support, feedback',
      canonical: `${siteUrl}/contact/`,
      robots: 'index, follow',
      ogType: 'website',
      ogImage: `${siteUrl}/images/og-image.svg`,
      schema: null,
      pageCSS: ['/css/contact.css'],
      pageJS: ['/js/contact.js'],
      errors,
      success: false
    });
  }

  /* Log message server-side (extend with email/DB as needed) */
  console.log('[Contact Form]', {
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim().substring(0, 200),
    timestamp: new Date().toISOString()
  });

  return res.render('pages/contact', {
    title: 'Contact Us — Value.Codes | Get in Touch',
    description: 'Have a question, suggestion, or found a bug? Contact the Value.Codes team.',
    keywords: 'contact value.codes, get in touch, support, feedback',
    canonical: `${siteUrl}/contact/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/contact.css'],
    pageJS: ['/js/contact.js'],
    errors: [],
    success: true
  });
});

/* ========== GET /pricing ========== */
router.get('/pricing', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/pricing', {
    title: 'Pricing — Value.Codes | Free & Pro Plans for Developers',
    description: 'Compare Value.Codes Free and Pro plans. Get ad-free experience, extended limits, priority support, and exclusive community channels with Pro.',
    keywords: 'pricing, pro plan, free plan, developer tools pricing, premium features, ad-free, value.codes pro',
    canonical: `${siteUrl}/pricing/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Pricing',
        'description': 'Compare Free and Pro plans for Value.Codes.',
        'url': `${siteUrl}/pricing/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Pricing', 'item': `${siteUrl}/pricing/` }
        ]
      }
    ],
    pageCSS: ['/css/pricing.css'],
    pageJS: []
  });
});

/* ========== GET /contribute ========== */
router.get('/contribute', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/contribute', {
    title: 'Contribute — Value.Codes | Open Source & Community Contributions',
    description: 'Contribute to Value.Codes! Help improve our developer tools, report bugs, suggest features, or contribute code. Open source and community-driven.',
    keywords: 'contribute, open source, community contributions, developer tools, help improve, report bugs, suggest features',
    canonical: `${siteUrl}/contribute/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Contribute to Value.Codes',
        'description': 'Help improve Value.Codes through open source contributions.',
        'url': `${siteUrl}/contribute/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Contribute', 'item': `${siteUrl}/contribute/` }
        ]
      }
    ],
    pageCSS: ['/css/contribute.css'],
    pageJS: ['/js/contribute.js']
  });
});

/* ========== GET /newsletter ========== */
router.get('/newsletter', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/newsletter', {
    title: 'Newsletter — Value.Codes | Developer News & Tips Weekly',
    description: 'Subscribe to the Value.Codes newsletter for weekly developer tips, tool updates, and curated resources delivered straight to your inbox.',
    keywords: 'developer newsletter, programming newsletter, weekly tips, coding updates, developer news, value.codes newsletter',
    canonical: `${siteUrl}/newsletter/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Newsletter',
        'description': 'Subscribe to the Value.Codes developer newsletter.',
        'url': `${siteUrl}/newsletter/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Newsletter', 'item': `${siteUrl}/newsletter/` }
        ]
      }
    ],
    pageCSS: ['/css/newsletter.css'],
    pageJS: [],
    errors: [],
    success: false
  });
});

/* ========== POST /newsletter — Handle Newsletter Signup ========== */
router.post('/newsletter', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  const { name, email, website } = req.body;

  if (website && website.trim()) return res.redirect('/newsletter');

  const errors = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    errors.push({ msg: 'A valid email address is required.' });
  }

  const renderOpts = {
    title: 'Newsletter — Value.Codes | Developer News & Tips Weekly',
    description: 'Subscribe to the Value.Codes newsletter.',
    keywords: 'developer newsletter, programming newsletter',
    canonical: `${siteUrl}/newsletter/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/newsletter.css'],
    pageJS: []
  };

  if (errors.length > 0) {
    return res.render('pages/newsletter', { ...renderOpts, errors, success: false });
  }

  console.log('[Newsletter Signup]', { name: (name || '').trim(), email: email.trim(), timestamp: new Date().toISOString() });
  return res.render('pages/newsletter', { ...renderOpts, errors: [], success: true });
});

/* ========== GET /search ========== */
router.get('/search', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';
  const query = req.query.q || '';

  res.render('pages/search', {
    title: `Search Results — Value.Codes`,
    description: 'Search Value.Codes for developer tools, articles, resources, and more.',
    keywords: 'search, find tools, search developer tools, value.codes search',
    canonical: `${siteUrl}/search/`,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: null,
    pageCSS: ['/css/search.css'],
    pageJS: [],
    query: query
  });
});

/* ========== GET /sitemap ========== */
router.get('/sitemap', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('pages/sitemap', {
    title: 'Sitemap — Value.Codes | All Pages & Tools',
    description: 'Browse the complete sitemap of Value.Codes. Find all developer tools, community pages, resources, and more in one place.',
    keywords: 'sitemap, all pages, site navigation, value.codes pages, site map',
    canonical: `${siteUrl}/sitemap/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Sitemap',
        'description': 'Complete sitemap of Value.Codes.',
        'url': `${siteUrl}/sitemap/`
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Sitemap', 'item': `${siteUrl}/sitemap/` }
        ]
      }
    ],
    pageCSS: ['/css/sitemap.css'],
    pageJS: []
  });
});

module.exports = router;