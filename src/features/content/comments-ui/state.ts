/** One pending identity for one exact write: never silently fork an unknown result. */
export function commentRetry() {
  let pending: { key: string; operationId: string } | null = null;
  return {
    begin(payload: unknown, makeId: () => string = () => crypto.randomUUID()) {
      const key = JSON.stringify(payload);
      if (pending && pending.key !== key)
        throw new Error("COMMENT_RETRY_REQUIRED");
      pending ??= { key, operationId: makeId() };
      return pending.operationId;
    },
    clear() {
      pending = null;
    },
    pending() {
      return pending !== null;
    },
  };
}
export function commentHash(hash: string) {
  return hash.match(/^#comment-([a-zA-Z0-9_-]{1,160})$/)?.[1] ?? null;
}
export function commentStatus(status: string) {
  return (
    (
      {
        approved: "Đã đăng",
        pending: "Chờ duyệt",
        hidden: "Đã ẩn",
        rejected: "Không được duyệt",
        deleted: "Đã xóa",
      } as Record<string, string>
    )[status] ?? "Chưa xác định"
  );
}
