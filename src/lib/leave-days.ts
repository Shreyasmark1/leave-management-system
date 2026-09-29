export function countLeaveDays(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      days += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return false;
  }
  return startDate <= endDate;
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}