SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username    VARCHAR(30)     NOT NULL,
  email       VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  is_pro      TINYINT(1)     NOT NULL DEFAULT 0,
  avatar      VARCHAR(500)   DEFAULT NULL,
  bio         TEXT           DEFAULT NULL,
  website     VARCHAR(500)   DEFAULT NULL,
  location    VARCHAR(100)   DEFAULT NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  session_id  VARCHAR(255)    NOT NULL,
  user_id     INT UNSIGNED   DEFAULT NULL,
  data        JSON           DEFAULT NULL,
  expires_at  DATETIME       NOT NULL,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_sid (session_id),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED    NOT NULL,
  channel     VARCHAR(50)     NOT NULL DEFAULT 'general',
  content     TEXT            NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_channel (channel, created_at),
  KEY idx_messages_user (user_id),
  CONSTRAINT fk_messages_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contacts (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  email       VARCHAR(255)    NOT NULL,
  subject     VARCHAR(200)    NOT NULL,
  message     TEXT            NOT NULL,
  is_read     TINYINT(1)     NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contacts_read (is_read, created_at),
  KEY idx_contacts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscribers (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255)    NOT NULL,
  is_active     TINYINT(1)     NOT NULL DEFAULT 1,
  subscribed_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscribers_email (email),
  KEY idx_subscribers_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          INT             NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  slug        VARCHAR(100)    NOT NULL,
  description VARCHAR(500)    DEFAULT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id               INT             NOT NULL AUTO_INCREMENT,
  title            VARCHAR(255)    NOT NULL,
  slug             VARCHAR(255)    NOT NULL,
  thumbnail        VARCHAR(500)    DEFAULT NULL,
  summary          TEXT            DEFAULT NULL,
  content          LONGTEXT        NOT NULL,
  author           VARCHAR(100)    NOT NULL DEFAULT 'Dipanshu Kumar',
  category_id      INT             DEFAULT NULL,
  tags             VARCHAR(500)    DEFAULT NULL,
  status           ENUM('draft','published') NOT NULL DEFAULT 'draft',
  meta_title       VARCHAR(255)    DEFAULT NULL,
  meta_description TEXT            DEFAULT NULL,
  views            INT UNSIGNED    NOT NULL DEFAULT 0,
  published_at     DATETIME        DEFAULT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_articles_slug (slug),
  KEY idx_articles_status (status, published_at),
  KEY idx_articles_category (category_id),
  KEY idx_articles_created (created_at),
  CONSTRAINT fk_articles_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SNIPPET SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS snippet_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  emoji VARCHAR(10) DEFAULT NULL,
  description TEXT,
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS snippets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  browser_support VARCHAR(255) DEFAULT NULL,
  notes JSON DEFAULT NULL,
  related_slugs JSON DEFAULT NULL,
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_description VARCHAR(300) DEFAULT NULL,
  seo_keywords VARCHAR(500) DEFAULT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  sort_order INT UNSIGNED DEFAULT 0,
  views INT UNSIGNED DEFAULT 0,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES snippet_categories(id) ON DELETE CASCADE,
  INDEX idx_category_status (category_id, status, sort_order),
  INDEX idx_status_sort (status, sort_order),
  FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS snippet_tabs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  snippet_id INT UNSIGNED NOT NULL,
  label VARCHAR(100) NOT NULL,
  language VARCHAR(50) NOT NULL,
  file_name VARCHAR(100) DEFAULT NULL,
  code MEDIUMTEXT NOT NULL,
  sort_order INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
  INDEX idx_snippet_sort (snippet_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS snippet_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS snippet_tag_map (
  snippet_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (snippet_id, tag_id),
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES snippet_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO snippet_categories (slug, name, emoji, description, sort_order) VALUES
  ('css-ui', 'CSS & UI', '🎨', 'Design essentials — styling problems developers constantly Google.', 1),
  ('vanilla-js', 'Vanilla JavaScript', '⚡', 'Utility functions to avoid importing massive libraries like Lodash.', 2),
  ('node-backend', 'Node.js & Backend', '⚙️', 'Building blocks for modern web app backends.', 3),
  ('react-hooks', 'React Hooks', '⚛️', 'Custom hooks to keep your React components clean.', 4),
  ('devops-config', 'DevOps & Config', '🛠️', 'Copy-paste configuration file templates.', 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO snippet_tags (name, slug) VALUES
  ('css', 'css'),
  ('flexbox', 'flexbox'),
  ('grid', 'grid'),
  ('layout', 'layout'),
  ('animation', 'animation'),
  ('responsive', 'responsive'),
  ('javascript', 'javascript'),
  ('react', 'react'),
  ('node', 'node'),
  ('express', 'express'),
  ('mongodb', 'mongodb'),
  ('api', 'api'),
  ('docker', 'docker'),
  ('nginx', 'nginx'),
  ('github-actions', 'github-actions'),
  ('form', 'form'),
  ('ui', 'ui'),
  ('ux', 'ux'),
  ('scrollbar', 'scrollbar'),
  ('loading', 'loading'),
  ('accessibility', 'accessibility'),
  ('seo', 'seo'),
  ('authentication', 'authentication'),
  ('security', 'security'),
  ('database', 'database'),
  ('hooks', 'hooks'),
  ('middleware', 'middleware'),
  ('centering', 'centering'),
  ('text', 'text'),
  ('skeleton', 'skeleton'),
  ('glassmorphism', 'glassmorphism'),
  ('sticky', 'sticky'),
  ('smooth-scroll', 'smooth-scroll')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- PUBLIC API DIRECTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS api_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  emoji VARCHAR(10) DEFAULT NULL,
  description TEXT,
  sort_order INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS apis (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  docs_url VARCHAR(500) DEFAULT NULL,
  base_url VARCHAR(500) DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  auth_type ENUM('none', 'api_key', 'oauth', 'bearer_token') DEFAULT 'none',
  cors_support ENUM('yes', 'no', 'unknown') DEFAULT 'unknown',
  https_support TINYINT(1) DEFAULT 1,
  rate_limit VARCHAR(100) DEFAULT NULL,
  pricing ENUM('free', 'freemium', 'paid') DEFAULT 'free',
  endpoints JSON DEFAULT NULL,
  sample_response MEDIUMTEXT DEFAULT NULL,
  sample_response_language VARCHAR(20) DEFAULT 'json',
  features JSON DEFAULT NULL,
  use_cases JSON DEFAULT NULL,
  notes JSON DEFAULT NULL,
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_description VARCHAR(300) DEFAULT NULL,
  seo_keywords VARCHAR(500) DEFAULT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT UNSIGNED DEFAULT 0,
  views INT UNSIGNED DEFAULT 0,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES api_categories(id) ON DELETE CASCADE,
  INDEX idx_category_status (category_id, status, sort_order),
  INDEX idx_status_featured (status, is_featured, sort_order),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_tag_map (
  api_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (api_id, tag_id),
  FOREIGN KEY (api_id) REFERENCES apis(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES api_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO api_categories (slug, name, emoji, description, sort_order) VALUES
  ('finance', 'Finance & Banking', '💰', 'Stock prices, exchange rates, and financial data APIs.', 1),
  ('cryptocurrency', 'Cryptocurrency', '₿', 'Real-time crypto prices, blockchain data, and market info.', 2),
  ('weather', 'Weather & Climate', '🌤️', 'Current weather, forecasts, and historical climate data.', 3),
  ('mock-data', 'Mock & Test Data', '🧪', 'Fake users, products, and placeholder data for prototyping.', 4),
  ('ai-ml', 'AI & Machine Learning', '🤖', 'Text generation, image recognition, NLP, and AI-powered APIs.', 5),
  ('entertainment', 'Entertainment & Media', '🎬', 'Movies, music, games, and entertainment data.', 6),
  ('news', 'News & Media', '📰', 'Headlines, articles, and news aggregation APIs.', 7),
  ('geolocation', 'Geolocation & Maps', '🗺️', 'IP lookup, geocoding, and mapping APIs.', 8),
  ('social', 'Social & Communication', '💬', 'Social media data, messaging, and communication APIs.', 9),
  ('sports', 'Sports & Fitness', '⚽', 'Live scores, player stats, and sports data APIs.', 10),
  ('images-media', 'Images & Media', '📸', 'Stock photos, image manipulation, and media hosting APIs.', 11),
  ('dev-tools', 'Developer Tools', '🔧', 'GitHub data, code execution, URL shorteners, and developer utilities.', 12),
  ('food-nutrition', 'Food & Nutrition', '🍕', 'Recipes, nutrition facts, and food database APIs.', 13),
  ('government', 'Government & Open Data', '🏛️', 'Public datasets, census data, and government APIs.', 14),
  ('science', 'Science & Space', '🚀', 'NASA, astronomy, physics, and science data APIs.', 15)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO api_tags (name, slug) VALUES
  ('free', 'free'),
  ('no-auth', 'no-auth'),
  ('api-key', 'api-key'),
  ('oauth', 'oauth'),
  ('cors', 'cors'),
  ('rest', 'rest'),
  ('graphql', 'graphql'),
  ('websocket', 'websocket'),
  ('json', 'json'),
  ('xml', 'xml'),
  ('real-time', 'real-time'),
  ('historical-data', 'historical-data'),
  ('rate-limited', 'rate-limited'),
  ('unlimited', 'unlimited'),
  ('beginner-friendly', 'beginner-friendly'),
  ('portfolio-project', 'portfolio-project'),
  ('https', 'https'),
  ('open-source', 'open-source'),
  ('mock-data', 'mock-data'),
  ('placeholder', 'placeholder'),
  ('machine-learning', 'machine-learning'),
  ('nlp', 'nlp'),
  ('image-recognition', 'image-recognition'),
  ('text-generation', 'text-generation'),
  ('blockchain', 'blockchain'),
  ('exchange-rates', 'exchange-rates'),
  ('stocks', 'stocks'),
  ('forex', 'forex'),
  ('geocoding', 'geocoding'),
  ('ip-lookup', 'ip-lookup')
ON DUPLICATE KEY UPDATE name = VALUES(name);