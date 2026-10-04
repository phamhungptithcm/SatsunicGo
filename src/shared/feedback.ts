const listeners = new Set<() => void>();
let pending = 0;
export const progressSnapshot = () => pending;
export const subscribeProgress = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function beginProgress() {
  pending++;
  listeners.forEach((l) => l());
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    pending--;
    listeners.forEach((l) => l());
  };
}
export async function withProgress<T>(operation: () => Promise<T>) {
  const finish = beginProgress();
  try {
    return await operation();
  } finally {
    finish();
  }
}
export function createCountdown(
  duration: number,
  tick: (remaining: number, paused: boolean) => void,
  expire: () => void,
  now = () => performance.now(),
) {
  let remaining = duration,
    started = now(),
    disposed = false;
  const holds = new Set<string>();
  let timeout: ReturnType<typeof setTimeout>,
    interval: ReturnType<typeof setInterval>;
  const left = () =>
    Math.max(0, remaining - (holds.size ? 0 : now() - started));
  const clear = () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
  const run = () => {
    started = now();
    tick(remaining, false);
    timeout = setTimeout(() => {
      if (disposed) return;
      disposed = true;
      clear();
      expire();
    }, remaining);
    interval = setInterval(() => tick(left(), false), 200);
  };
  run();
  return {
    hold(reason: string, active: boolean) {
      if (disposed || holds.has(reason) === active) return;
      if (active) {
        remaining = left();
        clear();
        holds.add(reason);
        tick(remaining, true);
      } else {
        holds.delete(reason);
        if (!holds.size) run();
      }
    },
    dispose() {
      disposed = true;
      clear();
    },
  };
}
export type Notice = {
  id: number;
  text: string;
  kind: "success" | "error" | "info";
};
let notice: Notice | null = null,
  sequence = 0;
const notices = new Set<() => void>();
export const noticeSnapshot = () => notice;
export const subscribeNotice = (listener: () => void) => {
  notices.add(listener);
  return () => {
    notices.delete(listener);
  };
};
export function notify(text: string, kind: Notice["kind"] = "info") {
  notice = { id: ++sequence, text, kind };
  notices.forEach((l) => l());
}
export function dismissNotice(id: number) {
  if (notice?.id !== id) return;
  notice = null;
  notices.forEach((l) => l());
}
