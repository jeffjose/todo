# Design System Reference

This document defines the visual language, colors, badges, and UI patterns used throughout the todo app.

---

## Color Palette

### Base Colors (Dark Mode First)

| Token | Color | Usage |
|-------|-------|-------|
| `zinc-950` | Background | App background |
| `zinc-900` | Surface | Sidebars, cards, dialogs |
| `zinc-800` | Border | Borders, dividers |
| `zinc-700` | Border Subtle | Lighter borders |
| `zinc-600` | Muted | Disabled states |
| `zinc-500` | Muted Text | Secondary text, placeholders |
| `zinc-400` | Secondary Text | Labels, hints |
| `zinc-300` | Text | Body text |
| `zinc-200` | Text | Primary text |
| `zinc-100` | Text Bright | Headings, emphasis |

### Semantic Colors

| Purpose | Color | Background | Text | Border |
|---------|-------|------------|------|--------|
| **Current/Today** | Yellow | `yellow-500/10` | `yellow-400` | `yellow-500` |
| **Danger/Overdue** | Red | `red-500/20` | `red-400` | `red-500/30` |
| **Warning/Slipped** | Yellow | `yellow-500/20` | `yellow-400` | `yellow-500/30` |
| **Info/Highlight** | Blue | `blue-500/10` | `blue-400` | `blue-500/50` |
| **Success/On-track** | Emerald | `emerald-500/20` | `emerald-400` | - |
| **Blocked** | Purple | `purple-500/20` | `purple-400` | - |
| **Neutral/Ghost** | Zinc | - | `zinc-500` | - |

---

## Priority System

Tasks have four priority levels: P0, P1, P2, P3 (highest to lowest).

| Priority | Meaning | Background | Text | Border |
|----------|---------|------------|------|--------|
| **P0** | Critical | `red-500/20` | `red-400` | `red-500/30` |
| **P1** | High | `orange-500/20` | `orange-400` | `orange-500/30` |
| **P2** | Medium | `yellow-500/20` | `yellow-400` | `yellow-500/30` |
| **P3** | Low | `zinc-500/20` | `zinc-400` | `zinc-500/30` |

### Sorting Rules
1. Incomplete tasks before completed
2. Then by priority: P0 → P1 → P2 → P3

---

## Status Badges

### Task Status Badges

| Badge | Color | Condition | Display |
|-------|-------|-----------|---------|
| **Xd overdue** | Red | `deadline` is in the past | `3d overdue` |
| **Xd slipped** | Yellow | `finishBy` is in the past | `2d slipped` |
| **• (dot)** | Gray | `todo` is in the past | Small dot (subtle) |

**Priority**: overdue > slipped > dot (only one shows)

### Other Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| **Work Order (1, 2, 3...)** | Emerald circle | Global rank among deadline tasks |
| **blocked** | Purple | Task status is `blocked` |
| **Current** | Yellow | Current week indicator |

---

## Task States

### Status

| Status | Visual Treatment |
|--------|------------------|
| `pending` | Normal display |
| `in-progress` | Normal display |
| `completed` | Strikethrough, `zinc-500` text, checked box |
| `blocked` | `blocked` badge, italic text, 60% opacity |

### Ghost Tasks (Promoted)

Tasks that have been promoted from past weeks to current week show as "ghosts" in their original location.

| Indicator | Description |
|-----------|-------------|
| `>>` icon | `ChevronsRight` icon replaces checkbox |
| 50% opacity | Entire row is dimmed |
| No work order | Work order badge hidden |
| Clickable | Still opens edit dialog |
| Hover highlight | Still participates in cross-column highlighting |

---

## Three Column Layout

```
┌────────────────┬────────────────┬────────────────┐
│   Deadline     │   Finish By    │   Todo         │
│   (hard)       │   (soft)       │   (suggestion) │
├────────────────┼────────────────┼────────────────┤
│ Never moves    │ Promotes if    │ Promotes if    │
│ Shows overdue  │ past deadline  │ past date      │
│ badge          │ Shows slipped  │ Shows dot      │
│                │ badge          │                │
└────────────────┴────────────────┴────────────────┘
```

### Column Behaviors

| Column | Date Field | Promotion | Badge |
|--------|------------|-----------|-------|
| **Deadline** | `deadline` | Never (stays in original week) | `Xd overdue` (red) |
| **Finish By** | `finishBy` | Yes (to current week's today) | `Xd slipped` (yellow) |
| **Todo** | `todo` | Yes (to current week's today) | Small dot (gray) |

---

## Week Display

### Current Week
- **Left border**: 2px yellow (`border-l-yellow-500`)
- **Badge**: "Current" pill (`yellow-300` text, `yellow-500/20` bg)
- **View**: Day-by-day rows (Mon-Sun)
- **Today row**: Yellow background (`yellow-500/10`)

### Past Weeks
- **Style**: Collapsed single row
- **Incomplete tasks**: Shown as ghosts (`>>` icon)
- **Completed tasks**: Normal display

### Future Weeks
- **Style**: Collapsed single row
- **All tasks**: Normal display

---

## Interactive States

### Hover
| Element | Hover State |
|---------|-------------|
| Task row | `bg-zinc-800/50` |
| Button | `bg-zinc-800`, brighter text |
| Cross-column highlight | `ring-1 ring-blue-500/50 bg-blue-500/10` |

### Focus
- Keyboard focus uses standard outline
- Tab-navigable elements: checkboxes, task rows, buttons

---

## Icons

Using **Lucide** icon set.

| Icon | Usage |
|------|-------|
| `ChevronsRight` | Ghost/promoted task indicator |
| `ChevronLeft/Right` | Week navigation |
| `Plus` | Add task |
| `CalendarDays` | Today button |
| `FlaskConical` | Generate test data |
| `Check` | Checkbox (via shadcn) |

---

## Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Task title | `text-sm` (14px) | Normal | `zinc-200` |
| Task title (completed) | `text-sm` | Normal | `zinc-500` + strikethrough |
| Badge text | `text-[10px]` | Medium | Varies |
| Column header | `text-xs` (12px) | Medium | `zinc-500` |
| Week label | `text-xs` | Medium | `zinc-400` (or `yellow-400` if current) |
| Day label | `text-xs` | Normal/Medium | `zinc-500` (or `yellow-400` if today) |

---

## Spacing

| Context | Value |
|---------|-------|
| Task row padding | `px-2 py-1.5` |
| Column padding | `px-2 py-1` |
| Week header padding | `px-3 py-2` |
| Badge padding | `px-1.5 py-0.5` |
| Gap between elements | `gap-2` |

---

## Future Considerations

- [ ] Light mode toggle
- [ ] Custom theme colors
- [ ] Reduced motion preferences
- [ ] High contrast mode
