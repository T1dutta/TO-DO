// src/components/todos/TodoList.jsx
import { CheckCircle2, Circle, Pencil, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { cn, PRIORITY_META, STATUS_META, formatDueDate, isOverdue, isDueSoon } from '../../lib/utils';

function EmptyState() {
  return (
    <div className="empty-state">
      <CheckCircle2 size={40} strokeWidth={1.2} />
      <p>No tasks here — add one above!</p>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const priority = PRIORITY_META[todo.priority] ?? PRIORITY_META.medium;
  const dueLabel = formatDueDate(todo.due_date);
  const overdue  = isOverdue(todo.due_date) && !todo.completed;
  const soon     = isDueSoon(todo.due_date) && !todo.completed;
  const subtaskPct = todo.subtask_total
    ? Math.round((todo.subtask_done / todo.subtask_total) * 100)
    : null;

  return (
    <div className={cn('todo-item', todo.completed && 'todo-item--done')}>
      {/* Priority stripe */}
      <div className="priority-stripe" style={{ background: priority.color }} />

      {/* Toggle */}
      <button
        className="todo-toggle"
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed
          ? <CheckCircle2 size={20} className="toggle-checked" />
          : <Circle size={20} className="toggle-empty" />
        }
      </button>

      {/* Body */}
      <div className="todo-body">
        <p className={cn('todo-title', todo.completed && 'todo-title--done')}>{todo.title}</p>
        {todo.description && (
          <p className="todo-desc">{todo.description}</p>
        )}

        {/* Meta row */}
        <div className="todo-meta">
          {todo.category_name && (
            <span className="meta-chip" style={{ background: `${todo.category_color}22`, color: todo.category_color }}>
              {todo.category_name}
            </span>
          )}
          <span className={cn('meta-chip', priority.bg, priority.text)}>
            {priority.label}
          </span>
          {dueLabel && (
            <span className={cn('meta-chip due-chip',
              overdue ? 'due-overdue' : soon ? 'due-soon' : 'due-normal'
            )}>
              {overdue && <AlertCircle size={10} />}
              {dueLabel}
            </span>
          )}
          {todo.tags?.map(tag => (
            <span key={tag.id} className="meta-chip meta-chip--tag">#{tag.name}</span>
          ))}
        </div>

        {/* Subtask progress */}
        {subtaskPct !== null && (
          <div className="subtask-progress">
            <div className="subtask-track">
              <div className="subtask-fill" style={{ width: `${subtaskPct}%` }} />
            </div>
            <span className="subtask-label">{todo.subtask_done}/{todo.subtask_total}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="todo-actions">
        <button className="action-btn" onClick={() => onEdit(todo)} aria-label="Edit">
          <Pencil size={14} />
        </button>
        <button className="action-btn action-btn--danger" onClick={() => onDelete(todo.id)} aria-label="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TodoList({ todos, loading, onToggle, onDelete, onEdit }) {
  if (loading) {
    return (
      <div className="todo-list">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="todo-skeleton" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (!todos.length) return <EmptyState />;

  // Group by status
  const groups = {
    in_progress: todos.filter(t => t.status === 'in_progress'),
    todo:        todos.filter(t => t.status === 'todo'),
    done:        todos.filter(t => t.status === 'done'),
  };

  const renderGroup = (label, items, collapsible = false) => {
    if (!items.length) return null;
    return (
      <div key={label} className="todo-group">
        <div className="group-header">
          <span className="group-label">{label}</span>
          <span className="group-count">{items.length}</span>
        </div>
        {items.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="todo-list">
      {renderGroup('In Progress', groups.in_progress)}
      {renderGroup('To Do', groups.todo)}
      {renderGroup('Done', groups.done)}
    </div>
  );
}
