/**
 * routes/todos.js
 */

'use strict';

const express = require('express');
const repo    = require('../lib/todoRepository');
const { validate, rules }  = require('../middleware/validate');
const { ok, created, noContent, NotFoundError } = require('../lib/response');

const router = express.Router();

// GET /api/todos
router.get('/', rules.todoFilters, validate, (req, res) => {
  const { completed, priority, status, category_id, search, sort, order, tag } = req.query;
  const todos = repo.findAll({
    completed: completed !== undefined ? completed === 'true' : undefined,
    priority, status,
    category_id: category_id ? Number(category_id) : undefined,
    search, sort, order, tag,
  });
  const stats = repo.getStats().overview;
  ok(res, { todos, meta: { count: todos.length, stats } });
});

// GET /api/todos/stats
router.get('/stats', (req, res) => {
  ok(res, repo.getStats());
});

// GET /api/todos/:id
router.get('/:id', rules.idParam, validate, (req, res) => {
  const todo = repo.findById(Number(req.params.id));
  if (!todo) throw new NotFoundError('Todo');
  ok(res, todo);
});

// POST /api/todos
router.post('/', rules.todoCreate, validate, (req, res) => {
  const todo = repo.create(req.body);
  created(res, todo);
});

// PATCH /api/todos/:id
router.patch('/:id', rules.todoUpdate, validate, (req, res) => {
  const todo = repo.update(Number(req.params.id), req.body);
  if (!todo) throw new NotFoundError('Todo');
  ok(res, todo);
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', rules.idParam, validate, (req, res) => {
  const todo = repo.toggle(Number(req.params.id));
  if (!todo) throw new NotFoundError('Todo');
  ok(res, todo);
});

// DELETE /api/todos/:id
router.delete('/:id', rules.idParam, validate, (req, res) => {
  const deleted = repo.remove(Number(req.params.id));
  if (!deleted) throw new NotFoundError('Todo');
  noContent(res);
});

// POST /api/todos/reorder
router.post('/reorder', rules.reorder, validate, (req, res) => {
  repo.reorder(req.body.ids);
  ok(res, { message: 'Order updated' });
});

// ── Subtasks ──────────────────────────────────────────────────────────────────

// GET /api/todos/:id/subtasks
router.get('/:id/subtasks', rules.idParam, validate, (req, res) => {
  const id = Number(req.params.id);
  if (!repo.findById(id)) throw new NotFoundError('Todo');
  ok(res, repo.getSubtasks(id));
});

// POST /api/todos/:id/subtasks
router.post('/:id/subtasks', rules.subtaskCreate, validate, (req, res) => {
  const id = Number(req.params.id);
  if (!repo.findById(id)) throw new NotFoundError('Todo');
  const sub = repo.addSubtask(id, req.body);
  created(res, sub);
});

// PATCH /api/todos/:todoId/subtasks/:subId
router.patch('/:todoId/subtasks/:subId', (req, res) => {
  const sub = repo.updateSubtask(Number(req.params.subId), req.body);
  if (!sub) throw new NotFoundError('Subtask');
  ok(res, sub);
});

// DELETE /api/todos/:todoId/subtasks/:subId
router.delete('/:todoId/subtasks/:subId', (req, res) => {
  const deleted = repo.removeSubtask(Number(req.params.subId));
  if (!deleted) throw new NotFoundError('Subtask');
  noContent(res);
});

module.exports = router;
