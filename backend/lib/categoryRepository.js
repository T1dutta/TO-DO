/**
 * lib/categoryRepository.js
 */

'use strict';

const db = require('./database');

function findAll() {
  return db.prepare(`
    SELECT c.*, COUNT(t.id) AS todo_count,
           SUM(t.completed) AS completed_count
    FROM categories c
    LEFT JOIN todos t ON t.category_id = c.id
    GROUP BY c.id ORDER BY c.name ASC
  `).all();
}

function findById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) || null;
}

function create({ name, color, icon }) {
  const r = db.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)')
    .run(name, color ?? '#6366f1', icon ?? 'folder');
  return findById(r.lastInsertRowid);
}

function update(id, { name, color, icon }) {
  const cat = findById(id);
  if (!cat) return null;
  db.prepare('UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ?')
    .run(name ?? cat.name, color ?? cat.color, icon ?? cat.icon, id);
  return findById(id);
}

function remove(id) {
  const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!exists) return false;
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
