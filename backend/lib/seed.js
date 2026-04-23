/**
 * lib/seed.js
 * Run with: node lib/seed.js
 * Wipes and re-seeds the database with realistic demo data.
 */

'use strict';

const db = require('./database');

console.log('[Seed] Wiping tables…');
db.exec(`
  DELETE FROM activity_log;
  DELETE FROM todo_tags;
  DELETE FROM subtasks;
  DELETE FROM todos;
  DELETE FROM tags;
  DELETE FROM categories;
  DELETE FROM sqlite_sequence WHERE name IN
    ('activity_log','todo_tags','subtasks','todos','tags','categories');
`);

// ── Categories ────────────────────────────────────────────────────────────────

const insertCat = db.prepare(`
  INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)
`);

const cats = [
  ['Personal',  '#6366f1', 'user'],
  ['Work',      '#f59e0b', 'briefcase'],
  ['Shopping',  '#10b981', 'shopping-cart'],
  ['Health',    '#ef4444', 'heart'],
  ['Learning',  '#8b5cf6', 'book-open'],
  ['Finance',   '#0ea5e9', 'dollar-sign'],
].map(([name, color, icon]) => {
  const r = insertCat.run(name, color, icon);
  return { id: r.lastInsertRowid, name, color, icon };
});

// ── Tags ──────────────────────────────────────────────────────────────────────

const insertTag = db.prepare(`INSERT INTO tags (name, color) VALUES (?, ?)`);
const tags = [
  ['urgent',   '#ef4444'],
  ['recurring',  '#f59e0b'],
  ['quick-win',  '#10b981'],
  ['blocked',    '#94a3b8'],
  ['deep-work',  '#6366f1'],
].map(([name, color]) => {
  const r = insertTag.run(name, color);
  return { id: r.lastInsertRowid, name };
});

// ── Todos ─────────────────────────────────────────────────────────────────────

const insertTodo = db.prepare(`
  INSERT INTO todos (title, description, priority, status, due_date, category_id, position)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertSubtask = db.prepare(`
  INSERT INTO subtasks (todo_id, title, completed, position) VALUES (?, ?, ?, ?)
`);
const linkTag = db.prepare(`
  INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)
`);
const logActivity = db.prepare(`
  INSERT INTO activity_log (todo_id, action, meta) VALUES (?, ?, ?)
`);

const today = new Date();
const d = (days) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split('T')[0];
};

const seedTodos = [
  {
    title: 'Finish Q2 project proposal',
    desc: 'Include timeline, resource allocation, and risk assessment sections.',
    priority: 'urgent', status: 'in_progress', due: d(2),
    cat: 'Work', tags: ['urgent', 'deep-work'],
    subtasks: ['Write executive summary', 'Add budget breakdown', 'Review with manager'],
  },
  {
    title: 'Weekly team standup prep',
    desc: 'Prepare blockers list and progress update.',
    priority: 'high', status: 'todo', due: d(1),
    cat: 'Work', tags: ['recurring'],
    subtasks: ['List blockers', 'Summarise progress'],
  },
  {
    title: 'Grocery run',
    desc: 'Milk, eggs, bread, vegetables, coffee.',
    priority: 'medium', status: 'todo', due: d(0),
    cat: 'Shopping', tags: ['quick-win'],
    subtasks: [],
  },
  {
    title: 'Read "Atomic Habits" chapter 5–8',
    desc: null,
    priority: 'low', status: 'todo', due: d(7),
    cat: 'Learning', tags: ['deep-work'],
    subtasks: [],
  },
  {
    title: 'Morning run — 5km',
    desc: 'Aim for sub-30 minutes.',
    priority: 'medium', status: 'done', due: d(-1),
    cat: 'Health', tags: ['recurring'],
    subtasks: [],
  },
  {
    title: 'Pay electricity bill',
    desc: 'Due by end of month.',
    priority: 'high', status: 'todo', due: d(5),
    cat: 'Finance', tags: ['urgent'],
    subtasks: [],
  },
  {
    title: 'Call dentist for appointment',
    desc: null,
    priority: 'medium', status: 'todo', due: d(3),
    cat: 'Health', tags: ['quick-win'],
    subtasks: [],
  },
  {
    title: 'Set up home office ergonomics',
    desc: 'New monitor stand, keyboard tray, and cable management.',
    priority: 'low', status: 'todo', due: d(14),
    cat: 'Personal', tags: [],
    subtasks: ['Buy monitor stand', 'Order keyboard tray', 'Route cables'],
  },
  {
    title: 'Complete online SQL course',
    desc: 'Finish modules 4–7 on advanced queries.',
    priority: 'medium', status: 'in_progress', due: d(10),
    cat: 'Learning', tags: ['deep-work'],
    subtasks: ['Module 4: Joins', 'Module 5: Subqueries', 'Module 6: Indexes'],
  },
  {
    title: 'Review monthly budget',
    desc: 'Compare actual vs planned spend.',
    priority: 'high', status: 'todo', due: d(-2),
    cat: 'Finance', tags: ['blocked'],
    subtasks: [],
  },
];

const catMap  = Object.fromEntries(cats.map(c  => [c.name, c.id]));
const tagMap  = Object.fromEntries(tags.map(t  => [t.name, t.id]));

seedTodos.forEach(({ title, desc, priority, status, due, cat, tags: tNames, subtasks }, i) => {
  const completed = status === 'done' ? 1 : 0;
  const r = insertTodo.run(title, desc, priority, status, due, catMap[cat], i);
  const todoId = r.lastInsertRowid;

  if (completed) {
    db.prepare(`UPDATE todos SET completed = 1 WHERE id = ?`).run(todoId);
  }

  tNames.forEach(t => { if (tagMap[t]) linkTag.run(todoId, tagMap[t]); });

  subtasks.forEach((st, j) => insertSubtask.run(todoId, st, 0, j));

  logActivity.run(todoId, 'created', JSON.stringify({ title }));
  if (completed) logActivity.run(todoId, 'completed', null);
});

console.log(`[Seed] Done — ${seedTodos.length} todos, ${cats.length} categories, ${tags.length} tags.`);
