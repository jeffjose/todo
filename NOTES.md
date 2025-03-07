# Task Status Behaviors

## Task Types and Status Indicators

### Deadline Tasks

- Tasks with a hard deadline
- If deadline is in the past and task is not completed:
  - Shows "overdue" badge (red)
  - Appears in Todo column of current week
- Completed tasks stay in their original week

### Finish By Tasks

- Tasks with a softer target completion date
- If finishBy date is in the past and task is not completed:
  - Shows "slipped" badge (yellow)
  - Automatically promoted to current week
  - Original finishBy date is preserved
- Completed tasks stay in their original week

## Visual Indicators

### Badges

- **overdue** (red) - Only for tasks with a deadline date in the past
- **slipped** (yellow) - For tasks with a finishBy date in the past, shown in both:
  - Finish By column when task appears in current week
  - Todo column for all slipped tasks

### Task Promotion Logic

1. Deadline tasks:
   - Stay in their original week
   - Show as overdue in Todo column if past deadline
2. Finish By tasks:
   - Completed tasks stay in their original week
   - Open tasks from past weeks are promoted to current week
   - Promoted tasks show "slipped" badge in both Finish By and Todo columns

### Week Display

- Current week has amber background
- Past weeks only show completed tasks
- Future weeks show tasks with future dates
- Todo column shows all open tasks for current week, with appropriate badges:
  - "overdue" for past deadline tasks
  - "slipped" for past finishBy tasks
