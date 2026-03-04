/**
 * ============================================================
 * Value.Codes — Tools Routes
 * ============================================================
 * GET /tools — Tools listing page
 * GET /tools/:tool — Individual tool pages
 * Each tool gets unique SEO data, structured data (SoftwareApplication),
 * and its own CSS/JS files for tool-specific functionality.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== TOOL DEFINITIONS ========== */
/**
 * Central registry of all tools with their SEO data.
 * Each tool slug maps to its metadata for rendering.
 */
const TOOLS = {
  'json-formatter': {
    name: 'JSON Formatter',
    title: 'JSON Formatter & Validator — Value.Codes | Format, Validate & Beautify JSON',
    description: 'Free online JSON formatter and validator. Beautify, minify, and validate JSON data instantly in your browser. No data sent to servers.',
    keywords: 'json formatter, json validator, json beautifier, json minifier, format json online, pretty print json',
    category: 'Data'
  },
  'regex-builder': {
    name: 'Regex Builder',
    title: 'Regex Builder & Tester — Value.Codes | Build & Test Regular Expressions',
    description: 'Free online regex builder and tester. Build, test, and debug regular expressions with real-time matching, syntax highlighting, and cheat sheet.',
    keywords: 'regex builder, regex tester, regular expression builder, regex debugger, regex online, regex cheat sheet',
    category: 'Text'
  },
  'diff-checker': {
    name: 'Diff Checker',
    title: 'Diff Checker — Value.Codes | Compare Text & Code Side by Side',
    description: 'Free online diff checker tool. Compare two blocks of text or code side by side with highlighted differences. Find changes instantly.',
    keywords: 'diff checker, text compare, code diff, compare files online, side by side comparison, find differences',
    category: 'Text'
  },
  'base64-encoder': {
    name: 'Base64 Encoder/Decoder',
    title: 'Base64 Encoder & Decoder — Value.Codes | Encode & Decode Base64 Online',
    description: 'Free online Base64 encoder and decoder. Convert text and files to Base64 and back instantly. Supports UTF-8, ASCII, and binary data.',
    keywords: 'base64 encoder, base64 decoder, base64 encode online, base64 decode, convert base64, base64 tool',
    category: 'Encoding'
  },
  'color-picker': {
    name: 'Color Picker',
    title: 'Color Picker — Value.Codes | Pick Colors & Convert HEX, RGB, HSL',
    description: 'Free online color picker with HEX, RGB, and HSL conversion. Generate color palettes, check contrast ratios, and copy color codes.',
    keywords: 'color picker, hex color, rgb to hex, hsl converter, color palette generator, contrast checker',
    category: 'Design'
  },
  'cron-builder': {
    name: 'Cron Expression Builder',
    title: 'Cron Expression Builder — Value.Codes | Build & Explain Cron Schedules',
    description: 'Free online cron expression builder. Create, validate, and understand cron schedules with a visual interface and human-readable descriptions.',
    keywords: 'cron builder, cron expression generator, cron schedule, crontab builder, cron syntax, cron job creator',
    category: 'DevOps'
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    title: 'JWT Decoder — Value.Codes | Decode & Inspect JSON Web Tokens',
    description: 'Free online JWT decoder. Decode, inspect, and verify JSON Web Tokens. View header, payload, claims, and expiration details instantly.',
    keywords: 'jwt decoder, jwt debugger, json web token decoder, jwt inspector, decode jwt online, jwt viewer',
    category: 'Security'
  },
  'hash-generator': {
    name: 'Hash Generator',
    title: 'Hash Generator — Value.Codes | Generate MD5, SHA-1, SHA-256 Hashes',
    description: 'Free online hash generator. Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text. Compare hashes and verify file integrity.',
    keywords: 'hash generator, md5 generator, sha256 hash, sha1 hash online, hash text, checksum generator',
    category: 'Security'
  },
  'mock-data-generator': {
    name: 'Mock Data Generator',
    title: 'Mock Data Generator — Value.Codes | Generate Fake Data for Testing',
    description: 'Free online mock data generator. Generate realistic fake data for testing: names, emails, addresses, phone numbers, and more in JSON or CSV.',
    keywords: 'mock data generator, fake data generator, test data, random data, json generator, csv generator',
    category: 'Data'
  },
  'code-formatter': {
    name: 'Code Formatter',
    title: 'Code Formatter — Value.Codes | Format & Beautify Code Online',
    description: 'Free online code formatter and beautifier. Format JavaScript, HTML, CSS, JSON, SQL, and more with customizable indentation and style options.',
    keywords: 'code formatter, code beautifier, format code online, javascript formatter, html formatter, css beautifier',
    category: 'Code'
  }
};

/* ========== TOOL SLUGS LIST ========== */
const TOOL_SLUGS = Object.keys(TOOLS);

/* ========== GET /tools — TOOLS LISTING ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('tools/index', {
    title: 'Free Developer Tools — Value.Codes | 10 Browser-Based Coding Tools',
    description: 'Explore 10 free browser-based developer tools: JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, and more. No signup required.',
    keywords: 'free developer tools, online coding tools, browser tools, web developer utilities, programming tools',
    canonical: `${siteUrl}/tools/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Free Developer Tools',
        'description': 'Collection of 10 free browser-based developer tools.',
        'url': `${siteUrl}/tools/`,
        'isPartOf': { '@type': 'WebSite', 'name': 'Value.Codes', 'url': siteUrl }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': `${siteUrl}/tools/` }
        ]
      }
    ],
    pageCSS: ['/css/tools.css'],
    pageJS: ['/js/tools.js'],
    tools: TOOLS,
    toolSlugs: TOOL_SLUGS
  });
});

/* ========== GET /tools/:tool — INDIVIDUAL TOOL PAGES ========== */
router.get('/:tool', (req, res, next) => {
  const slug = req.params.tool;
  const tool = TOOLS[slug];

  /* If tool does not exist, pass to 404 handler */
  if (!tool) {
    return next();
  }

  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render(`tools/${slug}`, {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    canonical: `${siteUrl}/tools/${slug}/`,
    robots: 'index, follow',
    ogType: 'website',
    ogImage: `${siteUrl}/images/og-image.svg`,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': tool.name,
        'description': tool.description,
        'url': `${siteUrl}/tools/${slug}`,
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': siteUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': `${siteUrl}/tools/` },
          { '@type': 'ListItem', 'position': 3, 'name': tool.name, 'item': `${siteUrl}/tools/${slug}` }
        ]
      }
    ],
    pageCSS: ['/css/tools.css', `/css/tools/${slug}.css`],
    pageJS: [`/js/tools/${slug}.js`],
    toolName: tool.name,
    toolCategory: tool.category
  });
});

module.exports = router;
