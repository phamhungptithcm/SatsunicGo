import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { User } from "firebase/auth";
import { PurchasePayment } from "../../src/features/cart/purchase-payment";
import { ToastHost } from "../../src/shared/Toast";
import "../../src/styles/global.css";
createRoot(document.getElementById("root")!).render(<>
  <MemoryRouter
    initialEntries={["/checkout/payment/00000000-0000-4000-8000-000000000001"]}
  >
    <Routes>
      <Route
        path="/checkout/payment/:id"
        element={
          <PurchasePayment
            user={{ uid: "qa-only" } as User}
            signIn={() => {}}
          />
        }
      />
    </Routes>
  </MemoryRouter><ToastHost /></>,
);
