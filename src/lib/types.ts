export interface Task {
  completed: boolean;
  completedAt?: Date;
  deadline?: Date | null;
  finishBy?: Date | null;
  todo?: Date | null;
  status: string;
  title?: string;
} 
