import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const manifest = JSON.parse(readFileSync("dist/.vite/manifest.json", "utf8"));
const entry = manifest["index.html"];
if (!entry?.isEntry || !/^assets\/[a-zA-Z0-9._-]+\.js$/.test(entry.file))
  throw Error("Missing validated Vite entry");
const config = JSON.parse(readFileSync("firebase.json", "utf8"));
const csp = config.hosting.headers
  .flatMap((h) => h.headers)
  .find((h) => h.key === "Content-Security-Policy")?.value;
if (!csp) throw Error("Missing Hosting CSP");
mkdirSync("functions/generated", { recursive: true });
writeFileSync(
  "functions/generated/public-assets.json",
  JSON.stringify(
    {
      entry: `/${entry.file}`,
      css: (entry.css ?? []).map((p) => `/${p}`),
      csp,
    },
    null,
    2,
  ) + "\n",
);

// Paint a self-contained waiting state before assets arrive. Keep the readable
// overview for browsers without JavaScript, rather than flashing it before React.
const html = readFileSync("dist/index.html", "utf8");
const overview =
  '<header><a href="/">SatsunicGo</a></header><main><h1>Bạn chọn món. SatsunicGo lo phần còn lại.</h1><p>Chọn sản phẩm đã niêm yết và thanh toán toàn bộ để nhân viên mua hộ.</p><p>Món chưa được niêm yết: gửi tên hoặc link để được xem xét, nhận báo giá rồi thanh toán thành hai đợt.</p><a href="/products">Chọn sản phẩm</a><a href="/request">Gửi yêu cầu mua hộ</a><a href="/fees">Xem biểu phí</a><a href="/how-it-works">Cách hoạt động</a><p>Tra cứu tiến độ đơn hàng và cước gửi Mỹ ↔ Việt Nam trong Hỏi SatsunicGo. Tổng phí vận chuyển cần được xác nhận trước khi gửi.</p></main>';
if (!html.includes('<div id="root"></div>'))
  throw Error("Unexpected SPA root; no prerender written");
const bootStyles = `<style>
#startup{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;box-sizing:border-box;background:#fff;color:#111c35;font:14px/1.6 system-ui,sans-serif;text-align:center}
#startup p{margin:0;max-width:100%;overflow-wrap:anywhere}
#startup a{color:#647087;text-underline-offset:3px}
#startup a:focus-visible{outline:2px solid #163cff;outline-offset:4px}
#startup .startup-bar{width:128px;height:4px;border-radius:999px;background:#e7edff;overflow:hidden}
#startup .startup-bar span{display:block;width:40%;height:100%;border-radius:inherit;background:#163cff;animation:startup-slide 1.5s ease-in-out infinite}
@keyframes startup-slide{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
@media(prefers-reduced-motion:reduce){#startup .startup-bar span{animation:none;transform:translateX(75%)}}
</style>`;
const startup = `<div id="startup"><div class="startup-bar" aria-hidden="true"><span></span></div><p role="status" aria-live="polite">Đang tải trang…</p><a href="">Tải lại</a></div><noscript><style>#startup{display:none}</style>${overview}</noscript>`;
writeFileSync(
  "dist/index.html",
  html
    .replace("</head>", `${bootStyles}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${startup}</div>`),
);
