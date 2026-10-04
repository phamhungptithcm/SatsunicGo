export type LiveState<T> = {
  rows: T[];
  loading: boolean;
  stale: boolean;
  error: string;
  updatedAt: number;
};
/** Public data only. No disk persistence; stopped sources cannot overwrite a newer generation. */
export function createLiveCache<T>(
  connect: (
    next: (rows: T[], stale?: boolean) => void,
    fail: (discard?: boolean) => void,
  ) => () => void,
  ttl = 60_000,
  now = Date.now,
) {
  let state: LiveState<T> = {
    rows: [],
    loading: true,
    stale: false,
    error: "",
    updatedAt: 0,
  };
  const listeners = new Set<() => void>();
  let stop: (() => void) | undefined,
    release: ReturnType<typeof setTimeout> | undefined,
    generation = 0;
  const emit = () => listeners.forEach((listener) => listener());
  function start() {
    if (stop) return;
    const current = ++generation;
    state = {
      ...state,
      loading: !state.updatedAt,
      stale: !!state.updatedAt,
      error: "",
    };
    emit();
    stop = connect(
      (rows, stale = false) => {
        if (generation !== current) return;
        const waiting = stale && rows.length === 0 && !state.updatedAt;
        state = {
          rows,
          loading: waiting,
          stale,
          error: "",
          updatedAt: waiting ? 0 : now(),
        };
        emit();
      },
      (discard = false) => {
        if (generation !== current) return;
        if (discard)
          state = {
            rows: [],
            loading: false,
            stale: false,
            error: "",
            updatedAt: 0,
          };
        state = {
          ...state,
          loading: false,
          stale: !!state.updatedAt,
          error: "Chưa cập nhật được nội dung. Thử tải lại.",
        };
        emit();
      },
    );
  }
  return {
    snapshot: () => state,
    subscribe(listener: () => void) {
      clearTimeout(release);
      listeners.add(listener);
      if (!stop) {
        if (state.updatedAt && now() - state.updatedAt > ttl)
          state = {
            rows: [],
            loading: true,
            stale: false,
            error: "",
            updatedAt: 0,
          };
        start();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size)
          release = setTimeout(() => {
            generation++;
            stop?.();
            stop = undefined;
            state = { ...state, stale: !!state.updatedAt };
          }, 200);
      };
    },
    retry() {
      generation++;
      stop?.();
      stop = undefined;
      if (listeners.size) start();
    },
  };
}
