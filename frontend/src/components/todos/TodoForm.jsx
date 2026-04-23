// src/components/todos/TodoForm.jsx
import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES   = ['todo', 'in_progress', 'done', 'archived'];

export default function TodoForm({ todo, categories, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title:       todo?.title        ?? '',
    description: todo?.description  ?? '',
    priority:    todo?.priority     ?? 'medium',
    status:      todo?.status       ?? 'todo',
    due_date:    todo?.due_date     ?? '',
    category_id: todo?.category_id  ?? '',
    tags:        todo?.tags?.map(t => t.name).join(', ') ?? '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        title:       form.title.trim(),
        description: form.description.trim() || null,
        priority:    form.priority,
        status:      form.status,
        due_date:    form.due_date || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{todo ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {errors._global && (
            <div className="form-error-banner">{errors._global}</div>
          )}

          {/* Title */}
          <div className="form-field">
            <label className="form-label">Title *</label>
            <input
              className={cn('form-input', errors.title && 'form-input--error')}
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Add details…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Row: priority + status */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Priority</label>
              <div className="priority-picker">
                {PRIORITIES.map(p => (
                  <button
                    type="button" key={p}
                    className={cn('priority-btn', form.priority === p && 'priority-btn--active')}
                    data-priority={p}
                    onClick={() => set('priority', p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Status</label>
              <select
                className="form-input form-select"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: due date + category */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Due Date</label>
              <input
                type="date" className="form-input"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
              >
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="form-field">
            <label className="form-label">Tags <span className="form-hint">(comma separated)</span></label>
            <input
              className="form-input"
              placeholder="e.g. urgent, deep-work, quick-win"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : todo ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
