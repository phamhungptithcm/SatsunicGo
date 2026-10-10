import { LoadingState } from "../../shared/Loading";
import { useEffect, useRef, useState } from "react";
import { auth, callService } from "../../shared/firebase";
import type { CustomerOrderTracking } from "../../../packages/domain/order-tracking";
import { AccountTrackingRequest } from "./account-tracking-request";
import { PublicTrackingCode } from "./PublicTrackingCode";
import { OrderTracking } from "../ask/OrderTracking";

type ReadState = {
  scope: string;
  tracking?: CustomerOrderTracking;
  error?: boolean;
};
/** Private, request-scoped read; never stored in public catalog caches. */
export function AccountTracking({
  uid,
  orderId,
  version,
}: {
  uid: string;
  orderId: string;
  version: number;
}) {
  const request = useRef(new AccountTrackingRequest());
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<ReadState | null>(null);
  const scope = JSON.stringify([uid, orderId, version, retry]);
  useEffect(() => {
    let active = true;
    const owns = () => active && auth?.currentUser?.uid === uid;
    setState(null);
    if (auth?.currentUser?.uid !== uid) return;
    const reader = request.current;
    void reader.run({
      orderId,
      version,
      owns,
      read: () => callService<unknown>("customerOrderTracking", { orderId }),
      success: (tracking) => setState({ scope, tracking }),
      failure: () => setState({ scope, error: true }),
    });
    return () => {
      active = false;
      reader.invalidate();
    };
  }, [uid, orderId, version, scope]);
  const current =
    state?.scope === scope && auth?.currentUser?.uid === uid ? state : null;
  if (auth?.currentUser?.uid !== uid)
    return (
      <p className="accountTrackingNotice" role="status">
        Phiên đăng nhập đã thay đổi. Mở lại đơn hàng trong tài khoản của bạn.
      </p>
    );
  if (current?.tracking)
    return (
      <>
        <OrderTracking tracking={current.tracking} />
        <PublicTrackingCode uid={uid} orderId={orderId} version={version} />
      </>
    );
  if (current?.error)
    return (
      <section className="accountTrackingNotice" aria-label="Theo dõi đơn hàng">
        <p role="status">
          Chưa tải được tiến trình đơn hàng. Kiểm tra kết nối và thử lại.
        </p>
        <button onClick={() => setRetry((value) => value + 1)}>
          Tải lại tiến trình
        </button>
      </section>
    );
  return (
    <LoadingState className="accountTrackingNotice" overlay={false}>
      Đang tải tiến trình đơn hàng…
    </LoadingState>
  );
}
