// src/App.jsx
import { useState, useEffect } from 'react';
import { AppStoreProvider, useStore } from './store/AppStore';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import TodosPage from './pages/TodosPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function AppInner() {
  const [page, setPage] = useState('todos');
  const { state, actions } = useStore();

  useEffect(() => {
    actions.loadTodos();
    actions.loadCategories();
    actions.loadTags();
    actions.loadStats();
  }, []);

  useEffect(() => {
    // Theme
    document.body.dataset.theme = state.theme;

    // Font
    const fontMap = {
      'DM Sans': '"DM Sans", system-ui, sans-serif',
      'Inter': '"Inter", system-ui, sans-serif',
      'System': 'system-ui, sans-serif',
    };
    document.documentElement.style.setProperty('--font-sans', fontMap[state.font] || fontMap['DM Sans']);

    // Accent Color
    document.documentElement.style.setProperty('--accent', state.accentColor);
    
    // Calculate a slightly darker/brighter hover state based on the selected hex
    // Simply lowering brightness via filters is handled by CSS, but we can set --accent-hover
    // For simplicity, we just reuse it or use an opacity hack in CSS if needed.
    document.documentElement.style.setProperty('--accent-hover', state.accentColor);
    
  }, [state.theme, state.font, state.accentColor]);

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main-content">
        {page === 'dashboard' && <Dashboard />}
        {page === 'todos'     && <TodosPage />}
        {page === 'settings'  && <SettingsPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppInner />
    </AppStoreProvider>
  );
}
