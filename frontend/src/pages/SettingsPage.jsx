// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { Trash2, Plus, RefreshCw, Database, Palette, Info, X, FolderOpen } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { cn } from '../lib/utils';

const ICONS = ['folder', 'briefcase', 'shopping-cart', 'heart', 'book-open', 'dollar-sign', 'star', 'music', 'code', 'home'];
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-icon"><Icon size={18} /></div>
        <div>
          <h3 className="settings-card-title">{title}</h3>
          {description && <p className="settings-card-desc">{description}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

function CategoryManager() {
  const { state, actions } = useStore();
  const { categories } = state;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('folder');
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await actions.createCategory({ name: name.trim(), color, icon });
      setName('');
      setColor('#6366f1');
      setIcon('folder');
      setShowForm(false);
    } catch (e) {
      alert(e.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!confirm(`Delete category "${catName}"? Tasks in this category won't be deleted but will become uncategorized.`)) return;
    setDeleting(id);
    try {
      await actions.deleteCategory(id);
    } catch (e) {
      alert(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <SectionCard icon={FolderOpen} title="Categories" description="Organize your tasks into groups.">
      <div className="settings-cat-list">
        {categories.map(cat => (
          <div key={cat.id} className="settings-cat-item">
            <span className="cat-dot" style={{ background: cat.color }} />
            <span className="settings-cat-name">{cat.name}</span>
            <span className="settings-cat-count">{cat.todo_count ?? 0} tasks</span>
            <button
              className="action-btn action-btn--danger"
              onClick={() => handleDelete(cat.id, cat.name)}
              disabled={deleting === cat.id}
              aria-label={`Delete ${cat.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="settings-empty">No categories yet</p>
        )}
      </div>

      {showForm ? (
        <div className="settings-cat-form">
          <input
            className="form-input"
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="settings-color-row">
            <label className="form-label">Color</label>
            <div className="settings-color-grid">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={cn('settings-color-btn', color === c && 'settings-color-btn--active')}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="settings-form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? 'Creating…' : 'Add Category'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost settings-add-btn" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add Category
        </button>
      )}
    </SectionCard>
  );
}

function DatabaseSection() {
  const { actions } = useStore();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState(null);

  const handleResetDB = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      // Simulate network delay for UI feedback
      await new Promise(r => setTimeout(r, 600));

      // Reload all data
      await Promise.all([
        actions.loadTodos(),
        actions.loadCategories(),
        actions.loadTags(),
        actions.loadStats(),
      ]);
      setSeedMsg('Data refreshed successfully!');
    } catch (e) {
      setSeedMsg('Failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SectionCard icon={Database} title="Data Management" description="Manage your task database.">
      <div className="settings-actions-list">
        <div className="settings-action-item">
          <div>
            <p className="settings-action-label">Refresh All Data</p>
            <p className="settings-action-desc">Re-fetch all tasks, categories, and tags from the server.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleResetDB} disabled={seeding}>
            <RefreshCw size={14} className={seeding ? 'spin' : ''} />
            {seeding ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
      {seedMsg && (
        <div className={cn('settings-msg', seedMsg.startsWith('Failed') ? 'settings-msg--error' : 'settings-msg--success')}>
          {seedMsg}
          <button className="settings-msg-close" onClick={() => setSeedMsg(null)}><X size={12} /></button>
        </div>
      )}
    </SectionCard>
  );
}

function AppearanceSection() {
  const { state, actions } = useStore();
  const { theme, font, accentColor } = state;

  const FONTS = ['DM Sans', 'Inter', 'System'];
  // Provide a palette of 5 nice accent colors for the user to choose from
  const ACCENTS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <SectionCard icon={Palette} title="Appearance" description="Customize how Mindora looks.">
      <div className="settings-actions-list">
        <div className="settings-action-item">
          <div>
            <p className="settings-action-label">Theme</p>
            <p className="settings-action-desc">Choose between light interface and dark interface.</p>
          </div>
          <button 
            className="btn btn-ghost"
            onClick={() => actions.setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
          </button>
        </div>
        <div className="settings-action-item">
          <div>
            <p className="settings-action-label">Accent Color</p>
            <p className="settings-action-desc">Used for buttons, badges, and highlights.</p>
          </div>
          <div className="settings-color-grid">
            {ACCENTS.map(color => (
              <button
                key={color}
                className={cn('settings-color-btn', accentColor === color && 'settings-color-btn--active')}
                style={{ background: color }}
                onClick={() => actions.setAccentColor(color)}
                aria-label={`Select accent ${color}`}
              />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage data and preferences</p>
        </div>
      </div>

      <DatabaseSection />
      <AppearanceSection />
    </div>
  );
}
