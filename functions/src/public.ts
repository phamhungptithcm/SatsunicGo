import { publicCopy } from "../../packages/domain/public-content";
import { onRequest } from "firebase-functions/v2/https";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getFirestore } from "firebase-admin/firestore";
function pageAssets(): { entry: string; css: string[]; csp: string } | null {
  for (const path of [
    "generated/public-assets.json",
    "functions/generated/public-assets.json",
  ]) {
    try {
      const asset = JSON.parse(
        readFileSync(resolve(process.cwd(), path), "utf8"),
      );
      if (
        !/^\/assets\/[a-zA-Z0-9._-]+\.js$/.test(asset.entry) ||
        !Array.isArray(asset.css) ||
        !asset.css.every((p: string) =>
          /^\/assets\/[a-zA-Z0-9._-]+\.css$/.test(p),
        ) ||
        typeof asset.csp !== "string"
      )
        continue;
      return asset;
    } catch {
      /* A pre-build source test may have no generated asset manifest. */
    }
  }
  return null;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function contentHtml(
  title: string,
  body: string,
  path: string,
  media?: { id: string; alt: string },
  seo?: { title?: string; description?: string },
) {
  const assets = pageAssets();
  const boot = assets
    ? `<script type="module" src="${assets.entry}"></script>`
    : "";
  const styles =
    assets?.css
      .map((path) => `<link rel="stylesheet" href="${path}">`)
      .join("") ?? "";
  const t = escapeHtml(title),
    metaTitle = escapeHtml(seo?.title ?? title),
    description = escapeHtml(seo?.description ?? body.slice(0, 160)),
    safePath = escapeHtml(
      new URL(path, process.env.PUBLIC_ORIGIN ?? "https://satsunicgo.web.app")
        .href,
    );
  const image =
    media && /^[a-zA-Z0-9-]{1,80}$/.test(media.id)
      ? `<img src="/media/${media.id}" alt="${escapeHtml(media.alt)}" loading="lazy" style="max-width:100%;height:auto">`
      : "";
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": path.startsWith("/products/") ? "Product" : "Article",
    ...(path.startsWith("/products/") ? { name: title } : { headline: title }),
    description: body.slice(0, 160),
    url: new URL(
      path,
      process.env.PUBLIC_ORIGIN ?? "https://satsunicgo.web.app",
    ).href,
    inLanguage: "vi",
  }).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${metaTitle} · SatsunicGo</title><meta name="description" content="${description}"><meta property="og:title" content="${metaTitle}"><meta property="og:description" content="${description}"><meta property="og:type" content="${path.startsWith("/products/") ? "website" : "article"}"><meta property="og:url" content="${safePath}"><link rel="canonical" href="${safePath}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${jsonLd}</script>${styles}${boot}<style>body{font:17px/1.8 Arial,sans-serif;color:#111c35;max-width:900px;padding:32px;margin:auto}a{color:#163cff}header{padding-bottom:32px;border-bottom:1px solid #e2e6ef}h1{font-size:42px;line-height:1.2;font-weight:600}p{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><div id="root"><header><a href="/">SatsunicGo</a> · <a href="/products">Sản phẩm</a> · <a href="/posts">Bài viết</a></header><main><h1>${t}</h1>${image}${body
    .split("\n\n")
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join(
      "",
    )}<a href="/request">Gửi yêu cầu mua hộ</a></main><footer><a href="/privacy">Quyền riêng tư</a></footer></div></body></html>`;
}
export const publicPage = onRequest(
  { region: "asia-southeast1", maxInstances: 3, concurrency: 30 },
  async (req, res) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "no-store");
    res.set(
      "Content-Security-Policy",
      pageAssets()?.csp ??
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    );
    const copy = publicCopy[req.path.replace(/^\//, "")];
    if (copy && !["membership", "support"].includes(req.path.slice(1))) {
      res.type("html").send(contentHtml(copy[0], copy[1], req.path));
      return;
    }
    const match = req.path.match(
      /^\/(products|posts)(?:\/([a-z0-9-]{2,100}))?\/?$/,
    );
    if (!match) {
      res.status(404).send("Không tìm thấy trang.");
      return;
    }
    try {
      const db = getFirestore(),
        kind = match[1],
        slug = match[2];
      let q = db.collection(kind).where("status", "==", "published");
      if (slug) q = q.where("slug", "==", slug);
      const docs = await q.limit(slug ? 1 : 30).get();
      if (slug && !docs.size) {
        res.status(404).send("Không tìm thấy trang.");
        return;
      }
      if (slug) {
        const d = docs.docs[0].data();
        res
          .type("html")
          .send(
            contentHtml(
              d.title,
              d.body,
              req.path,
              d.mediaId
                ? { id: d.mediaId, alt: d.mediaAlt ?? "Ảnh minh họa nội dung" }
                : undefined,
              { title: d.seoTitle, description: d.seoDescription },
            ),
          );
        return;
      }
      const title = kind === "products" ? "Sản phẩm tham khảo" : "Bài viết";
      const rows = docs.docs.map((d) => d.data());
      const html = contentHtml(
        title,
        rows.length
          ? "Giá tham khảo không phải xác nhận tồn kho. Nhân viên sẽ xác minh khi báo giá."
          : "Chưa có nội dung đã xuất bản.",
        req.path,
      ).replace(
        "</main>",
        rows
          .map(
            (d) =>
              `<article><h2><a href="/${kind}/${escapeHtml(d.slug)}">${escapeHtml(d.title)}</a></h2><p>${escapeHtml(String(d.body).slice(0, 200))}</p></article>`,
          )
          .join("") + "</main>",
      );
      res.type("html").send(html);
    } catch {
      res.status(503).send("Chưa tải được nội dung. Thử lại sau.");
    }
  },
);
export const publicDiscovery = onRequest(
  { region: "asia-southeast1", maxInstances: 2, concurrency: 20 },
  async (req, res) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "no-store");
    const origin = process.env.PUBLIC_ORIGIN ?? "https://satsunicgo.web.app";
    if (req.path === "/robots.txt") {
      res
        .type("text")
        .send(
          `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /staff\nDisallow: /request\nSitemap: ${origin}/sitemap.xml\n`,
        );
      return;
    }
    if (req.path !== "/sitemap.xml") {
      res.status(404).end();
      return;
    }
    try {
      const db = getFirestore(),
        rows = await Promise.all(
          ["products", "posts"].map(async (kind) => ({
            kind,
            rows: await db
              .collection(kind)
              .where("status", "==", "published")
              .limit(200)
              .get(),
          })),
        );
      const urls = [
        "/",
        "/how-it-works",
        "/fees",
        "/products",
        "/posts",
        ...rows.flatMap(({ kind, rows }) =>
          rows.docs
            .filter((d) => /^[a-z0-9-]{2,100}$/.test(d.data().slug))
            .map((d) => `/${kind}/${d.data().slug}`),
        ),
      ];
      res
        .type("application/xml")
        .send(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`).join("")}</urlset>`,
        );
    } catch {
      res.status(503).end();
    }
  },
);
