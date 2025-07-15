import type { Todo } from '$lib/client/dexie';

export interface TaskStatus {
  type: 'overdue' | 'slipped' | 'on-track';
  daysOverdue?: number;
}

export interface TaskWithOrder extends Todo {
  workOrder?: number;
}

export interface WeekEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDay?: boolean;
  parentWeek?: {
    startDate: Date;
    endDate: Date;
  };
}

export function getTaskStatus(todo: Todo, weekStartDate: Date): TaskStatus | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const isPastWeek = weekStartDate < today;

  // For completed tasks, only show status if completed after deadline/finishBy
  if (todo.status === 'completed') {
    if (todo.deadline && todo.completed) {
      const deadline = new Date(todo.deadline);
      deadline.setHours(0, 0, 0, 0);
      const completed = new Date(todo.completed);
      completed.setHours(0, 0, 0, 0);
      
      if (completed > deadline) {
        const daysOverdue = Math.ceil((completed.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        return { type: 'overdue', daysOverdue };
      }
    }
    if (todo.finishBy && todo.completed) {
      const finishBy = new Date(todo.finishBy);
      finishBy.setHours(0, 0, 0, 0);
      const completed = new Date(todo.completed);
      completed.setHours(0, 0, 0, 0);
      
      if (completed > finishBy) {
        return { type: 'slipped' };
      }
    }
    return null;
  }

  if (todo.deadline) {
    const deadline = new Date(todo.deadline);
    deadline.setHours(0, 0, 0, 0);
    
    if (deadline < today) {
      const daysOverdue = Math.ceil((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      return { type: 'overdue', daysOverdue };
    }
  }

  if (todo.finishBy) {
    const finishBy = new Date(todo.finishBy);
    finishBy.setHours(0, 0, 0, 0);
    
    if (finishBy < today) {
      return { type: 'slipped' };
    }
  }

  if (todo.todo) {
    const todoDate = new Date(todo.todo);
    todoDate.setHours(0, 0, 0, 0);
    
    if (todoDate < today) {
      return { type: 'slipped' };
    }
  }

  return null;
}

export function getStatusBadgeClass(status: TaskStatus, isCompleted: boolean): string {
  if (isCompleted) {
    return status.type === 'overdue'
      ? 'bg-red-100 dark:bg-red-900/20 text-red-400 dark:text-red-400/70'
      : status.type === 'slipped'
        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400/70'
        : 'bg-gray-100 dark:bg-gray-800/20 text-gray-400 dark:text-gray-400/70';
  }

  return status.type === 'overdue'
    ? 'bg-red-500 dark:bg-red-600 text-white'
    : status.type === 'slipped'
      ? 'bg-yellow-500 dark:bg-yellow-600 text-white'
      : 'bg-green-500 dark:bg-green-600 text-white';
}

export function getPriorityBadgeClass(priority: string, isCompleted: boolean): string {
  if (isCompleted) return 'text-muted-foreground/50';

  switch (priority) {
    case 'P0': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
    case 'P1': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    case 'P2': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    case 'P3': return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200';
    default: return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200';
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

export function formatDate(date: Date, isDay: boolean = false): string {
  if (isDay) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
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
  
  // For day events, check if the parent week is current
  if (weekEvent.isDay && weekEvent.parentWeek) {
    return today >= weekEvent.parentWeek.startDate && today <= weekEvent.parentWeek.endDate;
  }
  
  return today >= weekEvent.startDate && today <= weekEvent.endDate;
}

export function isToday(weekEvent: WeekEvent): boolean {
  if (!weekEvent.isDay) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(weekEvent.startDate);
  eventDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === eventDate.getTime();
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

export function calculateWorkOrder(todos: Todo[]): Map<string, number> {
  const workOrderMap = new Map<string, number>();
  
  // Filter to incomplete tasks with deadlines
  const tasksWithDeadlines = todos.filter(todo => 
    todo.status !== 'completed' && 
    todo.deadline !== null
  );
  
  // Sort by deadline (earliest first), then by priority
  tasksWithDeadlines.sort((a, b) => {
    const dateCompare = (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0);
    if (dateCompare !== 0) return dateCompare;
    
    // If same deadline, sort by priority (P0 > P1 > P2 > P3)
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    return aPriority - bPriority;
  });
  
  // Assign work order numbers
  tasksWithDeadlines.forEach((todo, index) => {
    workOrderMap.set(todo.id, index + 1);
  });
  
  return workOrderMap;
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
