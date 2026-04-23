// src/hooks/useTodos.js
import { useEffect } from 'react';
import { useStore } from '../store/AppStore';

export function useTodos() {
  const { state, actions } = useStore();

  useEffect(() => {
    actions.loadTodos(state.filters);
  }, [state.filters]);

  return {
    todos:    state.todos,
    loading:  state.loading.todos,
    error:    state.error,
    filters:  state.filters,
    setFilters: actions.setFilters,
    createTodo: actions.createTodo,
    updateTodo: actions.updateTodo,
    toggleTodo: actions.toggleTodo,
    deleteTodo: actions.deleteTodo,
  };
}

export function useStats() {
  const { state, actions } = useStore();

  useEffect(() => {
    actions.loadStats();
  }, []);

  return { stats: state.stats, loading: state.loading.stats };
}

export function useCategories() {
  const { state, actions } = useStore();

  useEffect(() => {
    actions.loadCategories();
  }, []);

  return {
    categories:     state.categories,
    loading:        state.loading.categories,
    createCategory: actions.createCategory,
    deleteCategory: actions.deleteCategory,
  };
}

export function useTags() {
  const { state, actions } = useStore();

  useEffect(() => {
    actions.loadTags();
  }, []);

  return { tags: state.tags };
}
