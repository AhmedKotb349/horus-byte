const mysql = require('mysql2');

const useSsl = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpass',
  database: process.env.DB_NAME || 'uhis_portal',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
