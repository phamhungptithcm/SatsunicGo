import { lazy, Suspense, useMemo } from "react";
import type { User } from "firebase/auth";
import { login } from "../../shared/firebase";
import {
  PurchaseNavigation,
  inlinePurchasePath,
} from "../cart/purchase-navigation";
import { LoadingState } from "../../shared/Loading";
import "./purchase-workspace.css";
const Cart = lazy(() =>
  import("../cart/Cart").then((m) => ({ default: m.CartPage })),
);
const Checkout = lazy(() =>
  import("../cart/purchase-checkout").then((m) => ({
    default: m.PurchaseCheckout,
  })),
);
const Payment = lazy(() =>
  import("../cart/purchase-payment").then((m) => ({
    default: m.PurchasePayment,
  })),
);
const Request = lazy(() =>
  import("../requests/RequestForm").then((m) => ({ default: m.RequestForm })),
);

export function PurchaseWorkspace({
  path,
  onNavigate,
  onBusyChange,
  user,
  vi,
}: {
  path: string;
  onNavigate: (path: string) => void;
  onBusyChange: (busy: boolean) => void;
  user: User | null;
  vi: boolean;
}) {
  const navigation = useMemo(
    () => ({
      path,
      onBusyChange,
      navigate: (next: string) => {
        if (inlinePurchasePath(next)) onNavigate(next);
      },
    }),
    [path, onNavigate, onBusyChange],
  );
  const signIn = async () => {
    await login();
  };
  return (
    <PurchaseNavigation.Provider value={navigation}>
      <section
        className="askPurchaseWorkspace"
        aria-label={
          vi ? "Mua hàng trong Ask Anything" : "Purchase in Ask Anything"
        }
      >
        <p role="status">
          {vi
            ? "Kiểm tra sản phẩm, người nhận và tổng tiền trước khi đặt mua. Trạng thái thanh toán được kiểm tra từ hệ thống."
            : "Review items, recipient and total before placing your order. Payment status is verified by the system."}
        </p>
        <Suspense
          fallback={
            <LoadingState>
              {vi ? "Đang mở tác vụ mua hàng…" : "Opening purchase…"}
            </LoadingState>
          }
        >
          {path.startsWith("/checkout/payment/") ? (
            <Payment key={user?.uid ?? "guest"} user={user} signIn={signIn} />
          ) : path.startsWith("/checkout") ? (
            <Checkout user={user} signIn={signIn} />
          ) : path.startsWith("/request") ? (
            <Request user={user} signIn={signIn} />
          ) : (
            <Cart signIn={signIn} />
          )}
        </Suspense>
      </section>
    </PurchaseNavigation.Provider>
  );
}
