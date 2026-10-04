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

// The SPA entry contains a real, readable public overview before JavaScript.
const html = readFileSync("dist/index.html", "utf8");
const overview =
  '<header><a href="/">SatsunicGo</a></header><main><h1>Bạn chọn món. SatsunicGo lo phần còn lại.</h1><p>Gửi tên hoặc link món hàng bạn muốn mua tại Mỹ, Nhật, Hàn. Nhận báo giá rõ ràng trước khi quyết định.</p><p>Duyệt báo giá, xác nhận cọc 50%, mua và kiểm hàng, duyệt tổng cuối rồi thanh toán số dư trước khi xuất gửi.</p><a href="/request">Gửi yêu cầu mua hộ</a><a href="/how-it-works">Cách hoạt động</a><p>Phí và chính sách thương mại đang chờ đơn vị vận hành xác nhận.</p></main>';
if (!html.includes('<div id="root"></div>'))
  throw Error("Unexpected SPA root; no prerender written");
writeFileSync(
  "dist/index.html",
  html.replace('<div id="root"></div>', `<div id="root">${overview}</div>`),
);
