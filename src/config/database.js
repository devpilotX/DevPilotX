/**
 * ============================================================
 * Value.Codes — Database Configuration
 * ============================================================
 * Creates and exports a MySQL connection pool using mysql2.
 * Uses promise-based API for async/await support throughout
 * the application. Connection details are loaded from .env.
 * ============================================================
 */

'use strict';

const mysql = require('mysql2/promise');

/* ========== CONNECTION POOL ========== */
/**
 * A pool manages multiple connections efficiently.
 * - connectionLimit: max simultaneous connections (keep low for shared hosting)
 * - waitForConnections: queue requests when pool is full instead of erroring
 * - queueLimit: 0 = unlimited queue (prevents dropped requests)
 * - timezone: UTC ensures consistent date handling
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'value_codes',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4'
});

module.exports = pool;
