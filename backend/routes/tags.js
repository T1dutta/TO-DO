/**
 * routes/tags.js
 */

'use strict';

const express = require('express');
const db      = require('../lib/database');
const { ok, noContent, NotFoundError } = require('../lib/response');

const router = express.Router();

router.get('/', (req, res) => {
  const tags = db.prepare(`
    SELECT t.id, t.name, t.color, COUNT(tt.todo_id) AS usage_count
    FROM tags t
    LEFT JOIN todo_tags tt ON tt.tag_id = t.id
    GROUP BY t.id ORDER BY usage_count DESC, t.name ASC
  `).all();
  ok(res, tags);
});

router.delete('/:id', (req, res) => {
  const tag = db.prepare('SELECT id FROM tags WHERE id = ?').get(req.params.id);
  if (!tag) throw new NotFoundError('Tag');
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  noContent(res);
});

module.exports = router;
