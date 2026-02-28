/**
 * ============================================================
 * Value.Codes — Shared Utility Functions
 * ============================================================
 * Reusable helper functions used across routes and middleware.
 * ============================================================
 */

'use strict';

/* ========== SANITIZE INPUT ========== */
/**
 * Strips HTML tags from a string to prevent XSS.
 * Used as an extra safety layer beyond express-validator.
 * @param {string} str — Raw input string
 * @returns {string} — Sanitized string with HTML tags removed
 */
function stripTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/* ========== TRUNCATE TEXT ========== */
/**
 * Truncates a string to a maximum length and appends an ellipsis.
 * Useful for meta descriptions, preview snippets, etc.
 * @param {string} str — Input string
 * @param {number} maxLength — Maximum character count (default 160)
 * @returns {string} — Truncated string
 */
function truncate(str, maxLength = 160) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength).trimEnd() + '...';
}

/* ========== SLUGIFY ========== */
/**
 * Converts a string to a URL-safe slug.
 * @param {string} str — Input string
 * @returns {string} — URL-safe slug
 */
function slugify(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ========== FORMAT DATE ========== */
/**
 * Formats a Date object to a human-readable string.
 * @param {Date} date — Date object
 * @returns {string} — Formatted date (e.g., "January 15, 2025")
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/* ========== FORMAT RELATIVE TIME ========== */
/**
 * Returns a relative time string (e.g., "3 hours ago", "2 days ago").
 * Useful for community chat timestamps, blog dates, etc.
 * @param {Date} date — Date object
 * @returns {string} — Relative time string
 */
function timeAgo(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/* ========== ESCAPE HTML ========== */
/**
 * Escapes HTML special characters in a string.
 * Prevents XSS when rendering user-generated content.
 * @param {string} str — Raw string
 * @returns {string} — HTML-safe string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return str.replace(/[&<>"']/g, ch => map[ch]);
}

/* ========== GENERATE RANDOM ID ========== */
/**
 * Generates a random alphanumeric string for use as a unique identifier.
 * @param {number} length — Desired length (default 12)
 * @returns {string} — Random alphanumeric string
 */
function randomId(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ========== EXPORTS ========== */
module.exports = {
  stripTags,
  truncate,
  slugify,
  formatDate,
  timeAgo,
  escapeHtml,
  randomId
};
