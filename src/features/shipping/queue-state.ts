import { useEffect, useRef, useState, type RefObject } from "react";
import { callService } from "../../shared/firebase";

export type WorkRecord = { id: string; version: number };
export type ShippingLock = {
  blocked: boolean;
  acquire: () => boolean;
  release: () => void;
  beginRead: () => void;
  endRead: () => void;
};
export function recordIds(ids: string[], maximum: number) {
  const unique = [...new Set(ids)];
  if (
    !unique.length ||
    unique.length > maximum ||
    unique.some((id) => !/^[a-zA-Z0-9-]{1,80}$/.test(id))
  )
    throw new Error("INVALID_REFERENCES");
  return unique;
}
export function versionMap(records: WorkRecord[]) {
  if (
    records.some((row) => !Number.isSafeInteger(row.version) || row.version < 1)
  )
    throw new Error("INVALID_VERSION");
  return Object.fromEntries(records.map((row) => [row.id, row.version]));
}
export function requireSettled<T>(settled: PromiseSettledResult<T>[]): T[] {
  const failures = settled.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  const failure = failures.find((result) => ["permission-denied", "unauthenticated"].includes(
    String((result.reason as { code?: string })?.code ?? "").replace("functions/", ""),
  )) ?? failures[0];
  if (failure) throw failure.reason;
  return settled.map((result) => (result as PromiseFulfilledResult<T>).value);
}
export async function readRecords<T extends WorkRecord>(
  kind: string,
  ids: string[],
  maximum: number,
) {
  const unique = recordIds(ids, maximum);
  const settled = await Promise.allSettled(
    unique.map(async (id) => {
      const result = await callService<{ rows: T[] }>("listWork", { kind, id });
      if (result.rows.length !== 1 || result.rows[0].id !== id)
        throw new Error("MISSING_REFERENCE");
      versionMap(result.rows);
      return result.rows[0];
    }),
  );
  return requireSettled(settled);
}
export function selectionIds(
  current: string[],
  id: string,
  checked: boolean,
  maximum: number,
) {
  const next = checked
    ? [...new Set([...current, id])]
    : current.filter((value) => value !== id);
  if (next.length > maximum) throw new Error("SELECTION_LIMIT");
  return next;
}
// Memory-only intent survives queue/readback remounts, never changes an issued command.
export function useFormIntent(root: RefObject<HTMLElement | null>) {
  const drafts = useRef(new Map<string, Map<string, string | boolean>>());
  function capture(form: HTMLFormElement) {
    const key = form.dataset.intent;
    if (!key) return;
    const values = new Map<string, string | boolean>();
    for (const element of form.elements) {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) ||
        !element.name ||
        element.name === "parcel"
      )
        continue;
      values.set(
        element.name,
        element instanceof HTMLInputElement && element.type === "checkbox"
          ? element.checked
          : element.value,
      );
    }
    drafts.current.set(key, values);
  }
  useEffect(() => {
    root.current
      ?.querySelectorAll<HTMLFormElement>("form[data-intent]")
      .forEach((form) => {
        const values = drafts.current.get(form.dataset.intent!);
        if (!values) return;
        for (const element of form.elements) {
          if (!(
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ))
            continue;
          const value = values.get(element.name);
          if (typeof value === "boolean" && element instanceof HTMLInputElement)
            element.checked = value;
          else if (typeof value === "string") element.value = value;
        }
      });
  });
  return {
    capture,
    clear: (form: HTMLFormElement | null) => {
      if (form?.dataset.intent) drafts.current.delete(form.dataset.intent);
    },
  };
}
export function useResultFocus(
  id: string,
  target: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!id || !target.current) return;
    target.current.focus({ preventScroll: true });
    target.current.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [id, target]);
}
export function useWorkQueue<T extends WorkRecord>(kind: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const history = useRef<(string | undefined)[]>([undefined]);
  const position = useRef(0);
  const generation = useRef(0);
  const alive = useRef(true);
  const inFlight = useRef<number | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      generation.current++;
      inFlight.current = null;
    };
  }, []);
  async function load(
    target = position.current,
    cursor = history.current[target],
  ) {
    if (inFlight.current !== null) return;
    const current = ++generation.current;
    inFlight.current = current;
    setLoading(true);
    setError(false);
    try {
      const response = await callService<{ rows: T[]; next: string | null }>(
        "listWork",
        { kind, ...(cursor ? { after: cursor } : {}) },
      );
      if (!alive.current || current !== generation.current) return;
      position.current = target;
      history.current[target] = cursor;
      setRows(response.rows);
      setNext(response.next);
      setPage(target + 1);
    } catch (cause) {
      if (alive.current && current === generation.current) {
        setRows([]);
        setNext(null);
        setError(true);
      }
      throw cause;
    } finally {
      if (inFlight.current === current) inFlight.current = null;
      if (alive.current && current === generation.current) setLoading(false);
    }
  }
  return {
    rows,
    next,
    loading,
    error,
    page,
    load,
    clear: () => {
      generation.current++;
      inFlight.current = null;
      setRows([]);
      setNext(null);
      setError(true);
      setLoading(false);
    },
    forward: () =>
      next ? load(position.current + 1, next) : Promise.resolve(),
    back: () =>
      position.current > 0 ? load(position.current - 1) : Promise.resolve(),
  };
}
