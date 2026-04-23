// src/pages/TodosPage.jsx
import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTodos, useCategories } from '../hooks/useTodos';
import TodoList from '../components/todos/TodoList';
import TodoForm from '../components/todos/TodoForm';
import FilterBar from '../components/todos/FilterBar';
import { cn } from '../lib/utils';

export default function TodosPage() {
  const { todos, loading, filters, setFilters, createTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();
  const { categories } = useCategories();
  const [showForm, setShowForm]     = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch]         = useState('');
  const [editingTodo, setEditingTodo] = useState(null);

  const handleSearch = (val) => {
    setSearch(val);
    setFilters({ ...filters, search: val || undefined });
  };

  const handleCreate = async (data) => {
    await createTodo(data);
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    await updateTodo(editingTodo.id, data);
    setEditingTodo(null);
  };

  const activeFilterCount = [
    filters.priority, filters.status, filters.category_id,
    filters.completed !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            {todos.filter(t => !t.completed).length} remaining · {todos.length} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search tasks…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => handleSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <button
          className={cn('btn btn-ghost', showFilters && 'btn-ghost--active')}
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          categories={categories}
          onChange={setFilters}
          onClear={() => setFilters({ sort: 'position', order: 'asc' })}
        />
      )}

      {/* List */}
      <TodoList
        todos={todos}
        loading={loading}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={setEditingTodo}
      />

      {/* Create Modal */}
      {showForm && (
        <TodoForm
          categories={categories}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Modal */}
      {editingTodo && (
        <TodoForm
          todo={editingTodo}
          categories={categories}
          onSubmit={handleUpdate}
          onClose={() => setEditingTodo(null)}
        />
      )}
    </div>
  );
}
