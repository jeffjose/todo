import { type Todo } from '../client/dexie';
import { Task } from '../types';

export interface TaskStatus {
  type: 'overdue' | 'slipped';
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

function isSameDay(d1: Date | undefined | null, d2: Date | undefined | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isBeforeDay(d1: Date | undefined | null, d2: Date | undefined | null): boolean {
  if (!d1 || !d2) return false;
  const d1Start = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const d2Start = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return d1Start.getTime() < d2Start.getTime();
}

function getDaysOverdue(date: Date | undefined | null, now: Date): number {
  if (!date) return 0;
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((nowStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
}

export function getTaskStatus(task: Task, now: Date): TaskStatus | undefined {
  // If task is completed, only show status if completed after deadline/finishBy
  if (task.completed) {
    const completedDate = task.completedAt ? new Date(task.completedAt) : undefined;
    if (!completedDate) return undefined;

    if (task.deadline && isBeforeDay(task.deadline, completedDate)) {
      return { type: 'overdue', daysOverdue: getDaysOverdue(task.deadline, completedDate) };
    }
    if (task.finishBy && isBeforeDay(task.finishBy, completedDate)) {
      return { type: 'slipped' };
    }
    return undefined;
  }

  // For pending tasks, check dates against now
  // Priority: deadline (overdue) > finishBy (slipped) > todo (slipped)
  if (task.deadline) {
    if (isBeforeDay(task.deadline, now)) {
      return { type: 'overdue', daysOverdue: getDaysOverdue(task.deadline, now) };
    }
  }

  if (task.finishBy) {
    if (isBeforeDay(task.finishBy, now)) {
      return { type: 'slipped' };
    }
  }

  if (task.todo) {
    if (isBeforeDay(task.todo, now)) {
      return { type: 'slipped' };
    }
  }

  return undefined;
}

export function getStatusBadgeClass(status: TaskStatus, isCompleted: boolean): string {
  if (isCompleted) {
    return status.type === 'overdue'
      ? 'bg-red-100 text-red-400'
      : 'bg-yellow-100 text-yellow-400';
  }

  return status.type === 'overdue'
    ? 'bg-red-500 text-white'
    : 'bg-yellow-500 text-white';
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
    day: 'numeric'
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
