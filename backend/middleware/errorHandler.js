/**
 * middleware/errorHandler.js
 */

'use strict';

const { AppError } = require('../lib/response');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = {
      success: false,
      error: {
        code:    err.code,
        message: err.message,
      },
    };
    if (err.errors) body.error.details = err.errors;
    return res.status(err.status).json(body);
  }

  // SQLite UNIQUE constraint
  if (err.message?.includes('UNIQUE constraint')) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with that value already exists.' },
    });
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
};
