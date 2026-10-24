const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

let mysqlPool = null;
let sqliteDb = null;
let activeEngine = 'pending'; // 'mysql' | 'sqlite'
let initPromise = null; // Singleton guard

/**
 * Initialize connection - attempts MySQL first, falls back to SQLite gracefully
 * Uses singleton pattern: multiple calls return the same promise.
 */
async function initDatabase(forceEngine = null) {
  // Return existing connection if already initialized
  if (activeEngine !== 'pending') return activeEngine;
  if (initPromise) return initPromise;

  initPromise = _doInit(forceEngine);
  return initPromise;
}

async function _doInit(forceEngine) {
  if (forceEngine === 'sqlite' || process.env.DB_ENGINE === 'sqlite' || process.env.NODE_ENV === 'test') {
    return _initSqlite();
  }

  // Attempt MySQL
  try {
    const testConn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      connectTimeout: 2000
    });

    await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await testConn.end();

    mysqlPool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    const [rows] = await mysqlPool.query('SELECT 1 as isAlive');
    if (rows && rows[0] && rows[0].isAlive === 1) {
      activeEngine = 'mysql';
      console.log(`[StyleMate DB] Connected to MySQL (${config.db.host}:${config.db.port}/${config.db.database})`);
      return activeEngine;
    }
  } catch (err) {
    console.warn(`[StyleMate DB] MySQL unavailable (${err.message}). Using SQLite.`);
  }

  return _initSqlite();
}

function _initSqlite() {
  return new Promise((resolve, reject) => {
    const sqlitePath = process.env.NODE_ENV === 'test'
      ? ':memory:'
      : path.resolve(__dirname, '../../stylemate.sqlite');

    sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
      if (err) {
        console.error('[StyleMate DB] SQLite init error:', err);
        return reject(err);
      }
      // Enable foreign keys for SQLite
      sqliteDb.run('PRAGMA foreign_keys = ON;', () => {
        activeEngine = 'sqlite';
        console.log(`[StyleMate DB] Running with SQLite (${sqlitePath})`);
        resolve(activeEngine);
      });
    });
  });
}

/**
 * Execute query supporting both MySQL and SQLite
 */
async function query(sql, params = []) {
  if (activeEngine === 'pending') {
    await initDatabase();
  }

  if (activeEngine === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }

  // SQLite execution
  return new Promise((resolve, reject) => {
    const trimmed = sql.trim();
    const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');

    if (isSelect) {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    } else {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({
          affectedRows: this.changes,
          insertId: this.lastID,
          changes: this.changes
        });
      });
    }
  });
}

async function closePool() {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  if (sqliteDb) {
    await new Promise((resolve) => sqliteDb.close(resolve));
    sqliteDb = null;
  }
  activeEngine = 'pending';
  initPromise = null;
}

function getEngine() {
  return activeEngine;
}

module.exports = {
  initDatabase,
  query,
  closePool,
  getEngine
};
