export function validScheduleTime(value: string, now = Date.now()): boolean {
  const time = Date.parse(value);
  return (
    Number.isFinite(time) && time > now + 60000 && time < now + 366 * 86400000
  );
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Round trip rejects impossible dates and times skipped by local daylight-saving changes.
export function localScheduleInstant(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const roundTrip = `${localDay(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return roundTrip === value ? date.toISOString() : null;
}

export function scheduleLabel(value: string, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "shortOffset",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")} · ${part("hour")}:${part("minute")} · ${part("timeZoneName")}`;
}
