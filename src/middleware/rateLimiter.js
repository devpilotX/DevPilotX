/**
 * ============================================================
 * Value.Codes — Rate Limiting Middleware
 * ============================================================
 * Protects API endpoints from abuse using express-rate-limit.
 *
 * IMPORTANT: server.js must have app.set('trust proxy', 1)
 * so req.ip reflects the real client IP when behind nginx.
 * Without trust proxy, ALL users share the same IP (127.0.0.1)
 * and limits are hit immediately.
 *
 * In development (NODE_ENV !== 'production') all rate limiting
 * is skipped so local testing is never blocked.
 * ============================================================
 */

'use strict';

const rateLimit = require('express-rate-limit');

/* ========== DEV BYPASS ========== */
/**
 * Returns true (skip) when not in production.
 * This ensures local development is never blocked by rate limits.
 */
function skipInDev(req) {
  return process.env.NODE_ENV !== 'production';
}

/* ========== GENERAL API LIMITER ========== */
/**
 * Applied to all /api/* routes.
 * 300 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: skipInDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

/* ========== AUTH LIMITER ========== */
/**
 * Applied to login and register routes.
 * Stricter to prevent brute-force attacks.
 * 20 attempts per 15-minute window per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: skipInDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  }
});

/* ========== COMPILER LIMITER ========== */
/**
 * Applied to the compiler execution endpoint.
 * 100 executions per 15-minute window per IP.
 * Skipped entirely in development.
 */
const compilerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: skipInDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit reached (100 runs / 15 min). Please wait a moment and try again.'
  }
});

/* ========== FORM LIMITER ========== */
/**
 * Applied to contact form and newsletter subscription.
 * 10 submissions per 15-minute window per IP.
 * Skipped in development.
 */
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many submissions. Please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  compilerLimiter,
  formLimiter
};
