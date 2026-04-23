/**
 * lib/database.js
 * Single source of truth for the SQLite connection.
 * Applies the full schema via versioned migrations on startup.
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// ── Paths ─────────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'todos.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Connection ────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');   // concurrent reads + writes
db.pragma('foreign_keys  = ON');   // enforce referential integrity
db.pragma('synchronous   = NORMAL'); // safe + fast

// ── Schema Migrations ─────────────────────────────────────────────────────────
// Each migration runs exactly once, tracked by user_version pragma.

const MIGRATIONS = [
  // v1 — core schema
  `
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    color      TEXT    NOT NULL DEFAULT '#6366f1',
    icon       TEXT    NOT NULL DEFAULT 'folder',
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS todos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT,
    completed   INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
    priority    TEXT    NOT NULL DEFAULT 'medium'
                        CHECK(priority IN ('low','medium','high','urgent')),
    status      TEXT    NOT NULL DEFAULT 'todo'
                        CHECK(status IN ('todo','in_progress','done','archived')),
    due_date    TEXT,
    reminder_at TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL DEFAULT '#94a3b8'
  );

  CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (todo_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS subtasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id     INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    completed   INTEGER NOT NULL DEFAULT 0,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id    INTEGER REFERENCES todos(id) ON DELETE SET NULL,
    action     TEXT    NOT NULL,
    meta       TEXT,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE INDEX IF NOT EXISTS idx_todos_category   ON todos(category_id);
  CREATE INDEX IF NOT EXISTS idx_todos_status      ON todos(status);
  CREATE INDEX IF NOT EXISTS idx_todos_priority    ON todos(priority);
  CREATE INDEX IF NOT EXISTS idx_todos_due_date    ON todos(due_date);
  CREATE INDEX IF NOT EXISTS idx_todos_completed   ON todos(completed);
  CREATE INDEX IF NOT EXISTS idx_subtasks_todo     ON subtasks(todo_id);
  CREATE INDEX IF NOT EXISTS idx_activity_todo     ON activity_log(todo_id);
  CREATE INDEX IF NOT EXISTS idx_activity_created  ON activity_log(created_at);

  CREATE TRIGGER IF NOT EXISTS todos_updated_at
    AFTER UPDATE ON todos
    BEGIN
      UPDATE todos SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
      WHERE id = NEW.id;
    END;
  `,
];

function applyMigrations() {
  const currentVersion = db.pragma('user_version', { simple: true });

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    db.exec(MIGRATIONS[i]);
    db.pragma(`user_version = ${i + 1}`);
    console.log(`[DB] Applied migration v${i + 1}`);
  }
}

applyMigrations();

module.exports = db;
