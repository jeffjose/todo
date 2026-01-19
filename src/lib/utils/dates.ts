// Get the start of a week (Monday) for a given date
export function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

// Get the end of a week (Sunday) for a given date
export function getWeekEnd(date: Date): Date {
	const start = getWeekStart(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}

// Check if a date is in a specific week
export function isDateInWeek(date: Date, weekStart: Date): boolean {
	const start = getWeekStart(weekStart);
	const end = getWeekEnd(weekStart);
	return date >= start && date <= end;
}

// Format a date as "Jan 13"
export function formatShortDate(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format a date as "Mon, Jan 13"
export function formatDayDate(date: Date): string {
	return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Format a week range as "Jan 13 - 19, 2025"
export function formatWeekRange(weekStart: Date): string {
	const start = getWeekStart(weekStart);
	const end = getWeekEnd(weekStart);

	const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
	const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
	const year = end.getFullYear();

	if (startMonth === endMonth) {
		return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
	}
	return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

// Get an array of weeks: 2 before, current, 3 after
export function getWeeksAroundCurrent(currentDate: Date = new Date()): Date[] {
	const currentWeekStart = getWeekStart(currentDate);
	const weeks: Date[] = [];

	for (let i = -2; i <= 3; i++) {
		const week = new Date(currentWeekStart);
		week.setDate(week.getDate() + i * 7);
		weeks.push(week);
	}

	return weeks;
}

// Check if a week is the current week
export function isCurrentWeek(weekStart: Date, currentDate: Date = new Date()): boolean {
	const current = getWeekStart(currentDate);
	const week = getWeekStart(weekStart);
	return current.getTime() === week.getTime();
}

// Check if a week is in the past
export function isPastWeek(weekStart: Date, currentDate: Date = new Date()): boolean {
	const current = getWeekStart(currentDate);
	const week = getWeekStart(weekStart);
	return week < current;
}

// Check if a week is in the future
export function isFutureWeek(weekStart: Date, currentDate: Date = new Date()): boolean {
	const current = getWeekStart(currentDate);
	const week = getWeekStart(weekStart);
	return week > current;
}

// Get days of a week (Monday to Sunday)
export function getWeekDays(weekStart: Date): Date[] {
	const start = getWeekStart(weekStart);
	const days: Date[] = [];

	for (let i = 0; i < 7; i++) {
		const day = new Date(start);
		day.setDate(day.getDate() + i);
		days.push(day);
	}

	return days;
}

// Format date for input[type="date"]
export function formatDateForInput(date: Date | undefined): string {
	if (!date) return '';
	return date.toISOString().split('T')[0];
}

// Parse date from input[type="date"]
export function parseDateFromInput(value: string): Date | undefined {
	if (!value) return undefined;
	const date = new Date(value + 'T00:00:00');
	return isNaN(date.getTime()) ? undefined : date;
}
