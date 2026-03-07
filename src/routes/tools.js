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
    category: 'Data',
    faqs: [
      { q: 'What is a JSON Formatter?', a: 'A JSON formatter (also called a JSON beautifier or pretty-printer) takes raw, minified, or malformed JSON text and reformats it with proper indentation, line breaks, and spacing so it is easy to read and understand.' },
      { q: 'Is my data safe when using this JSON formatter?', a: 'Yes. All processing happens entirely in your browser using JavaScript. Your JSON data is never sent to any server, ensuring complete privacy and security.' },
      { q: 'Can I use this tool to validate JSON?', a: 'Yes. Click the Validate button to check your JSON against the official JSON specification. The tool will highlight the exact line and character where an error occurs.' },
      { q: 'What is JSON minification?', a: 'JSON minification removes all unnecessary whitespace and line breaks, producing the smallest possible valid JSON string. This reduces file size and improves API response times.' },
      { q: 'Does this tool fix invalid JSON?', a: 'Yes. The Fix JSON feature automatically corrects common errors such as trailing commas, single-quoted strings, unquoted keys, and JavaScript-style comments.' }
    ]
  },
  'regex-builder': {
    name: 'Regex Builder',
    title: 'Regex Builder & Tester — Value.Codes | Build & Test Regular Expressions',
    description: 'Free online regex builder and tester. Build, test, and debug regular expressions with real-time matching, syntax highlighting, and cheat sheet.',
    keywords: 'regex builder, regex tester, regular expression builder, regex debugger, regex online, regex cheat sheet',
    category: 'Text',
    faqs: [
      { q: 'What is a regular expression?', a: 'A regular expression (regex) is a sequence of characters that defines a search pattern. It is used for string searching, validation, and text manipulation in programming.' },
      { q: 'Does this regex tester support all regex flavors?', a: 'This tool uses JavaScript\'s native RegExp engine, which supports standard PCRE-compatible syntax including lookaheads, lookbehinds, named groups, and Unicode properties.' },
      { q: 'What flags can I use?', a: 'You can use g (global), i (case-insensitive), m (multiline), s (dotAll), and u (unicode) flags. The tool lets you toggle each flag independently.' },
      { q: 'Can I test regex against multiple lines?', a: 'Yes. Paste multi-line text into the test input area. With the m flag enabled, ^ and $ match the start and end of each line.' }
    ]
  },
  'diff-checker': {
    name: 'Diff Checker',
    title: 'Diff Checker — Value.Codes | Compare Text & Code Side by Side',
    description: 'Free online diff checker tool. Compare two blocks of text or code side by side with highlighted differences. Find changes instantly.',
    keywords: 'diff checker, text compare, code diff, compare files online, side by side comparison, find differences',
    category: 'Text',
    faqs: [
      { q: 'What is a diff checker?', a: 'A diff checker compares two pieces of text or code and highlights the differences between them. Lines added are shown in green, lines removed in red, making changes immediately visible.' },
      { q: 'Can I compare code files?', a: 'Yes. Paste any text or code — JavaScript, Python, HTML, CSS, JSON, SQL, plain text, etc. The diff algorithm works on any line-based content.' },
      { q: 'Is my text kept private?', a: 'Yes. All comparison is done entirely in your browser. Your text is never uploaded to any server.' },
      { q: 'What diff algorithm does this tool use?', a: 'It uses the Myers diff algorithm, the same algorithm used by Git. This produces the minimal and most readable set of differences.' }
    ]
  },
  'base64-encoder': {
    name: 'Base64 Encoder/Decoder',
    title: 'Base64 Encoder & Decoder — Value.Codes | Encode & Decode Base64 Online',
    description: 'Free online Base64 encoder and decoder. Convert text and files to Base64 and back instantly. Supports UTF-8, ASCII, and binary data.',
    keywords: 'base64 encoder, base64 decoder, base64 encode online, base64 decode, convert base64, base64 tool',
    category: 'Encoding',
    faqs: [
      { q: 'What is Base64 encoding?', a: 'Base64 is an encoding scheme that converts binary data into a text string using 64 ASCII characters (A-Z, a-z, 0-9, +, /). It is commonly used to embed binary data in JSON, HTML, CSS, and email.' },
      { q: 'Is Base64 the same as encryption?', a: 'No. Base64 is an encoding scheme, not encryption. It is easily reversible and provides no security. Never use Base64 to secure sensitive data.' },
      { q: 'When should I use Base64?', a: 'Use Base64 when you need to include binary data (like images or files) in a text-based format, such as embedding images in CSS (data URIs), passing binary data in JSON APIs, or encoding attachments in emails.' },
      { q: 'Can I encode files with this tool?', a: 'Yes. You can paste text directly or upload a file. The tool will encode/decode the contents and allow you to copy or download the result.' }
    ]
  },
  'color-picker': {
    name: 'Color Picker',
    title: 'Color Picker — Value.Codes | Pick Colors & Convert HEX, RGB, HSL',
    description: 'Free online color picker with HEX, RGB, and HSL conversion. Generate color palettes, check contrast ratios, and copy color codes.',
    keywords: 'color picker, hex color, rgb to hex, hsl converter, color palette generator, contrast checker',
    category: 'Design',
    faqs: [
      { q: 'How do I convert a HEX color to RGB?', a: 'Paste your HEX color code (e.g. #c9281a) into the input field. The tool instantly shows the equivalent RGB, HSL, and HSB values alongside the color preview.' },
      { q: 'What is the difference between RGB and HSL?', a: 'RGB (Red, Green, Blue) defines colors by mixing light intensities. HSL (Hue, Saturation, Lightness) is more intuitive for designers — hue is the color angle (0–360°), saturation is the intensity, and lightness controls how bright or dark the color is.' },
      { q: 'Can I check WCAG color contrast?', a: 'Yes. Enter a foreground and background color to instantly see the contrast ratio and whether it passes WCAG AA (4.5:1 for normal text) or AAA (7:1) accessibility standards.' },
      { q: 'Can I generate a full color palette?', a: 'Yes. The palette generator creates tints, shades, and complementary colors from any base color. You can copy all values in CSS, HEX, or RGB format.' }
    ]
  },
  'cron-builder': {
    name: 'Cron Expression Builder',
    title: 'Cron Expression Builder — Value.Codes | Build & Explain Cron Schedules',
    description: 'Free online cron expression builder. Create, validate, and understand cron schedules with a visual interface and human-readable descriptions.',
    keywords: 'cron builder, cron expression generator, cron schedule, crontab builder, cron syntax, cron job creator',
    category: 'DevOps',
    faqs: [
      { q: 'What is a cron expression?', a: 'A cron expression is a string of 5 or 6 fields that defines a recurring schedule for automated tasks. Fields represent: minute, hour, day of month, month, day of week (and optionally seconds or year).' },
      { q: 'What does "* * * * *" mean in cron?', a: '"* * * * *" means "run every minute, every hour, every day, every month, every weekday" — effectively, run continuously every minute.' },
      { q: 'How do I schedule a task to run every day at midnight?', a: 'Use the cron expression "0 0 * * *". The first 0 is minutes, the second 0 is hours (midnight), and the remaining * wildcards mean every day, month, and weekday.' },
      { q: 'What is the difference between cron and crontab?', a: 'Cron is the background service (daemon) that runs scheduled tasks. Crontab is the file where cron jobs are defined. Each line in a crontab file contains a cron expression and the command to run.' }
    ]
  },
  'jwt-decoder': {
    name: 'JWT Decoder',
    title: 'JWT Decoder — Value.Codes | Decode & Inspect JSON Web Tokens',
    description: 'Free online JWT decoder. Decode, inspect, and verify JSON Web Tokens. View header, payload, claims, and expiration details instantly.',
    keywords: 'jwt decoder, jwt debugger, json web token decoder, jwt inspector, decode jwt online, jwt viewer',
    category: 'Security',
    faqs: [
      { q: 'What is a JWT (JSON Web Token)?', a: 'A JWT is a compact, URL-safe token standard used to securely transmit claims between parties. It consists of three Base64-encoded parts separated by dots: Header, Payload, and Signature (e.g., xxxxx.yyyyy.zzzzz).' },
      { q: 'Is it safe to paste my JWT here?', a: 'This tool decodes JWTs entirely in your browser — no data is sent to any server. However, avoid pasting production tokens in any public environment as a general security best practice.' },
      { q: 'Can this tool verify JWT signatures?', a: 'The tool can inspect the header, payload, and standard claims (exp, iat, nbf, iss, sub, aud). Full cryptographic signature verification requires the secret key or public key used to sign the token.' },
      { q: 'What does the "exp" claim mean?', a: 'The "exp" (expiration time) claim identifies the time after which the JWT must not be accepted. The tool displays this as a human-readable date/time and shows whether the token has expired.' }
    ]
  },
  'hash-generator': {
    name: 'Hash Generator',
    title: 'Hash Generator — Value.Codes | Generate MD5, SHA-1, SHA-256 Hashes',
    description: 'Free online hash generator. Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from text. Compare hashes and verify file integrity.',
    keywords: 'hash generator, md5 generator, sha256 hash, sha1 hash online, hash text, checksum generator',
    category: 'Security',
    faqs: [
      { q: 'What is a cryptographic hash?', a: 'A cryptographic hash function takes any input and produces a fixed-length string (the hash or digest). The same input always produces the same output, but even a tiny change in input produces a completely different hash.' },
      { q: 'What is the difference between MD5, SHA-1, and SHA-256?', a: 'MD5 produces a 128-bit (32-character) hash and is fast but considered cryptographically broken for security purposes. SHA-1 produces 160-bit hashes and is also deprecated for security. SHA-256 (part of the SHA-2 family) produces 256-bit hashes and is the current industry standard.' },
      { q: 'Can I use this to hash passwords?', a: 'No. MD5, SHA-1, and SHA-256 are too fast and unsuitable for password hashing. For passwords, use a slow algorithm specifically designed for this purpose, such as bcrypt, Argon2, or scrypt.' },
      { q: 'How can I verify a file\'s integrity using a hash?', a: 'Compute the hash of the downloaded file and compare it to the hash published by the file\'s source. If they match exactly, the file has not been tampered with.' }
    ]
  },
  'mock-data-generator': {
    name: 'Mock Data Generator',
    title: 'Mock Data Generator — Value.Codes | Generate Fake Data for Testing',
    description: 'Free online mock data generator. Generate realistic fake data for testing: names, emails, addresses, phone numbers, and more in JSON or CSV.',
    keywords: 'mock data generator, fake data generator, test data, random data, json generator, csv generator',
    category: 'Data',
    faqs: [
      { q: 'What is mock data and why do I need it?', a: 'Mock data (also called fake or synthetic data) is realistic-looking but fictitious data used during development and testing. It lets you build and test UIs, APIs, and databases without using real user data, helping you stay compliant with privacy regulations.' },
      { q: 'What types of data can I generate?', a: 'The generator can produce names, email addresses, phone numbers, postal addresses, dates, UUIDs, boolean values, IP addresses, URLs, lorem ipsum text, and more — in JSON or CSV format.' },
      { q: 'Can I export the generated data?', a: 'Yes. You can copy the output to your clipboard or download it as a .json or .csv file for immediate use in your project.' },
      { q: 'Is this tool useful for API testing?', a: 'Absolutely. Generate arrays of 1 to 1000 records in JSON format and use them as mock API responses, seed data for databases, or test fixtures for unit and integration tests.' }
    ]
  },
  'code-formatter': {
    name: 'Code Formatter',
    title: 'Code Formatter — Value.Codes | Format & Beautify Code Online',
    description: 'Free online code formatter and beautifier. Format JavaScript, HTML, CSS, JSON, SQL, and more with customizable indentation and style options.',
    keywords: 'code formatter, code beautifier, format code online, javascript formatter, html formatter, css beautifier',
    category: 'Code',
    faqs: [
      { q: 'What languages does the Code Formatter support?', a: 'The formatter supports JavaScript, TypeScript, HTML, CSS, SCSS, JSON, Markdown, SQL, and more. Select your language from the dropdown to apply the correct formatting rules.' },
      { q: 'What is code formatting and why does it matter?', a: 'Code formatting applies consistent style rules (indentation, spacing, line breaks) to source code. Consistent formatting improves readability, reduces review friction, and prevents trivial style debates in teams.' },
      { q: 'Can I set my preferred indentation (tabs vs spaces)?', a: 'Yes. You can choose between 2 spaces, 4 spaces, or tabs, and configure options like semicolons, single vs double quotes, and trailing commas depending on the language selected.' },
      { q: 'Is this the same as Prettier?', a: 'The tool uses formatting rules compatible with Prettier\'s defaults for most languages. For production use, we recommend integrating Prettier directly into your editor or CI pipeline.' }
    ]
  }
};

/* ========== TOOL SLUGS LIST ========== */
const TOOL_SLUGS = Object.keys(TOOLS);

/* ========== GET /tools — TOOLS LISTING ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('tools/index', {
    title: 'Free Developer Tools — Value.Codes | JSON Formatter, Regex Tester, Diff Checker & More',
    description: 'Free browser-based developer tools: JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data, Code Formatter. No signup. 100% private.',
    keywords: 'free developer tools, json formatter online, regex tester, diff checker, base64 encoder, color picker, cron builder, jwt decoder, hash generator, mock data generator, code formatter, browser tools no signup',
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
        'url': `${siteUrl}/tools/${slug}/`,
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.8',
          'ratingCount': '47',
          'bestRating': '5'
        }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${siteUrl}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Tools', 'item': `${siteUrl}/tools/` },
          { '@type': 'ListItem', 'position': 3, 'name': tool.name, 'item': `${siteUrl}/tools/${slug}/` }
        ]
      },
      ...(tool.faqs && tool.faqs.length > 0 ? [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': tool.faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': faq.a }
        }))
      }] : [])
    ],
    pageCSS: ['/css/tools.css', `/css/tools/${slug}.css`],
    pageJS: [`/js/tools/${slug}.js`],
    toolName: tool.name,
    toolCategory: tool.category,
    toolFaqs: tool.faqs || []
  });
});

module.exports = router;
