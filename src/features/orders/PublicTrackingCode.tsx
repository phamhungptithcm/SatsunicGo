import { readWithAbort } from "../ask/guest-tracking-request";
import { useEffect, useRef, useState } from "react";
import { auth, callService } from "../../shared/firebase";
import { publicTrackingCode } from "../../../packages/domain/public-order-tracking";
import { z } from "zod";
const result = z
  .object({
    code: publicTrackingCode.nullable(),
    expiresAt: z.number().int().positive(),
  })
  .strict();
export function PublicTrackingCode({
  uid,
  orderId,
  version,
}: {
  uid: string;
  orderId: string;
  version: number;
}) {
  const [state, setState] = useState<{
      scope: string;
      code: string | null;
      expiresAt: number;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const generation = useRef(0),
    operation = useRef<{ action: "issue" | "revoke"; id: string } | null>(null);
  const scope = JSON.stringify([uid, orderId, version]);
  useEffect(() => {
    generation.current++;
    operation.current = null;
    setState(null);
    setBusy(false);
    setError(false);
    return () => {
      generation.current++;
    };
  }, [scope]);
  const current =
    state?.scope === scope && auth?.currentUser?.uid === uid ? state : null;
  async function run(action: "issue" | "revoke") {
    if (auth?.currentUser?.uid !== uid || busy) return;
    const request = ++generation.current;
    setBusy(true);
    setError(false);
    if (operation.current?.action !== action)
      operation.current = { action, id: crypto.randomUUID() };
    try {
      const value = result.parse(
        await readWithAbort(
          () =>
            callService<unknown>("managePublicTrackingCode", {
              action,
              orderId,
              expectedVersion: version,
              operationId: operation.current!.id,
            }),
          AbortSignal.timeout(15_000),
        ),
      );
      if (request !== generation.current || auth?.currentUser?.uid !== uid)
        return;
      setState({ scope, ...value });
      operation.current = null;
    } catch {
      if (request === generation.current && auth?.currentUser?.uid === uid)
        setError(true);
    } finally {
      if (request === generation.current) setBusy(false);
    }
  }
  if (auth?.currentUser?.uid !== uid) return null;
  return (
    <section className="publicTrackingCode" aria-label="Mã tra cứu cho khách">
      <strong>Mã tra cứu cho khách</strong>
      <p>
        Người có mã này có thể xem tiến độ và thời gian giao dự kiến trong Ask
        mà không cần đăng nhập. Mỗi lần tạo mã mới sẽ vô hiệu hóa mã cũ.
      </p>
      {current?.code && (
        <>
          <code>{current.code}</code>
          <p>Hết hạn: {new Date(current.expiresAt).toLocaleString("vi-VN")}</p>
        </>
      )}
      <button disabled={busy} onClick={() => void run("issue")}>
        {busy ? "Đang xử lý…" : current?.code ? "Tạo mã mới" : "Tạo mã tra cứu"}
      </button>
      <button disabled={busy} onClick={() => void run("revoke")}>
        Thu hồi mã
      </button>
      {current && !current.code && <p role="status">Đã thu hồi mã tra cứu.</p>}
      {error && (
        <p role="alert">
          Chưa xử lý được mã tra cứu. Kiểm tra kết nối và thử lại. Nếu đơn đã
          thay đổi, tải lại trang.
        </p>
      )}
    </section>
  );
}
