export type LocalInstant = { at: number; offsetMinutes: number };
export class EstimateInputError extends Error {
  constructor(
    public readonly reason:
      "date" | "missing" | "ambiguous" | "zone" | "range" | "elapsed",
  ) {
    super(reason);
  }
}
export function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function formatter(zone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}
function components(format: Intl.DateTimeFormat, at: number) {
  const parts = Object.fromEntries(
    format.formatToParts(at).map((p) => [p.type, p.value]),
  );
  return [
    Number(parts.year),
    Number(parts.month),
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  ];
}
function utc(values: number[]) {
  return Date.UTC(
    values[0],
    values[1] - 1,
    values[2],
    values[3],
    values[4],
    values[5] ?? 0,
  );
}
/** Resolve wall time explicitly; Date(input) may silently choose a repeated hour or normalize a gap. */
export function localInstants(value: string, zone: string): LocalInstant[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return [];
  const wanted = match.slice(1).map(Number).concat(0);
  if (wanted[0] < 1000 || wanted[0] > 9999) return [];
  const wall = utc(wanted),
    date = new Date(wall);
  if (
    [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ].some((x, i) => x !== wanted[i])
  )
    return [];
  let format: Intl.DateTimeFormat;
  try {
    format = formatter(zone);
  } catch {
    return [];
  }
  const offsets = new Set<number>();
  // Sampling both sides includes offset transitions, including fractional-hour and full-day jumps.
  for (let hour = -48; hour <= 48; hour++) {
    const at = wall + hour * 3600000;
    offsets.add((utc(components(format, at)) - at) / 60000);
  }
  return [...offsets]
    .map((offsetMinutes) => ({
      at: wall - offsetMinutes * 60000,
      offsetMinutes,
    }))
    .filter(({ at }) => components(format, at).every((x, i) => x === wanted[i]))
    .sort((a, b) => a.at - b.at);
}
export function offsetLabel(minutes: number) {
  const totalSeconds = Math.round(Math.abs(minutes) * 60);
  const sign = minutes < 0 ? "−" : "+";
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
  const seconds = totalSeconds % 60;
  return `UTC${sign}${hours}:${mins}${seconds ? ":" + String(seconds).padStart(2, "0") : ""}`;
}
export function chooseLocalInstant(
  value: string,
  zone: string,
  selection: string,
): number {
  if (!value) throw new EstimateInputError("missing");
  const candidates = localInstants(value, zone);
  if (!candidates.length) throw new EstimateInputError("date");
  if (candidates.length === 1) {
    if (selection && Number(selection) !== candidates[0].at)
      throw new EstimateInputError("ambiguous");
    return candidates[0].at;
  }
  const chosen = candidates.find((x) => String(x.at) === selection);
  if (!chosen) throw new EstimateInputError("ambiguous");
  return chosen.at;
}
export function estimateWindow(
  input: {
    start: string;
    end: string;
    startChoice: string;
    endChoice: string;
    zone: string;
  },
  currentZone: string,
  now: number,
) {
  if (!input.zone || input.zone !== currentZone)
    throw new EstimateInputError("zone");
  const startAt = chooseLocalInstant(
    input.start,
    input.zone,
    input.startChoice,
  );
  const endAt = chooseLocalInstant(input.end, input.zone, input.endChoice);
  if (startAt > endAt) throw new EstimateInputError("range");
  if (!Number.isSafeInteger(now) || endAt < now)
    throw new EstimateInputError("elapsed");
  return { startAt, endAt };
}
export function formatEstimateInstant(
  at: number,
  language: "vi" | "en",
  zone: string,
) {
  try {
    return (
      new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
        timeZone: zone,
        dateStyle: "medium",
        timeStyle: "short",
      }).format(at) +
      " · " +
      zone +
      " (" +
      offsetLabel(
        (utc(components(formatter(zone), at - (at % 1000))) -
          (at - (at % 1000))) /
          60000,
      ) +
      ")"
    );
  } catch {
    return language === "vi"
      ? "Chưa hiển thị được thời gian."
      : "Time unavailable.";
  }
}
