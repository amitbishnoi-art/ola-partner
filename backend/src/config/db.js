/**
 * SQLite Database Connection (using sql.js — pure JavaScript, no native deps)
 *
 * Provides a wrapper with the same API as better-sqlite3:
 *   db.prepare(sql).get(params...)   → single row or undefined
 *   db.prepare(sql).all(params...)   → array of row objects
 *   db.prepare(sql).run(params...)   → { lastInsertRowid, changes }
 *   db.exec(sql)                     → execute raw SQL (DDL, multi-statement)
 *   db.pragma(str)                   → execute PRAGMA
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'showroom.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Module-level database reference (set by initDB)
let _db = null;

/** Persist the in-memory database to disk */
function save() {
  if (!_db) return;
  try {
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

// ─── PreparedStatement (mimics better-sqlite3 API) ───────────
class PreparedStatement {
  constructor(sql) {
    this._sql = sql;
  }

  /** Return a single row object, or undefined if no match */
  get(...params) {
    if (!_db) throw new Error('Database not initialized — call initDB() first');
    let result;
    try {
      const stmt = _db.prepare(this._sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
    } catch (e) {
      console.error('DB get error:', this._sql, e.message);
    }
    return result;
  }

  /** Return an array of row objects */
  all(...params) {
    if (!_db) throw new Error('Database not initialized — call initDB() first');
    const results = [];
    try {
      const stmt = _db.prepare(this._sql);
      if (params.length > 0) stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
    } catch (e) {
      console.error('DB all error:', this._sql, e.message);
    }
    return results;
  }

  /** Execute INSERT / UPDATE / DELETE and return { lastInsertRowid, changes } */
  run(...params) {
    if (!_db) throw new Error('Database not initialized — call initDB() first');
    try {
      if (params.length > 0) {
        _db.run(this._sql, params);
      } else {
        _db.run(this._sql);
      }
      save();
      const idRows = _db.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = idRows.length > 0 && idRows[0].values.length > 0
        ? idRows[0].values[0][0]
        : 0;
      return { lastInsertRowid, changes: _db.getRowsModified() };
    } catch (e) {
      console.error('DB run error:', this._sql, e.message);
      return { lastInsertRowid: 0, changes: 0 };
    }
  }
}

// ─── Public wrapper object ───────────────────────────────────
const wrapper = {
  prepare(sql) {
    return new PreparedStatement(sql);
  },

  exec(sql) {
    if (!_db) throw new Error('Database not initialized — call initDB() first');
    _db.run(sql);
    save();
  },

  pragma(str) {
    if (!_db) return;
    try {
      _db.run('PRAGMA ' + str);
    } catch (e) {
      // Some PRAGMAs (WAL) aren't supported by sql.js — silently ignore
    }
  },

  /** Initialise the database (must be called once before using any other method) */
  async initDB() {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      _db = new SQL.Database(buffer);
    } else {
      _db = new SQL.Database();
    }
    // Enable foreign keys
    try { _db.run('PRAGMA foreign_keys = ON'); } catch (_) {}
    console.log('✅ SQLite database ready (sql.js)');
    return wrapper;
  }
};

module.exports = wrapper;
