import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
// Exact current journey source; other checkout imports never execute in this fixture.
const source = readFileSync("src/features/cart/purchase-checkout.tsx", "utf8");
const journey = source.slice(
  source.indexOf("export function PurchaseJourney"),
  source.indexOf("export function PurchaseCheckout"),
);
await build({
  configFile: false,
  base: "./",
  plugins: [
    {
      name: "payment-qa",
      enforce: "pre",
      resolveId(s, i) {
        if (
          i?.endsWith("/purchase-payment.tsx") &&
          [
            "../../shared/firebase",
            "./cart-store",
            "./purchase-checkout",
            "./purchase-gateway",
            "./purchase-completion",
            "./purchase-sign-in",
          ].includes(s)
        )
          return "\0payment:" + s;
      },
      load(id) {
        if (!id.startsWith("\0payment:")) return;
        const s = id.slice(9);
        if (s === "./purchase-checkout")
          return { code: journey, moduleType: "tsx" };
        if (s === "./cart-store")
          return "export const useCart=()=>({refresh:async()=>{}})";
        if (s === "../../shared/firebase")
          return `export async function callService(name) {if(name!=="purchaseCheckout")return {};return {id:"00000000-0000-4000-8000-000000000001",provider:"sepay_sandbox",paymentMethod:"BANK_TRANSFER",state:new URLSearchParams(location.search).get("state")||"unknown",total:735000,expiresAt:Date.now()+60000,sepayInvoice:"qa-only",lines:[{lineId:"item1",name:"Paula’s Choice SKIN BALANCING Invisible Finish Gel Moisturizer, 2 fl oz",quantity:1,total:735000}]};}`;
        return "export const PurchaseGateway=()=>null,PurchaseCompletion=()=>null,PurchaseSignIn=()=>null;";
      },
    },
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "test-results/payment-cleanup",
    emptyOutDir: true,
    rolldownOptions: { input: ["tests/component/payment-cleanup.html", "tests/component/payment-cleanup-mobile.html"] },
  },
});
