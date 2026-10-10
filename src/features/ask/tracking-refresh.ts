import { readWithAbort } from "./guest-tracking-request";
export type RefreshState =
  "ready" | "refreshing" | "stale" | "unavailable" | "cooldown";
/** One active scope, one request, no catch-up storms or late publication. */
export class TrackingRefreshLoop<T> {
  private active = true;
  private busy = false;
  private dirty = false;
  private terminal = false;
  private lastRead: number;
  private controller?: AbortController;
  private timer?: ReturnType<typeof setInterval>;
  private debounce?: ReturnType<typeof setTimeout>;
  constructor(
    private readonly options: {
      guest: boolean;
      current: () => boolean;
      available: () => boolean;
      read: () => Promise<T>;
      data: (value: T) => void;
      state: (value: RefreshState) => void;
      now?: () => number;
    },
  ) {
    this.lastRead = this.now();
  }
  private now() {
    return this.options.now?.() ?? Date.now();
  }
  start() {
    this.timer = setInterval(() => {
      void this.refresh();
    }, 60_000);
  }
  changed() {
    if (!this.active || this.terminal) return;
    this.dirty = true;
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      void this.refresh(true);
    }, 250);
  }
  async refresh(manual = false) {
    const o = this.options;
    if (!this.active || this.terminal || !o.current()) return;
    if (!o.available()) {
      o.state("stale");
      return;
    }
    if (this.busy) {
      if (!o.guest) this.dirty = true;
      return;
    }
    // Guest manual/automatic requests share the same budget as the initial read.
    if (
      this.now() - this.lastRead <
      (o.guest ? 60_000 : manual ? 250 : 60_000)
    ) {
      if (o.guest && manual) o.state("cooldown");
      return;
    }
    this.busy = true;
    this.dirty = false;
    this.lastRead = this.now();
    this.controller = new AbortController();
    const signal = AbortSignal.any([
      this.controller.signal,
      AbortSignal.timeout(15_000),
    ]);
    o.state("refreshing");
    try {
      const value = (await readWithAbort(o.read, signal)) as T;
      if (this.active && o.current() && !signal.aborted) {
        o.data(value);
        o.state("ready");
      }
    } catch (error) {
      if (!this.active || this.terminal || !o.current()) return;
      let code = "";
      try {
        if (typeof error === "object" && error !== null)
          code = String((error as { code?: unknown }).code ?? "");
      } catch {
        /* SDK diagnostics are untrusted. */
      }
      this.terminal = /permission-denied|unauthenticated|not-found/.test(code);
      o.state(this.terminal ? "unavailable" : "stale");
    } finally {
      this.busy = false;
      if (this.dirty && this.active && !this.terminal && !o.guest)
        this.changed();
    }
  }
  fail() {
    this.terminal = true;
    this.controller?.abort();
    if (this.active) this.options.state("unavailable");
  }
  stop() {
    this.active = false;
    clearInterval(this.timer);
    clearTimeout(this.debounce);
    this.controller?.abort();
  }
}
