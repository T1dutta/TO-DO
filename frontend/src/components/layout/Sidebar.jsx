// src/components/layout/Sidebar.jsx
import { LayoutDashboard, CheckSquare, Tag, Settings, Zap } from 'lucide-react';
import { useStore } from '../../store/AppStore';
import { cn } from '../../lib/utils';

const NAV = [
  { id: 'todos',     icon: CheckSquare,    label: 'Tasks'     },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { state } = useStore();
  const { categories, todos } = state;

  const pending = todos.filter(t => !t.completed).length;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon"><Zap size={18} /></div>
        <span className="brand-name">Taskr</span>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={cn('nav-item', activePage === id && 'nav-item--active')}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === 'todos' && pending > 0 && (
              <span className="nav-badge">{pending}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Categories */}
      <div className="sidebar-section">
        <p className="sidebar-section-label">Categories</p>
        {categories.map(cat => (
          <button
            key={cat.id}
            className="nav-item"
            onClick={() => {
              onNavigate('todos');
            }}
          >
            <span
              className="cat-dot"
              style={{ background: cat.color }}
            />
            <span>{cat.name}</span>
            {cat.todo_count > 0 && (
              <span className="nav-count">{cat.todo_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={cn('nav-item', activePage === 'settings' && 'nav-item--active')}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
