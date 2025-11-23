export function getRecentDates(days: number): string[] {
  const count = normalizeDays(days);
  return Array.from({ length: count }, (_, index) => formatDate(offsetDate(index)));
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(offsetInDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - offsetInDays);
  return date;
}

function normalizeDays(days: number): number {
  if (!Number.isFinite(days)) {
    return 0;
  }
  return Math.max(0, Math.floor(days));
}

