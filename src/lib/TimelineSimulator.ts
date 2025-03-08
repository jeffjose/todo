import type { Todo } from './client/dexie';

type TodoStatus = 'pending' | 'in-progress' | 'completed';

interface StateCache {
  [dateStr: string]: {
    [todoId: string]: TodoStatus;
  };
}

interface CompletionDates {
  [todoId: string]: string; // ISO date string when task was completed
}

export class TimelineSimulator {
  private stateCache: StateCache = {};
  private originalStates: { [todoId: string]: TodoStatus } = {};
  private completionDates: CompletionDates = {};
  private initialized = false;
  private lastDate: Date | null = null;

  constructor() { }

  private getSeededRandom(taskId: string, date: string): number {
    // Create a hash from taskId + date
    let hash = 0;
    const str = `${taskId}-${date}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert hash to a number between 0 and 1
    const random = Math.abs((hash % 1000) / 1000);
    console.log(`Generated random ${random} for task ${taskId} on date ${date}`);
    return random;
  }

  private determineNewState(todo: Todo, simulatedDate: Date, isBackwards: boolean): TodoStatus {
    const dateStr = simulatedDate.toISOString().split('T')[0];
    const random = this.getSeededRandom(todo.id, dateStr);

    const currentStatus = todo.status;
    let newStatus: TodoStatus;

    // If moving backwards and task is completed, check if we should uncomplete it
    if (isBackwards && currentStatus === 'completed') {
      const completionDate = this.completionDates[todo.id];
      if (completionDate && dateStr < completionDate) {
        newStatus = 'pending';
        console.log(`Uncompleting task ${todo.title} as we moved before its completion date ${completionDate}`);
      } else {
        newStatus = 'completed';
      }
    } else {
      // Normal forward progression
      switch (currentStatus) {
        case 'pending':
        case 'in-progress':
          // 70% chance to complete each day
          newStatus = random < 0.70 ? 'completed' : 'pending';
          // If task becomes completed, store the completion date
          if (newStatus === 'completed') {
            this.completionDates[todo.id] = dateStr;
          }
          break;

        case 'completed':
          newStatus = 'completed';
          break;

        default:
          newStatus = 'pending';
      }
    }

    console.log(`Task ${todo.title} (${todo.id}): ${currentStatus} -> ${newStatus} (random: ${random})`);
    return newStatus;
  }

  public updateTodoStates(todos: Todo[], simulatedDate: Date): void {
    const dateStr = simulatedDate.toISOString().split('T')[0];
    console.log(`\nUpdating states for ${todos.length} todos on ${dateStr}`);

    // Determine if we're moving backwards in time
    const isBackwards = this.lastDate ? simulatedDate < this.lastDate : false;
    console.log(`Time direction: ${isBackwards ? 'backwards' : 'forwards'}`);

    // Initialize original states if not done yet
    if (!this.initialized) {
      console.log('Initializing original states');
      todos.forEach(todo => {
        this.originalStates[todo.id] = todo.status as TodoStatus;
      });
      this.initialized = true;
    }

    // Use cached states if we've seen this date before
    if (this.stateCache[dateStr]) {
      console.log(`Using cached states for ${dateStr}`);
      todos.forEach(todo => {
        const oldStatus = todo.status;
        todo.status = this.stateCache[dateStr][todo.id];
        console.log(`Task ${todo.title} (${todo.id}): ${oldStatus} -> ${todo.status} (from cache)`);
      });
    } else {
      // Calculate new states
      console.log('Calculating new states');
      const newStates: { [todoId: string]: TodoStatus } = {};
      todos.forEach(todo => {
        newStates[todo.id] = this.determineNewState(todo, simulatedDate, isBackwards);
      });

      // Cache and apply the new states
      this.stateCache[dateStr] = newStates;
      todos.forEach(todo => {
        todo.status = newStates[todo.id];
      });
    }

    // Update last date
    this.lastDate = simulatedDate;
  }

  public reset(todos: Todo[]): void {
    console.log('\nResetting simulator');
    // Reset to original states
    todos.forEach(todo => {
      const oldStatus = todo.status;
      todo.status = this.originalStates[todo.id] || 'pending';
      console.log(`Task ${todo.title} (${todo.id}): ${oldStatus} -> ${todo.status}`);
    });
    this.stateCache = {}; // Clear cache
    this.completionDates = {}; // Clear completion dates
    this.initialized = false;
    this.lastDate = null;
    console.log('Cache cleared and simulator reset');
  }
}

// Export a singleton instance
export const timelineSimulator = new TimelineSimulator(); 
