/**
 * routes/categories.js
 */

'use strict';

const express  = require('express');
const repo     = require('../lib/categoryRepository');
const { validate, rules } = require('../middleware/validate');
const { ok, created, noContent, NotFoundError, ConflictError } = require('../lib/response');

const router = express.Router();

router.get('/', (req, res) => ok(res, repo.findAll()));

router.get('/:id', rules.idParam, validate, (req, res) => {
  const cat = repo.findById(Number(req.params.id));
  if (!cat) throw new NotFoundError('Category');
  ok(res, cat);
});

router.post('/', rules.categoryCreate, validate, (req, res) => {
  try {
    const cat = repo.create(req.body);
    created(res, cat);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) throw new ConflictError('Category name already exists');
    throw e;
  }
});

router.patch('/:id', rules.categoryUpdate, validate, (req, res) => {
  try {
    const cat = repo.update(Number(req.params.id), req.body);
    if (!cat) throw new NotFoundError('Category');
    ok(res, cat);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) throw new ConflictError('Category name already exists');
    throw e;
  }
});

router.delete('/:id', rules.idParam, validate, (req, res) => {
  const deleted = repo.remove(Number(req.params.id));
  if (!deleted) throw new NotFoundError('Category');
  noContent(res);
});

module.exports = router;
