// src/components/todos/FilterBar.jsx
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['todo', 'in_progress', 'done', 'archived'];
const SORTS      = [
  { value: 'position',   label: 'Manual' },
  { value: 'due_date',   label: 'Due Date' },
  { value: 'priority',   label: 'Priority' },
  { value: 'created_at', label: 'Created' },
  { value: 'title',      label: 'Title' },
];

export default function FilterBar({ filters, categories, onChange, onClear }) {
  const set = (key, value) => onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="filter-bar">
      {/* Sort */}
      <div className="filter-group">
        <label className="filter-label">Sort</label>
        <div className="filter-chips">
          {SORTS.map(s => (
            <button
              key={s.value}
              className={cn('filter-chip', filters.sort === s.value && 'filter-chip--active')}
              onClick={() => set('sort', s.value)}
            >
              {s.label}
            </button>
          ))}
          <button
            className={cn('filter-chip filter-chip--order')}
            onClick={() => set('order', filters.order === 'desc' ? 'asc' : 'desc')}
          >
            {filters.order === 'desc' ? '↓ Desc' : '↑ Asc'}
          </button>
        </div>
      </div>

      {/* Priority */}
      <div className="filter-group">
        <label className="filter-label">Priority</label>
        <div className="filter-chips">
          {PRIORITIES.map(p => (
            <button
              key={p}
              className={cn('filter-chip', filters.priority === p && 'filter-chip--active')}
              onClick={() => set('priority', filters.priority === p ? '' : p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="filter-group">
        <label className="filter-label">Status</label>
        <div className="filter-chips">
          {STATUSES.map(s => (
            <button
              key={s}
              className={cn('filter-chip', filters.status === s && 'filter-chip--active')}
              onClick={() => set('status', filters.status === s ? '' : s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="filter-group">
          <label className="filter-label">Category</label>
          <div className="filter-chips">
            {categories.map(c => (
              <button
                key={c.id}
                className={cn('filter-chip', filters.category_id === String(c.id) && 'filter-chip--active')}
                onClick={() => set('category_id', filters.category_id === String(c.id) ? '' : String(c.id))}
                style={filters.category_id === String(c.id) ? { borderColor: c.color, color: c.color } : {}}
              >
                <span className="cat-dot" style={{ background: c.color }} />{c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion */}
      <div className="filter-group">
        <label className="filter-label">Show</label>
        <div className="filter-chips">
          {[
            { label: 'All',       value: undefined },
            { label: 'Pending',   value: 'false'   },
            { label: 'Completed', value: 'true'    },
          ].map(opt => (
            <button
              key={opt.label}
              className={cn('filter-chip', filters.completed === opt.value && 'filter-chip--active')}
              onClick={() => onChange({ ...filters, completed: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <button className="filter-clear" onClick={onClear}>
        <X size={13} /> Clear all
      </button>
    </div>
  );
}
