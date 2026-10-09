import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import {
  CONSENT_VERSION,
  SESSION_IDLE,
  classifyAsk,
  publicRoute,
  type AnalyticsEvent,
} from "../../packages/domain/analytics";

const preferenceKey = "sg:analytics-consent:v1",
  browserKey = "sg:analytics-browser:v1",
  sessionKey = "sg:analytics-session:v1";
export type AnalyticsTransport = (
  name: string,
  data: unknown,
) => Promise<unknown>;
const transport: AnalyticsTransport = async (name, data) => {
  if (!functions) throw Error("ANALYTICS_UNAVAILABLE");
  return (await httpsCallable(functions, name, { timeout: 8_000 })(data)).data;
};
export function readAnalyticsConsent(): "yes" | "no" | null {
  try {
    const p = localStorage.getItem(preferenceKey);
    return p === "yes" || p === "no" ? p : null;
  } catch {
    return null;
  }
}
/** Non-blocking, bounded and independently testable; no progress overlay or commerce coupling. */
export class AnalyticsTracker {
  private queue: AnalyticsEvent[] = [];
  private seen = new Set<string>();
  private session: string | null = null;
  private sessionAt = 0;
  private lastUsed = 0;
  private browser: string | null = null;
  private sessionRequest: string | null = null;
  private flight: Promise<string | null> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sending = false;
  private generation = 0;
  private account: string | null = null;
  private active = false;
  private consent = false;
  private initialized = false;
  private withdrawals = 0;
  private sessionAttempts = 0;
  private sessionPaused = false;
  dropped = 0;
  constructor(private send: AnalyticsTransport = transport) {}
  configure(consent: boolean, account: string | null, active: boolean) {
    if (
      this.initialized &&
      (this.consent !== consent || this.account !== account)
    ) {
      const old = this.session;
      if (this.consent && !consent) this.withdrawals++;
      this.reset();
      if (old)
        void this.send("analyticsWithdraw", {
          session: old,
          reason: consent ? "account_change" : "withdraw",
        }).catch(() => {});
      this.account = account;
      this.consent = consent;
    }
    this.initialized = true;
    this.account = account;
    this.consent = consent;
    this.active = active && consent;
    if (this.active) void this.getSession();
    if (!this.active && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
  private reset() {
    this.generation++;
    this.queue = [];
    this.seen.clear();
    this.session = null;
    this.flight = null;
    this.sessionRequest = null;
    this.browser = null;
    this.lastUsed = 0;
    this.sessionAttempts = 0;
    this.sessionPaused = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    try {
      sessionStorage.removeItem(sessionKey);
      localStorage.removeItem(browserKey);
    } catch {
      /* blocked storage stays memory-only */
    }
  }
  dispose() {
    this.active = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  record(event: AnalyticsEvent, logicalKey: string) {
    if (!this.active || this.seen.has(logicalKey)) return;
    this.seen.add(logicalKey);
    if (this.seen.size > 200)
      this.seen.delete(this.seen.values().next().value!);
    if (this.sessionPaused) {
      this.dropped++;
      return;
    }
    if (this.queue.length >= 100) {
      this.queue.shift();
      this.dropped++;
    }
    this.queue.push(event);
    while (
      new TextEncoder().encode(JSON.stringify(this.queue)).length > 65536
    ) {
      this.queue.shift();
      this.dropped++;
    }
    if (!this.timer)
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, 3000);
  }
  private async getSession(): Promise<string | null> {
    if (!this.consent) return null;
    const now = Date.now();
    if (this.session && now - this.lastUsed < SESSION_IDLE) return this.session;
    if (this.flight) return this.flight;
    if (this.sessionPaused || this.sessionAttempts >= 3) return null;
    if (
      this.session ||
      (this.lastUsed > 0 && now - this.lastUsed >= SESSION_IDLE)
    ) {
      this.session = null;
      this.sessionRequest = null;
    }
    const g = this.generation,
      withdrawal = this.withdrawals;
    try {
      if (!this.browser)
        this.browser = localStorage.getItem(browserKey) || crypto.randomUUID();
      localStorage.setItem(browserKey, this.browser);
      const saved = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      if (
        saved?.account === this.account &&
        typeof saved.session === "string" &&
        now - saved.lastUsed < SESSION_IDLE
      ) {
        this.session = saved.session;
        this.lastUsed = saved.lastUsed;
        this.sessionAt = saved.startedAt;
        return this.session;
      }
    } catch {
      this.browser ??= crypto.randomUUID();
    }
    this.sessionRequest ??= crypto.randomUUID();
    this.sessionAttempts++;
    this.flight = (async () => {
      try {
        const raw = (await this.send("analyticsSession", {
          version: 1,
          consent: CONSENT_VERSION,
          browserId: this.browser,
          requestId: this.sessionRequest,
        })) as { session?: unknown; startedAt?: unknown };
        if (
          typeof raw.session !== "string" ||
          typeof raw.startedAt !== "number"
        )
          throw Error("ANALYTICS_SESSION_INVALID");
        if (g !== this.generation || !this.consent) {
          void this.send("analyticsWithdraw", {
            session: raw.session,
            reason:
              withdrawal !== this.withdrawals ? "withdraw" : "account_change",
          }).catch(() => {});
          return null;
        }
        this.session = raw.session;
        this.sessionAttempts = 0;
        this.sessionAt = raw.startedAt;
        this.lastUsed = Date.now();
        this.persist();
        return this.session;
      } catch (e) {
        if (
          g === this.generation &&
          (this.sessionAttempts >= 3 ||
            [
              "functions/failed-precondition",
              "functions/permission-denied",
              "functions/unauthenticated",
              "functions/invalid-argument",
              "functions/resource-exhausted",
            ].includes((e as { code?: string }).code ?? ""))
        ) {
          this.sessionPaused = true;
          this.dropped += this.queue.length;
          this.queue = [];
        }
        return null;
      } finally {
        if (g === this.generation) this.flight = null;
      }
    })();
    return this.flight;
  }
  private persist() {
    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          session: this.session,
          startedAt: this.sessionAt,
          lastUsed: this.lastUsed,
          account: this.account,
        }),
      );
    } catch {
      /* optional persistence */
    }
  }
  async flush() {
    if (this.sending || !this.active || !this.consent || !this.queue.length)
      return;
    this.sending = true;
    const g = this.generation;
    try {
      const session = await this.getSession();
      if (!session || g !== this.generation) return;
      const batch = this.queue.splice(0, 20);
      for (let attempt = 0; attempt < 3; attempt++) {
        if (g !== this.generation || !this.active || !this.consent) return;
        try {
          await this.send("analyticsIngest", {
            version: 1,
            session,
            events: batch,
          });
          this.lastUsed = Date.now();
          this.persist();
          break;
        } catch (e) {
          const code = (e as { code?: string }).code;
          if (code === "functions/failed-precondition") {
            this.session = null;
            this.sessionRequest = null;
          }
          if (attempt === 2) {
            this.dropped += batch.length;
            break;
          }
          await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
        }
      }
    } finally {
      this.sending = false;
      if (this.queue.length && this.active && !this.timer)
        this.timer = setTimeout(() => {
          this.timer = null;
          void this.flush();
        }, 3000);
    }
  }
  async linkOrder(orderId: string) {
    if (!this.consent) return;
    const g = this.generation,
      session = await this.getSession();
    if (session && g === this.generation)
      try {
        await this.send("analyticsLinkOrder", { session, orderId });
      } catch {
        /* undercoverage does not fail checkout */
      }
  }
}
export const analyticsTracker = new AnalyticsTracker();
/** History-entry keys recur on Back/Forward; only the current occurrence is shared. */
export function createNavigationIdentity() {
  let previous: string | null = null;
  let occurrence = "";
  return (location: {
    key: string;
    pathname: string;
    search?: string;
    hash?: string;
  }) => {
    const signature = JSON.stringify([
      location.key,
      location.pathname,
      location.search ?? "",
      location.hash ?? "",
    ]);
    if (signature !== previous) {
      previous = signature;
      occurrence = crypto.randomUUID();
    }
    return occurrence;
  };
}
export const analyticsNavigation = createNavigationIdentity();
export function productRouteMatches(
  pathname: string,
  slug: string | undefined,
) {
  if (!slug) return false;
  try {
    return (
      decodeURIComponent(pathname).replace(/\/+$/, "") === `/products/${slug}`
    );
  } catch {
    return false;
  }
}
export function setAnalyticsConsent(value: "yes" | "no") {
  try {
    localStorage.setItem(preferenceKey, value);
  } catch {
    /* memory preference */
  }
  window.dispatchEvent(
    new CustomEvent("sg:analytics-consent", { detail: value }),
  );
}
export function trackPage(path: string, navigation: string) {
  const route = publicRoute(path);
  if (route)
    analyticsTracker.record(
      { id: crypto.randomUUID(), at: Date.now(), kind: "page", route },
      `page:${navigation}`,
    );
}
export function trackProduct(
  productId: string,
  kind: "product_view" | "product_click",
  logicalKey: string = crypto.randomUUID(),
) {
  analyticsTracker.record(
    { id: crypto.randomUUID(), at: Date.now(), kind, productId },
    `${kind}:${logicalKey}`,
  );
}
export function trackAsk(text: string, turn: string) {
  analyticsTracker.record(
    {
      id: crypto.randomUUID(),
      at: Date.now(),
      kind: "ask",
      topic: classifyAsk(text),
    },
    `ask:${turn}`,
  );
}
export function linkAnalyticsOrder(id: string) {
  void analyticsTracker.linkOrder(id);
}
export const fetchDashboardAnalytics = (range: {
  from: number;
  until: number;
}) => transport("dashboardAnalytics", range);
