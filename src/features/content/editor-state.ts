/** Keep retries of the same submitted payload bound to one server operation. */
export function createRetryIdentity(
  uuid: () => string = () => crypto.randomUUID(),
) {
  let fingerprint = "",
    id = "";
  return {
    forPayload(payload: unknown) {
      const next = JSON.stringify(payload);
      if (next !== fingerprint || !id) {
        fingerprint = next;
        id = uuid();
      }
      return id;
    },
    clear() {
      fingerprint = "";
      id = "";
    },
  };
}
/** Saved timestamps are displayed in the browser's local timezone. */
export function scheduledInput(timestamp?: number) {
  if (!timestamp || !Number.isFinite(timestamp)) return "";
  return new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
/** Preserve seconds when the user has not changed the minute-level input. */
export function scheduledTimestamp(input: string, saved?: number) {
  if (!input) return undefined;
  return input === scheduledInput(saved) ? saved : new Date(input).getTime();
}
export function createRequestSequence() {
  let revision = 0;
  return {
    next: () => ++revision,
    current: (value: number) => value === revision,
    invalidate: () => {
      revision++;
    },
  };
}
