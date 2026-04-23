/**
 * src/api/client.js
 * Typed API client. Every function returns parsed data or throws { message, code }.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json?.error?.message ?? `Request failed (${res.status})`);
    err.code   = json?.error?.code ?? 'UNKNOWN';
    err.status = res.status;
    err.details = json?.error?.details;
    throw err;
  }

  return json.data;
}

const get    = (path)         => request(path);
const post   = (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) });
const patch  = (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) });
const del    = (path)         => request(path, { method: 'DELETE' });

// ── Todos ─────────────────────────────────────────────────────────────────────

export const todosApi = {
  /** @param {TodoFilters} filters */
  list: (filters = {}) => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    const qs = p.toString();
    return get(`/todos${qs ? `?${qs}` : ''}`);
  },

  stats:  ()          => get('/todos/stats'),
  get:    (id)        => get(`/todos/${id}`),
  create: (data)      => post('/todos', data),
  update: (id, data)  => patch(`/todos/${id}`, data),
  toggle: (id)        => patch(`/todos/${id}/toggle`),
  delete: (id)        => del(`/todos/${id}`),
  reorder: (ids)      => post('/todos/reorder', { ids }),

  subtasks: {
    list:   (todoId)           => get(`/todos/${todoId}/subtasks`),
    create: (todoId, data)     => post(`/todos/${todoId}/subtasks`, data),
    update: (todoId, subId, d) => patch(`/todos/${todoId}/subtasks/${subId}`, d),
    delete: (todoId, subId)    => del(`/todos/${todoId}/subtasks/${subId}`),
  },
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  list:   ()          => get('/categories'),
  get:    (id)        => get(`/categories/${id}`),
  create: (data)      => post('/categories', data),
  update: (id, data)  => patch(`/categories/${id}`, data),
  delete: (id)        => del(`/categories/${id}`),
};

// ── Tags ──────────────────────────────────────────────────────────────────────

export const tagsApi = {
  list:   ()   => get('/tags'),
  delete: (id) => del(`/tags/${id}`),
};
