import type { Todo } from './client/dexie';

type TodoStatus = 'pending' | 'in-progress' | 'completed';

interface StateCache {
  [dateStr: string]: {
    [todoId: string]: TodoStatus;
  };
}

export class TimelineSimulator {
  private stateCache: StateCache = {};
  private originalStates: { [todoId: string]: TodoStatus } = {};
  private initialized = false;

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

  private determineNewState(todo: Todo, simulatedDate: Date): TodoStatus {
    const dateStr = simulatedDate.toISOString().split('T')[0];
    const random = this.getSeededRandom(todo.id, dateStr);

    const currentStatus = todo.status;
    let newStatus: TodoStatus;

    switch (todo.status) {
      case 'pending':
        if (random < 0.30) newStatus = 'completed';  // 30% chance to complete directly
        else if (random < 0.80) newStatus = 'in-progress';  // 50% chance to move to in-progress
        else newStatus = 'pending';  // 20% chance to stay pending
        break;

      case 'in-progress':
        if (random < 0.60) newStatus = 'completed';  // 60% chance to complete
        else newStatus = 'in-progress';  // 40% chance to stay in-progress
        break;

      case 'completed':
        newStatus = 'completed'; // Once completed, stays completed
        break;

      default:
        newStatus = 'pending';
    }

    console.log(`Task ${todo.title} (${todo.id}): ${currentStatus} -> ${newStatus} (random: ${random})`);
    return newStatus;
  }

  public updateTodoStates(todos: Todo[], simulatedDate: Date): void {
    const dateStr = simulatedDate.toISOString().split('T')[0];
    console.log(`\nUpdating states for ${todos.length} todos on ${dateStr}`);

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
      return;
    }

    // Calculate new states
    console.log('Calculating new states');
    const newStates: { [todoId: string]: TodoStatus } = {};
    todos.forEach(todo => {
      newStates[todo.id] = this.determineNewState(todo, simulatedDate);
    });

    // Cache and apply the new states
    this.stateCache[dateStr] = newStates;
    todos.forEach(todo => {
      todo.status = newStates[todo.id];
    });
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
    this.initialized = false;
    console.log('Cache cleared and simulator reset');
  }
}

// Export a singleton instance
export const timelineSimulator = new TimelineSimulator(); 
