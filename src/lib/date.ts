/**
 * Get current date string in Europe/Warsaw timezone (YYYY-MM-DD).
 * This ensures the app shows the correct "today" for a user in Warsaw,
 * regardless of the server/browser's UTC offset.
 */
export function getTodayWarsaw(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

/**
 * Get current year and month in Warsaw timezone.
 */
export function getNowWarsaw(): { year: number; month: number; dateStr: string } {
  const dateStr = getTodayWarsaw();
  const [year, month] = dateStr.split("-").map(Number);
  return { year, month: month - 1, dateStr }; // month is 0-indexed for JS Date compat
}

/**
 * Format a YYYY-MM-DD date string as human-readable (e.g. "Monday, Mar 9").
 */
export function formatDateHuman(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", timeZone: "Europe/Warsaw",
  });
}
