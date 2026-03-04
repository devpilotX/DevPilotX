/**
 * ============================================================
 * Value.Codes — Resources Routes
 * ============================================================
 * GET /resources                       — Resources Landing Page
 * GET /resources/developer-tools      — Developer Tools Guide
 * GET /resources/best-practices       — Best Practices Guide
 * GET /resources/career-roadmaps      — Career Roadmaps
 * GET /resources/essential-software   — Essential Software Guide
 * GET /resources/documentation        — Developer Documentation Directory
 * GET /resources/glossary             — Programming Glossary
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET /resources (index) ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/index', {
    title: 'Developer Resources — Value.Codes | Guides, Roadmaps & References',
    description: 'Curated developer resources: coding best practices, career roadmaps, official documentation links, essential software guides, developer tools overview, and a complete programming glossary.',
    keywords: 'developer resources, coding guides, career roadmaps, developer documentation, programming glossary, best practices, essential software, developer tools guide 2026',
    canonical: `${siteUrl}/resources/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Developer Resources',
        'description': 'Curated developer resources including guides, roadmaps, documentation links, and references.',
        'url': `${siteUrl}/resources/`,
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl }
      }
    ],
    pageCSS: ['/css/resources.css'],
    pageJS: []
  });
});

/* ========== GET /resources/developer-tools ========== */
router.get(['/developer-tools', '/developer-tools/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/developer-tools', {
    title: 'Complete Developer Tools Guide 2026 | VS Code, Git, Docker, API Testing — Value.Codes',
    description: 'Comprehensive guide to essential developer tools: code editors, version control, terminals, API testing, databases, containers, and more. Reviews, comparisons, and setup advice.',
    keywords: 'developer tools, VS Code, Git, GitHub, Docker, Postman, IntelliJ, terminal, API testing, database tools, code editor, IDE, developer workflow 2026',
    canonical: `${siteUrl}/resources/developer-tools/`,
    robots: 'index, follow',
    ogType: 'article',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Complete Developer Tools Guide: Build Your Perfect Workflow',
      'description': 'Comprehensive guide covering code editors, version control, terminals, API testing, database management, design tools, and more.',
      'author': { '@type': 'Organization', 'name': 'Value.Codes' },
      'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl },
      'datePublished': '2025-01-15',
      'dateModified': '2026-02-27',
      'url': `${siteUrl}/resources/developer-tools/`
    },
    pageCSS: ['/css/resources/developer-tools.css'],
    pageJS: ['/js/resources/developer-tools.js']
  });
});

/* ========== GET /resources/best-practices ========== */
router.get(['/best-practices', '/best-practices/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/best-practices', {
    title: 'Developer Best Practices 2026 | Coding Standards, Testing, Security — Value.Codes',
    description: 'Industry-proven coding standards, design patterns, testing strategies, and development workflows. Write better, more maintainable code backed by decades of engineering wisdom.',
    keywords: 'developer best practices, coding standards, clean code, testing strategies, code review, performance optimization, security best practices, agile development, SOLID principles, design patterns 2026',
    canonical: `${siteUrl}/resources/best-practices/`,
    robots: 'index, follow',
    ogType: 'article',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` },
          { '@type': 'ListItem', 'position': 3, 'name': 'Best Practices', 'item': `${siteUrl}/resources/best-practices/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Developer Best Practices: Write Better, More Maintainable Code',
        'description': 'Industry-proven coding standards, design patterns, testing strategies, and development workflows.',
        'author': { '@type': 'Organization', 'name': 'Value.Codes' },
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl },
        'datePublished': '2025-01-15',
        'dateModified': '2026-02-27',
        'url': `${siteUrl}/resources/best-practices/`
      }
    ],
    pageCSS: ['/css/resources/best-practices.css'],
    pageJS: ['/js/resources/best-practices.js']
  });
});

/* ========== GET /resources/career-roadmaps ========== */
router.get(['/career-roadmaps', '/career-roadmaps/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/career-roadmaps', {
    title: 'Developer Career Roadmaps 2026 | Frontend, Backend, DevOps, Full-Stack — Value.Codes',
    description: 'Complete, realistic guides to six major software development career paths. Learn what skills you need, how long it takes, what you\'ll earn, and how to get your first job.',
    keywords: 'developer career roadmap, frontend developer path, backend developer career, DevOps roadmap, full-stack developer guide, software engineer career 2026, web developer roadmap, career transition coding',
    canonical: `${siteUrl}/resources/career-roadmaps/`,
    robots: 'index, follow',
    ogType: 'article',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` },
          { '@type': 'ListItem', 'position': 3, 'name': 'Career Roadmaps', 'item': `${siteUrl}/resources/career-roadmaps/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Developer Career Roadmaps 2026: Complete Guides for Every Path',
        'description': 'Complete, realistic guides to major software development career paths covering skills, timelines, salaries, and job strategies.',
        'author': { '@type': 'Organization', 'name': 'Value.Codes' },
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl },
        'datePublished': '2025-01-15',
        'dateModified': '2026-02-27',
        'url': `${siteUrl}/resources/career-roadmaps/`
      }
    ],
    pageCSS: ['/css/resources/career-roadmaps.css'],
    pageJS: ['/js/resources/career-roadmaps.js']
  });
});

/* ========== GET /resources/essential-software ========== */
router.get(['/essential-software', '/essential-software/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/essential-software', {
    title: 'Essential Developer Software 2026 | IDEs, Terminals, Design Tools — Value.Codes',
    description: 'A comprehensive guide to must-have software tools for developers in 2026. IDEs, terminals, design tools, productivity apps, and more with honest reviews and platform comparisons.',
    keywords: 'essential developer software, best IDE 2026, developer productivity tools, VS Code, JetBrains, terminal tools, design software, developer apps, software development tools 2026',
    canonical: `${siteUrl}/resources/essential-software/`,
    robots: 'index, follow',
    ogType: 'article',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` },
          { '@type': 'ListItem', 'position': 3, 'name': 'Essential Software', 'item': `${siteUrl}/resources/essential-software/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': 'Essential Software for Developers in 2026',
        'description': 'A comprehensive guide to must-have software tools every developer needs.',
        'author': { '@type': 'Organization', 'name': 'Value.Codes' },
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl },
        'datePublished': '2025-01-15',
        'dateModified': '2026-02-27',
        'url': `${siteUrl}/resources/essential-software/`
      }
    ],
    pageCSS: ['/css/resources/essential-software.css'],
    pageJS: ['/js/resources/essential-software.js']
  });
});

/* ========== GET /resources/documentation ========== */
router.get(['/documentation', '/documentation/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/essential-documentation', {
    title: 'Developer Documentation Directory 2026 | Official Docs for Languages & Frameworks — Value.Codes',
    description: 'Comprehensive directory of official documentation for programming languages, frameworks, databases, and development tools. Direct links to authoritative sources, organized for efficient discovery.',
    keywords: 'developer documentation, official docs, programming language docs, framework documentation, API documentation, language references, React docs, Python docs, Node.js docs, developer resources 2026',
    canonical: `${siteUrl}/resources/documentation/`,
    robots: 'index, follow',
    ogType: 'article',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` },
          { '@type': 'ListItem', 'position': 3, 'name': 'Documentation', 'item': `${siteUrl}/resources/documentation/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Developer Documentation Directory',
        'description': 'Comprehensive directory of official documentation for programming languages, frameworks, and tools.',
        'url': `${siteUrl}/resources/documentation/`,
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl }
      }
    ],
    pageCSS: ['/css/resources/essential-documentation.css'],
    pageJS: ['/js/resources/essential-documentation.js']
  });
});

/* ========== GET /resources/glossary ========== */
router.get(['/glossary', '/glossary/'], (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('resources/glossary', {
    title: 'Programming Glossary 2026 — Value.Codes | Developer Terms & Definitions',
    description: 'Comprehensive glossary of programming terms, concepts, and jargon. Clear definitions and explanations to help you understand technical vocabulary used in software development.',
    keywords: 'programming glossary, developer terms, coding definitions, tech vocabulary, software development terms, programming jargon, computer science terms, API glossary, developer dictionary 2026',
    canonical: `${siteUrl}/resources/glossary/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Resources', 'item': `${siteUrl}/resources/` },
          { '@type': 'ListItem', 'position': 3, 'name': 'Glossary', 'item': `${siteUrl}/resources/glossary/` }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        'name': 'Programming Glossary',
        'description': 'Comprehensive glossary of programming terms, concepts, and jargon with clear definitions.',
        'url': `${siteUrl}/resources/glossary/`,
        'publisher': { '@type': 'Organization', 'name': 'Value.Codes', 'url': siteUrl }
      }
    ],
    pageCSS: ['/css/resources/glossary.css'],
    pageJS: ['/js/resources/glossary.js']
  });
});

module.exports = router;
