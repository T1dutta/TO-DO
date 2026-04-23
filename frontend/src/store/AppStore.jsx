/**
 * src/store/AppStore.jsx
 * Lightweight global state via Context + useReducer.
 * No external state library needed for this scale.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { todosApi, categoriesApi, tagsApi } from '../api/client';

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  todos:       [],
  categories:  [],
  tags:        [],
  stats:       null,
  filters:     { sort: 'position', order: 'asc' },
  loading:     { todos: false, categories: false, tags: false, stats: false },
  error:       null,
  selectedId:  null,   /* currently open todo detail */
  theme:       localStorage.getItem('taskr-theme') || 'light',
  font:        localStorage.getItem('taskr-font') || 'DM Sans',
  accentColor: localStorage.getItem('taskr-accent') || '#6366f1',
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_THEME':
      localStorage.setItem('taskr-theme', action.payload);
      return { ...state, theme: action.payload };
      
    case 'SET_FONT':
      localStorage.setItem('taskr-font', action.payload);
      return { ...state, font: action.payload };
      
    case 'SET_ACCENT_COLOR':
      localStorage.setItem('taskr-accent', action.payload);
      return { ...state, accentColor: action.payload };

    case 'SET_TODOS':
      return { ...state, todos: action.payload };

    case 'SET_TODO':
      return {
        ...state,
        todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t),
      };

    case 'ADD_TODO':
      return { ...state, todos: [...state.todos, action.payload] };

    case 'REMOVE_TODO':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'SET_TAGS':
      return { ...state, tags: action.payload };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case 'SET_SELECTED':
      return { ...state, selectedId: action.payload };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);

export function AppStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Action creators ─────────────────────────────────────────────────────────

  const loadTodos = useCallback(async (filters = state.filters) => {
    dispatch({ type: 'SET_LOADING', key: 'todos', value: true });
    try {
      const data = await todosApi.list(filters);
      dispatch({ type: 'SET_TODOS', payload: data.todos });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'todos', value: false });
    }
  }, [state.filters]);

  const loadStats = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'stats', value: true });
    try {
      const data = await todosApi.stats();
      dispatch({ type: 'SET_STATS', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'stats', value: false });
    }
  }, []);

  const loadCategories = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'categories', value: true });
    try {
      const data = await categoriesApi.list();
      dispatch({ type: 'SET_CATEGORIES', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'categories', value: false });
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsApi.list();
      dispatch({ type: 'SET_TAGS', payload: data });
    } catch (e) { /* silent */ }
  }, []);

  const createTodo = useCallback(async (data) => {
    const todo = await todosApi.create(data);
    dispatch({ type: 'ADD_TODO', payload: todo });
    return todo;
  }, []);

  const updateTodo = useCallback(async (id, data) => {
    const todo = await todosApi.update(id, data);
    dispatch({ type: 'SET_TODO', payload: todo });
    return todo;
  }, []);

  const toggleTodo = useCallback(async (id) => {
    const todo = await todosApi.toggle(id);
    dispatch({ type: 'SET_TODO', payload: todo });
    return todo;
  }, []);

  const deleteTodo = useCallback(async (id) => {
    await todosApi.delete(id);
    dispatch({ type: 'REMOVE_TODO', payload: id });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const setSelected = useCallback((id) => {
    dispatch({ type: 'SET_SELECTED', payload: id });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const createCategory = useCallback(async (data) => {
    const cat = await categoriesApi.create(data);
    await loadCategories();
    return cat;
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id) => {
    await categoriesApi.delete(id);
    await loadCategories();
  }, [loadCategories]);

  const setTheme = useCallback((theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setFont = useCallback((font) => {
    dispatch({ type: 'SET_FONT', payload: font });
  }, []);

  const setAccentColor = useCallback((color) => {
    dispatch({ type: 'SET_ACCENT_COLOR', payload: color });
  }, []);

  const value = {
    state,
    actions: {
      loadTodos, loadStats, loadCategories, loadTags,
      createTodo, updateTodo, toggleTodo, deleteTodo,
      setFilters, setSelected, clearError,
      createCategory, deleteCategory, setTheme, setFont, setAccentColor
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}
