/**
 * server.js — Todo API entry point
 */

'use strict';

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const todosRouter      = require('./routes/todos');
const categoriesRouter = require('./routes/categories');
const tagsRouter       = require('./routes/tags');
const errorHandler     = require('./middleware/errorHandler');
const { NotFoundError } = require('./lib/response');

const app  = express();
const PORT = process.env.PORT || 3001;
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Security & Perf ───────────────────────────────────────────────────────────

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Logging & Parsing ─────────────────────────────────────────────────────────

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

app.use('/api/todos',      todosRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags',       tagsRouter);

// Catch-all 404
app.use((req, res, next) => next(new NotFoundError(`Route ${req.method} ${req.path}`)));

// ── Error Handler (must be last) ──────────────────────────────────────────────

app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅  Todo API  →  http://localhost:${PORT}`);
  console.log(`   /health`);
  console.log(`   /api/todos         GET POST`);
  console.log(`   /api/todos/stats   GET`);
  console.log(`   /api/todos/:id     GET PATCH DELETE`);
  console.log(`   /api/todos/reorder POST`);
  console.log(`   /api/todos/:id/toggle    PATCH`);
  console.log(`   /api/todos/:id/subtasks  GET POST PATCH DELETE`);
  console.log(`   /api/categories    GET POST PATCH DELETE`);
  console.log(`   /api/tags          GET DELETE\n`);
});

module.exports = app;
