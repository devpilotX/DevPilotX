-- ============================================================
-- Value.Codes — Blog Articles Seed Data
-- ============================================================
-- Run AFTER schema.sql to populate the blog with initial articles.
--
-- Hostinger: phpMyAdmin → Import → Choose File → Import
-- CLI: mysql -u username -p value_codes < seeds/articles-seed.sql
--
-- NOTE: Content fields contain placeholder text.
-- Edit each article in the admin panel (/admin/articles)
-- to add the full article content.
-- The original EJS content is in the delete/ folder for reference.
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT IGNORE INTO categories (name, slug, description) VALUES
  ('Developer Tools',       'developer-tools',       'Tools, IDEs, and productivity software for developers'),
  ('Artificial Intelligence','artificial-intelligence','AI, machine learning, and LLM topics'),
  ('Web Development',       'web-development',       'Frontend, backend, and full-stack web development'),
  ('Cybersecurity',         'cybersecurity',         'Security threats, best practices, and secure coding'),
  ('Backend Architecture',  'backend-architecture',  'Server design, APIs, databases, and distributed systems'),
  ('Infrastructure',        'infrastructure',        'DevOps, cloud, edge computing, and deployment'),
  ('Developer Productivity','developer-productivity','Workflow, AI-assisted coding, and career growth');

-- ============================================================
-- ARTICLES (6 published — 3 low-effort ones excluded)
-- ============================================================

-- 1. GitHub Copilot Workspace
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'GitHub Copilot Workspace: AI Pair Programming Has Entered a New Era',
  'github-copilot-workspace-ai-pair-programming-2025',
  '/images/blog/github-copilot-workspace.jpg',
  'GitHub Copilot Workspace goes beyond code completion — it plans, builds, and tests entire features. Here''s how AI-assisted development is transforming software engineering workflows in 2025.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>github-copilot-workspace-ai-pair-programming-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'developer-tools'),
  'GitHub, Copilot, AI, Developer Tools, Productivity',
  'published',
  'GitHub Copilot Workspace: AI Pair Programming in 2025 — Value.Codes',
  'GitHub Copilot Workspace goes beyond code completion — it plans, builds, and tests entire features. Discover how AI pair programming is transforming development in 2025.',
  '2025-02-15 10:00:00'
);

-- 2. AI-Native Tools Node.js
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'Building Faster: How to Integrate AI-Native Tools into a Node.js and JavaScript Workflow',
  'integrate-ai-native-tools-nodejs-javascript-workflow-2025',
  '/images/blog/ai-native-tools-nodejs.jpg',
  'A practical, no-fluff guide to integrating AI-native tools like GitHub Copilot, ChatGPT API, Codeium, and AI testing frameworks into your Node.js and JavaScript development workflow in 2025.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>integrate-ai-native-tools-nodejs-javascript-workflow-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'developer-tools'),
  'AI, Node.js, JavaScript, Developer Tools, Productivity, Workflow',
  'published',
  'Integrate AI-Native Tools into Node.js Workflow 2025 — Value.Codes',
  'A practical guide to integrating GitHub Copilot, ChatGPT API, Codeium, and AI testing into your Node.js and JavaScript workflow in 2025.',
  '2025-03-01 10:00:00'
);

-- 3. Crypto Dashboard PWA
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'The Offline Wallet: Building a Crypto Dashboard PWA with Node.js, Service Workers, and Real-Time Market Data',
  'offline-wallet-crypto-dashboard-pwa-nodejs-service-workers-2025',
  '/images/blog/crypto-dashboard-pwa.jpg',
  'A deep, practical guide to building a production-grade Progressive Web App crypto dashboard with Node.js. Learn service worker caching strategies, offline-first architecture, IndexedDB storage, and how to deliver an app-like experience that works on spotty connections.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>offline-wallet-crypto-dashboard-pwa-nodejs-service-workers-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'web-development'),
  'PWA, Node.js, Crypto, Service Workers, Offline-First, JavaScript',
  'published',
  'Build a Crypto Dashboard PWA with Node.js & Service Workers 2025 — Value.Codes',
  'Build a production-grade offline-first crypto dashboard PWA with Node.js, service worker caching, and real-time market data.',
  '2025-03-01 14:00:00'
);

-- 4. Beyond REST — Real-Time Crypto API
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'Beyond REST: Architecting a Real-Time Crypto API for Your Frontend with WebSockets, SSE, and Node.js',
  'beyond-rest-architecting-real-time-crypto-api-frontend-websockets-2025',
  '/images/blog/real-time-crypto-api.jpg',
  'A deep, production-grade guide to building a real-time financial data API. Move beyond polling REST endpoints — learn WebSocket architecture, Server-Sent Events, rate-limited upstream aggregation, and how to push live crypto prices to a vanilla HTML/CSS/JS frontend with zero lag.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>beyond-rest-architecting-real-time-crypto-api-frontend-websockets-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'backend-architecture'),
  'API Design, WebSockets, Real-Time, Node.js, Crypto, SSE, Backend',
  'published',
  'Beyond REST: Real-Time Crypto API with WebSockets & Node.js 2025 — Value.Codes',
  'Build a real-time crypto price API using WebSockets and Server-Sent Events with Node.js. Production-grade architecture for live financial data.',
  '2025-03-02 10:00:00'
);

-- 5. Zero to Profit — Edge Computing
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'Zero to Profit: Scaling an Ad-Monetized Tools Site on the Edge — A Full-Stack Developer''s Playbook',
  'zero-to-profit-scaling-ad-monetized-tools-site-edge-computing-2025',
  '/images/blog/edge-computing-ad-monetization.jpg',
  'A brutally honest, deeply technical guide to deploying ad-monetized developer tools on edge infrastructure. Learn how edge computing slashes latency, boosts Core Web Vitals, improves SEO rankings, and directly increases AdSense revenue — with real architecture diagrams and production code.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>zero-to-profit-scaling-ad-monetized-tools-site-edge-computing-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'infrastructure'),
  'Edge Computing, Serverless, AdSense, Performance, SEO, Node.js, Monetization',
  'published',
  'Scale Ad-Monetized Tools Site on Edge Computing 2025 — Value.Codes',
  'Deploy your developer tools site on edge infrastructure to boost Core Web Vitals, SEO, and AdSense revenue. Full-stack developer playbook.',
  '2025-03-01 16:00:00'
);

-- 6. Full Stack Co-Coding with AI
INSERT IGNORE INTO articles
  (title, slug, thumbnail, summary, content, author, category_id, tags,
   status, meta_title, meta_description, published_at)
VALUES (
  'From Blank Canvas to Full Stack: Co-Coding a Node.js Backend with AI — A Developer''s Honest Workflow',
  'from-blank-canvas-to-full-stack-co-coding-nodejs-backend-with-ai-2025',
  '/images/blog/ai-assisted-developer-workflow.jpg',
  'A raw, unfiltered case study of building a production Node.js backend using AI-assisted development. See the real workflow — where AI saves hours, where it fails dangerously, how to architect systems as the human pilot, and why the AI-assisted developer is the most valuable hire in 2025.',
  '<p><em>Full article content coming soon. Please use the admin panel to add the complete article.</em></p><p>The original EJS content is available in the <code>delete/</code> folder: <code>from-blank-canvas-to-full-stack-co-coding-nodejs-backend-with-ai-2025.ejs</code></p>',
  'Dipanshu Kumar',
  (SELECT id FROM categories WHERE slug = 'developer-productivity'),
  'AI, Workflow, Node.js, Productivity, Career, Architecture, Backend',
  'published',
  'Co-Coding Node.js Backend with AI: Developer''s Honest Workflow 2025 — Value.Codes',
  'A raw case study of building a production Node.js backend with AI assistance. Where it saves hours, where it fails, and how to be the human architect.',
  '2025-03-03 10:00:00'
);
