/**
 * lib/repositories/todoRepository.js
 * All SQL for todos lives here. Routes never touch SQL directly.
 */

'use strict';

const db = require('./database');

// ── Internal helpers ──────────────────────────────────────────────────────────

const BASE_SELECT = `
  SELECT
    t.*,
    c.name  AS category_name,
    c.color AS category_color,
    c.icon  AS category_icon,
    (SELECT COUNT(*) FROM subtasks s WHERE s.todo_id = t.id)             AS subtask_total,
    (SELECT COUNT(*) FROM subtasks s WHERE s.todo_id = t.id AND s.completed = 1) AS subtask_done
  FROM todos t
  LEFT JOIN categories c ON c.id = t.category_id
`;

function hydrateTodo(row) {
  if (!row) return null;
  row.completed    = Boolean(row.completed);
  row.subtask_total = row.subtask_total ?? 0;
  row.subtask_done  = row.subtask_done  ?? 0;

  row.tags = db.prepare(`
    SELECT tg.id, tg.name, tg.color
    FROM tags tg
    JOIN todo_tags tt ON tt.tag_id = tg.id
    WHERE tt.todo_id = ?
    ORDER BY tg.name
  `).all(row.id);

  return row;
}

// ── Queries ───────────────────────────────────────────────────────────────────

function findAll({ completed, priority, status, category_id, search, sort, order, tag } = {}) {
  const conditions = ['1=1'];
  const params     = [];

  if (completed !== undefined) {
    conditions.push('t.completed = ?');
    params.push(completed ? 1 : 0);
  }
  if (priority)    { conditions.push('t.priority = ?');    params.push(priority); }
  if (status)      { conditions.push('t.status = ?');      params.push(status); }
  if (category_id) { conditions.push('t.category_id = ?'); params.push(category_id); }
  if (search) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (tag) {
    conditions.push(`t.id IN (
      SELECT tt.todo_id FROM todo_tags tt
      JOIN tags tg ON tg.id = tt.tag_id
      WHERE tg.name = ?
    )`);
    params.push(tag);
  }

  const SORT_COLS = {
    position:   't.position',
    created_at: 't.created_at',
    updated_at: 't.updated_at',
    due_date:   't.due_date',
    title:      't.title',
    priority:   `CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
  };
  const sortCol  = SORT_COLS[sort] || 't.position';
  const sortDir  = order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const sql = `${BASE_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY ${sortCol} ${sortDir}`;
  return db.prepare(sql).all(...params).map(hydrateTodo);
}

function findById(id) {
  const row = db.prepare(`${BASE_SELECT} WHERE t.id = ?`).get(id);
  if (!row) return null;
  row.subtasks = db.prepare(`
    SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position ASC
  `).all(id).map(s => ({ ...s, completed: Boolean(s.completed) }));
  return hydrateTodo(row);
}

function create({ title, description, priority, status, due_date, reminder_at, category_id, tags, position }) {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),0) AS m FROM todos').get().m;
  const pos    = position ?? maxPos + 1;

  const r = db.prepare(`
    INSERT INTO todos (title, description, priority, status, due_date, reminder_at, category_id, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description   ?? null,
    priority      ?? 'medium',
    status        ?? 'todo',
    due_date      ?? null,
    reminder_at   ?? null,
    category_id   ?? null,
    pos,
  );

  const id = r.lastInsertRowid;
  syncTags(id, tags ?? []);
  logActivity(id, 'created', { title });
  return findById(id);
}

function update(id, fields) {
  const todo = findById(id);
  if (!todo) return null;

  const allowed = ['title','description','completed','priority','status','due_date','reminder_at','category_id'];
  const sets    = [];
  const params  = [];

  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      params.push(key === 'completed' ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }

  if (sets.length) {
    params.push(id);
    db.prepare(`UPDATE todos SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  if (fields.tags !== undefined) syncTags(id, fields.tags);

  const changes = Object.keys(fields).filter(k => k !== 'tags');
  if (changes.length) logActivity(id, 'updated', { fields: changes });

  return findById(id);
}

function toggle(id) {
  const todo = db.prepare('SELECT id, completed FROM todos WHERE id = ?').get(id);
  if (!todo) return null;
  const next = todo.completed ? 0 : 1;
  db.prepare('UPDATE todos SET completed = ?, status = ? WHERE id = ?')
    .run(next, next ? 'done' : 'todo', id);
  logActivity(id, next ? 'completed' : 'reopened', null);
  return findById(id);
}

function remove(id) {
  const exists = db.prepare('SELECT id FROM todos WHERE id = ?').get(id);
  if (!exists) return false;
  db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return true;
}

const reorder = db.transaction((ids) => {
  const stmt = db.prepare('UPDATE todos SET position = ? WHERE id = ?');
  ids.forEach((id, idx) => stmt.run(idx, id));
});

// ── Subtasks ──────────────────────────────────────────────────────────────────

function getSubtasks(todoId) {
  return db.prepare('SELECT * FROM subtasks WHERE todo_id = ? ORDER BY position')
    .all(todoId)
    .map(s => ({ ...s, completed: Boolean(s.completed) }));
}

function addSubtask(todoId, { title, position }) {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position),0) AS m FROM subtasks WHERE todo_id = ?').get(todoId).m;
  const r = db.prepare('INSERT INTO subtasks (todo_id, title, position) VALUES (?, ?, ?)')
    .run(todoId, title, position ?? maxPos + 1);
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(r.lastInsertRowid);
}

function updateSubtask(id, { title, completed }) {
  const s = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
  if (!s) return null;
  db.prepare('UPDATE subtasks SET title = ?, completed = ? WHERE id = ?')
    .run(title ?? s.title, completed !== undefined ? (completed ? 1 : 0) : s.completed, id);
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
}

function removeSubtask(id) {
  const s = db.prepare('SELECT id FROM subtasks WHERE id = ?').get(id);
  if (!s) return false;
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
  return true;
}

// ── Internal utils ────────────────────────────────────────────────────────────

function syncTags(todoId, tagNames) {
  db.prepare('DELETE FROM todo_tags WHERE todo_id = ?').run(todoId);
  for (const name of tagNames) {
    const n = name.trim().toLowerCase();
    if (!n) continue;
    db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').run(n);
    const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(n);
    db.prepare('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)').run(todoId, tag.id);
  }
}

function logActivity(todoId, action, meta) {
  db.prepare('INSERT INTO activity_log (todo_id, action, meta) VALUES (?, ?, ?)')
    .run(todoId, action, meta ? JSON.stringify(meta) : null);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function getStats() {
  const overview = db.prepare(`
    SELECT
      COUNT(*)                                                           AS total,
      SUM(completed)                                                     AS completed,
      SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END)                    AS pending,
      SUM(CASE WHEN priority IN ('high','urgent') AND completed=0 THEN 1 ELSE 0 END) AS high_priority,
      SUM(CASE WHEN due_date < date('now') AND completed = 0 THEN 1 ELSE 0 END)      AS overdue,
      SUM(CASE WHEN due_date = date('now') AND completed = 0 THEN 1 ELSE 0 END)      AS due_today
    FROM todos
  `).get();

  const byPriority = db.prepare(`
    SELECT priority,
           COUNT(*) AS total,
           SUM(completed) AS completed
    FROM todos GROUP BY priority
  `).all();

  const byStatus = db.prepare(`
    SELECT status,
           COUNT(*) AS total
    FROM todos GROUP BY status
  `).all();

  const byCategory = db.prepare(`
    SELECT c.id, c.name, c.color, c.icon,
           COUNT(t.id)        AS total,
           SUM(t.completed)   AS completed
    FROM categories c
    LEFT JOIN todos t ON t.category_id = c.id
    GROUP BY c.id ORDER BY total DESC
  `).all();

  const completionTrend = db.prepare(`
    SELECT date(updated_at) AS day, COUNT(*) AS count
    FROM todos
    WHERE completed = 1 AND updated_at >= date('now','-30 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  const recentActivity = db.prepare(`
    SELECT al.id, al.action, al.meta, al.created_at,
           t.title AS todo_title, t.id AS todo_id
    FROM activity_log al
    LEFT JOIN todos t ON t.id = al.todo_id
    ORDER BY al.created_at DESC LIMIT 20
  `).all().map(row => ({
    ...row,
    meta: row.meta ? JSON.parse(row.meta) : null,
  }));

  return {
    overview: { ...overview, completed: overview.completed || 0 },
    byPriority,
    byStatus,
    byCategory,
    completionTrend,
    recentActivity,
  };
}

module.exports = {
  findAll, findById, create, update, toggle, remove, reorder,
  getSubtasks, addSubtask, updateSubtask, removeSubtask,
  getStats,
};
