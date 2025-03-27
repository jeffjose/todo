import type { Todo } from '$lib/client/dexie';

export interface TaskStatus {
  type: 'overdue' | 'slipped' | 'on-track';
  daysOverdue?: number;
}

export interface WeekEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function getTaskStatus(todo: Todo, weekStartDate: Date): TaskStatus | null {
  const today = new Date();
  const isPastWeek = weekStartDate < today;

  if (todo.status === 'completed') return null;

  if (todo.deadline) {
    if (todo.deadline < today) {
      const daysOverdue = Math.ceil((today.getTime() - todo.deadline.getTime()) / (1000 * 60 * 60 * 24));
      return { type: 'overdue', daysOverdue };
    }
  }

  if (todo.finishBy) {
    if (todo.finishBy < today) {
      return { type: 'slipped' };
    }
  }

  if (todo.todo) {
    if (todo.todo < today) {
      return { type: 'slipped' };
    }
  }

  return { type: 'on-track' };
}

export function getStatusBadgeClass(status: TaskStatus, isCompleted: boolean): string {
  if (isCompleted) {
    return status.type === 'overdue'
      ? 'bg-red-100 text-red-400'
      : status.type === 'slipped'
        ? 'bg-yellow-100 text-yellow-400'
        : 'bg-gray-100 text-gray-400';
  }

  return status.type === 'overdue'
    ? 'bg-red-500 text-white'
    : status.type === 'slipped'
      ? 'bg-yellow-500 text-white'
      : 'bg-green-500 text-white';
}

export function getPriorityBadgeClass(priority: string, isCompleted: boolean): string {
  if (isCompleted) return 'text-gray-400';

  switch (priority) {
    case 'P0': return 'bg-red-100 text-red-800';
    case 'P1': return 'bg-orange-100 text-orange-800';
    case 'P2': return 'bg-yellow-100 text-yellow-800';
    case 'P3': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getTaskColor(todo: Todo): string {
  if (todo.status === 'completed') return '#9CA3AF';

  // Use the ID to generate a hash
  let hash = 0;
  for (let i = 0; i < todo.id.length; i++) {
    hash = todo.id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with fixed saturation and lightness for readability
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 40%)`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function formatTodoDate(date: Date | null): string {
  if (!date) return 'No date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isCurrentWeek(weekEvent: WeekEvent): boolean {
  const today = new Date();
  return today >= weekEvent.startDate && today <= weekEvent.endDate;
}

export function isStartOfMonth(weekEvent: WeekEvent): boolean {
  const prevDay = new Date(weekEvent.startDate);
  prevDay.setDate(prevDay.getDate() - 1);
  return prevDay.getMonth() !== weekEvent.startDate.getMonth();
}

export function getMonthYear(date: Date, weekEvent: WeekEvent): string {
  // If this week contains the 1st of a month, use that date for the header
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekEvent.startDate);
    checkDate.setDate(checkDate.getDate() + i);
    if (checkDate.getDate() === 1) {
      return checkDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }
  // Otherwise use the provided date
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shouldShowMonthHeader(weekEvent: WeekEvent, index: number): boolean {
  // Check each day in the week for the 1st of a month
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekEvent.startDate);
    date.setDate(date.getDate() + i);
    if (date.getDate() === 1) {
      return true;
    }
  }
  return index === 0; // Show header for first week anyway
} 
