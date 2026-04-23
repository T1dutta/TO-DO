/**
 * middleware/validate.js
 * Runs express-validator checks and returns structured errors.
 */

'use strict';

const { validationResult, body, param, query } = require('express-validator');
const { ValidationError } = require('../lib/response');

// ── Runner ────────────────────────────────────────────────────────────────────

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const err = new ValidationError('Validation failed', result.array());
    return next(err);
  }
  next();
}

// ── Rule Sets ─────────────────────────────────────────────────────────────────

const rules = {
  todoCreate: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
    body('due_date').optional({ nullable: true }).isISO8601().withMessage('due_date must be ISO8601'),
    body('reminder_at').optional({ nullable: true }).isISO8601(),
    body('category_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString().trim().notEmpty().isLength({ max: 50 }),
  ],

  todoUpdate: [
    param('id').isInt({ min: 1 }).withMessage('Invalid todo id'),
    body('title').optional().trim().notEmpty().isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }),
    body('completed').optional().isBoolean(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
    body('due_date').optional({ nullable: true }).isISO8601(),
    body('reminder_at').optional({ nullable: true }).isISO8601(),
    body('category_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('tags').optional().isArray(),
    body('tags.*').optional().isString().trim().notEmpty().isLength({ max: 50 }),
  ],

  idParam: [
    param('id').isInt({ min: 1 }).withMessage('Invalid id'),
  ],

  reorder: [
    body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
    body('ids.*').isInt({ min: 1 }),
  ],

  subtaskCreate: [
    param('id').isInt({ min: 1 }),
    body('title').trim().notEmpty().isLength({ max: 255 }),
  ],

  todoFilters: [
    query('completed').optional().isBoolean(),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('status').optional().isIn(['todo', 'in_progress', 'done', 'archived']),
    query('category_id').optional().isInt({ min: 1 }),
    query('search').optional().isString().trim().isLength({ max: 200 }),
    query('sort').optional().isIn(['position', 'created_at', 'updated_at', 'due_date', 'title', 'priority']),
    query('order').optional().isIn(['asc', 'desc']),
    query('tag').optional().isString().trim(),
  ],

  categoryCreate: [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/),
    body('icon').optional().isString().trim().isLength({ max: 50 }),
  ],

  categoryUpdate: [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('color').optional().matches(/^#[0-9a-fA-F]{6}$/),
    body('icon').optional().isString().trim().isLength({ max: 50 }),
  ],
};

module.exports = { validate, rules };
