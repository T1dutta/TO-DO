/**
 * lib/response.js
 * Consistent API response envelope + typed error classes.
 */

'use strict';

// ── Success Envelope ──────────────────────────────────────────────────────────

const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const created = (res, data) => ok(res, data, 201);

const noContent = (res) => res.status(204).end();

// ── Error Classes ─────────────────────────────────────────────────────────────

class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code   = code;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = { ok, created, noContent, AppError, NotFoundError, ValidationError, ConflictError };
