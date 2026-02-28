-- ============================================================
-- Value.Codes — Complete MySQL Database Schema
-- ============================================================
-- Run this SQL file against your MySQL database to create
-- all required tables for the Value.Codes platform.
--
-- Hostinger: Import via phpMyAdmin → Import tab → Choose File
-- CLI: mysql -u username -p database_name < schema.sql
-- ============================================================

-- ============================================================
-- CHARACTER SET & COLLATION
-- ============================================================
-- Use utf8mb4 for full Unicode support (emojis, special chars)
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- TABLE: users
-- ============================================================
-- Stores registered user accounts.
-- Passwords are stored as bcrypt hashes (60 chars).
-- is_pro flag determines Pro/Premium subscription status.
-- ============================================================
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

-- ============================================================
-- TABLE: sessions
-- ============================================================
-- Stores server-side session data.
-- Used for persistent session storage across server restarts.
-- session_id is the unique cookie identifier (vc_sid).
-- data stores the serialized session object as JSON.
-- ============================================================
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

-- ============================================================
-- TABLE: messages
-- ============================================================
-- Stores community chat messages.
-- channel identifies the chat room (e.g., "general", "help").
-- Messages are linked to users via user_id foreign key.
-- ============================================================
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

-- ============================================================
-- TABLE: contacts
-- ============================================================
-- Stores contact form submissions from the /contact page.
-- is_read flag helps track which messages have been reviewed.
-- ============================================================
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

-- ============================================================
-- TABLE: subscribers
-- ============================================================
-- Stores newsletter email subscriptions.
-- is_active flag allows users to unsubscribe without deletion.
-- ============================================================
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
