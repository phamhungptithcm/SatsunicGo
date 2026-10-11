import { useEffect, useRef, useState } from "react";
import { auth, callService } from "../../shared/firebase";
import {
  publicTrackingSchema,
  type PublicOrderTracking,
} from "../../../packages/domain/public-order-tracking";
import type { CustomerOrderTracking } from "../../../packages/domain/order-tracking";
import { customerTrackingSchema } from "../orders/account-tracking-request";
import { TrackingRefreshLoop, type RefreshState } from "./tracking-refresh";
import { watchTrackingOrder } from "./tracking-watch";
export function TrackingRefresh(props: {
  uid: string | null;
  order?: CustomerOrderTracking;
  code?: string;
  language: "vi" | "en";
  update: (value: CustomerOrderTracking | PublicOrderTracking) => void;
  clear: () => void;
}) {
  const latest = useRef(props);
  latest.current = props;
  const loop = useRef<TrackingRefreshLoop<
    CustomerOrderTracking | PublicOrderTracking
  > | null>(null);
  const [state, setState] = useState<RefreshState>("ready");
  const orderId = props.order?.orderId;
  useEffect(() => {
    const uid = props.uid;
    let revision = latest.current.order?.version ?? 0;
    let active = true;
    const current = () => active && (auth?.currentUser?.uid ?? null) === uid;
    const reader = new TrackingRefreshLoop<
      CustomerOrderTracking | PublicOrderTracking
    >({
      guest: !orderId,
      current,
      available: () =>
        document.visibilityState !== "hidden" && navigator.onLine !== false,
      read: async () => {
        if (orderId) {
          const value = customerTrackingSchema.parse(
            await callService("customerOrderTracking", { orderId }),
          );
          if (value.orderId !== orderId || value.version < revision)
            throw Error("Invalid tracking revision");
          return value;
        }
        return publicTrackingSchema.parse(
          await callService("publicOrderTracking", { code: props.code }),
        );
      },
      data: (value) => latest.current.update(value),
      state: (value) => {
        if (current()) {
          setState(value);
          if (value === "unavailable") latest.current.clear();
        }
      },
    });
    loop.current = reader;
    reader.start();
    const unsubscribe =
      orderId && uid
        ? watchTrackingOrder(
            uid,
            orderId,
            (version) => {
              if (version > revision) {
                revision = version;
                reader.changed();
              }
            },
            () => reader.fail(),
          )
        : () => {};
    const resume = () => {
      void reader.refresh(true);
    };
    const offline = () => {
      if (current()) setState("stale");
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", offline);
    return () => {
      active = false;
      reader.stop();
      unsubscribe();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
      loop.current = null;
    };
  }, [props.uid, props.code, orderId]);
  const vi = props.language === "vi";
  return (
    <div className="orderTracking ot ot-refresh">
      <span role="status">
        {state === "refreshing"
          ? vi
            ? "Đang cập nhật tiến độ…"
            : "Updating progress…"
          : state === "stale"
            ? vi
              ? "Chưa lấy được cập nhật mới. Thông tin bên trên có thể đã cũ."
              : "New updates are unavailable. The information above may be out of date."
            : state === "cooldown"
              ? vi
                ? "Vừa kiểm tra tiến độ. Sẽ kiểm tra lại sau một phút."
                : "Progress was just checked. Checks resume after one minute."
              : state === "unavailable"
                ? vi
                  ? "Không thể tiếp tục tra cứu. Nhập lại mã hoặc kiểm tra tài khoản."
                  : "Tracking is unavailable. Re-enter the code or check your account."
                : vi
                  ? "Tự kiểm tra cập nhật khi đang mở. Tra cứu khách tối đa mỗi phút."
                  : "Checks for updates while open. Guest tracking checks at most once a minute."}
      </span>
      <button
        type="button"
        disabled={state === "unavailable"}
        aria-disabled={state === "refreshing"}
        onClick={() => {
          if (state === "refreshing") return;
          void loop.current?.refresh(true);
        }}
      >
        {vi ? "Cập nhật tiến độ" : "Refresh progress"}
      </button>
    </div>
  );
}
