# Task —  Task Manager

Full-stack task management app: React 19 frontend + Express/SQLite backend.

---

## Architecture

```
todo-app/
├── backend/                   # Express REST API
│   ├── server.js              # Entry point, middleware pipeline
│   ├── lib/
│   │   ├── database.js        # SQLite connection + versioned migrations
│   │   ├── todoRepository.js  # All SQL for todos (Repository pattern)
│   │   ├── categoryRepository.js
│   │   ├── response.js        # Response helpers + typed error classes
│   │   └── seed.js            # Demo data seeder
│   ├── routes/
│   │   ├── todos.js           # /api/todos — CRUD + toggle + reorder + subtasks
│   │   ├── categories.js      # /api/categories
│   │   └── tags.js            # /api/tags
│   ├── middleware/
│   │   ├── validate.js        # express-validator rule sets + runner
│   │   └── errorHandler.js    # Global error handler
│   └── data/todos.db          # SQLite file (auto-created, git-ignored)
│
└── frontend/                  # React 19 + Vite
    └── src/
        ├── api/client.js      # Typed API client (all fetch calls)
        ├── store/AppStore.jsx # Global state (Context + useReducer)
        ├── hooks/useTodos.js  # Data hooks (useTodos, useStats, useCategories)
        ├── lib/utils.js       # cn(), date helpers, constants
        ├── pages/
        │   ├── TodosPage.jsx  # Main task list + filters
        │   └── Dashboard.jsx  # Analytics + charts (Recharts)
        └── components/
            ├── layout/Sidebar.jsx
            └── todos/
                ├── TodoList.jsx   # Grouped list with skeletons
                ├── TodoForm.jsx   # Create/edit modal
                └── FilterBar.jsx  # Filter/sort controls
```

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
node lib/seed.js   # optional: load demo data
npm run dev        # → http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev        # → http://localhost:5173
```

---

## Database Schema

```sql
categories   id · name · color · icon · created_at
todos        id · title · description · completed · priority · status
             due_date · reminder_at · category_id · position
             created_at · updated_at
tags         id · name · color
todo_tags    todo_id · tag_id                          (M:N junction)
subtasks     id · todo_id · title · completed · position · created_at
activity_log id · todo_id · action · meta · created_at
```

**Indexes:** category, status, priority, due_date, completed, activity created_at

**Auto-trigger:** `todos.updated_at` updated automatically on every row change.

---

## API Reference

### Todos
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/todos | List with filters: `completed`, `priority`, `status`, `category_id`, `search`, `sort`, `order`, `tag` |
| GET    | /api/todos/stats | Full dashboard stats |
| GET    | /api/todos/:id | Single todo with tags + subtasks |
| POST   | /api/todos | Create |
| PATCH  | /api/todos/:id | Update (partial) |
| PATCH  | /api/todos/:id/toggle | Toggle completed |
| DELETE | /api/todos/:id | Delete |
| POST   | /api/todos/reorder | `{ ids: [3,1,4,2] }` drag-drop order |
| GET    | /api/todos/:id/subtasks | List subtasks |
| POST   | /api/todos/:id/subtasks | Add subtask |
| PATCH  | /api/todos/:todoId/subtasks/:subId | Update subtask |
| DELETE | /api/todos/:todoId/subtasks/:subId | Delete subtask |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | /api/categories | List / Create |
| GET/PATCH/DELETE | /api/categories/:id | Single ops |

### Tags
| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/tags | All tags with usage count |
| DELETE | /api/tags/:id | Delete tag |

---

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| DB | SQLite (better-sqlite3) | Zero config, file-based, synchronous API, perfect for single-server apps |
| ORM | None — Repository pattern | Full SQL control, no magic, easy to optimize |
| Migrations | Versioned via `user_version` pragma | Schema evolves safely without external tools |
| State | Context + useReducer | Right-sized for this app; no Redux boilerplate |
| Validation | express-validator | Declarative rule sets, reusable across routes |
| Error handling | Typed error classes | Consistent JSON error envelope across all routes |
