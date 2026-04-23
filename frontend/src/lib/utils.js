// src/lib/utils.js

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_META = {
  low:    { label: 'Low',    color: '#64748b', bg: 'bg-slate-100',  text: 'text-slate-600'  },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  high:   { label: 'High',   color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-700'    },
  urgent: { label: 'Urgent', color: '#dc2626', bg: 'bg-red-200',    text: 'text-red-800'    },
};

export const STATUS_META = {
  todo:        { label: 'To Do',       color: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  done:        { label: 'Done',        color: '#10b981' },
  archived:    { label: 'Archived',    color: '#64748b' },
};

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (isToday(date))    return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isPast(date))     return `${formatDistanceToNow(date)} ago`;
  return format(date, 'MMM d');
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  const diff = (date - Date.now()) / 86400000;
  return diff >= 0 && diff <= 2;
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr));
}
