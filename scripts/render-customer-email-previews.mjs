/** Render the production renderer with fictional fixtures; never contacts a provider. */
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const buildRoot = process.env.CUSTOMER_EMAIL_BUILD_ROOT;
if (!buildRoot?.startsWith("/private/tmp/"))
  throw Error("ISOLATED_BUILD_REQUIRED");
const require = createRequire(import.meta.url);
const {
  customerEmailCatalog,
  parseCustomerEvent,
  customerFormattedFields,
} = require(resolve(buildRoot, "packages/domain/customer-notification.js"));
const { renderCustomerEmail } = require(
  resolve(buildRoot, "functions/src/email-content.js"),
);
const root = resolve("docs/reviews/CUSTOMER-EMAILS-20261009"),
  fixtures = JSON.parse(readFileSync(root + "/PREVIEW-FIXTURES.json", "utf8"));
const money = new Set([
    "quotedTotal",
    "paidAmount",
    "differenceAmount",
    "previousTotal",
    "proposedTotal",
    "balanceDue",
    "finalTotal",
    "netPaid",
    "zeroAmount",
    "excessAmount",
    "refundAmount",
  ]),
  dates = new Set(["observedAt", "refundRecordedAt", "endsAt"]);
mkdirSync(root + "/runtime-samples", { recursive: true });
const results = [];
for (const [id, row] of Object.entries(customerEmailCatalog)) {
  const common = { ...fixtures.common, ...fixtures.overrides[id] };
  const payload = Object.fromEntries(
    row.fields.map((field) => [
      field,
      money.has(field)
        ? Number(common[field].replace(/[^0-9]/g, ""))
        : dates.has(field)
          ? 1791554400000
          : field === "paymentScope"
            ? "custom_initial"
            : common[field],
    ]),
  );
  const event = parseCustomerEvent({
    schemaVersion: 1,
    templateVersion: 2,
    templateId: id,
    ownerId: "fictional-owner",
    entityId: "fictional-entity",
    entityVersion: 1,
    eventId: "fictional-event",
    occurredAt: 1791554400000,
    orderId: "fictional-order",
    payload,
  });
  const output = renderCustomerEmail(event);
  writeFileSync(`${root}/runtime-samples/${id}.html`, output.html);
  writeFileSync(`${root}/runtime-samples/${id}.txt`, output.text);
  results.push({
    id,
    subject: output.subject,
    preheader: row.preheader.replace(
      /\{\{([A-Za-z]+)\}\}/g,
      (_m, key) => customerFormattedFields(event)[key],
    ),
    bytes: Buffer.byteLength(output.html),
  });
}
let gallery = readFileSync(root + "/preview.html", "utf8")
  .replaceAll("'samples/'", "'runtime-samples/'")
  .replace(
    "Bản thiết kế · Dữ liệu minh họa",
    "Backend renderer · Dữ liệu minh họa",
  );
const metadata = JSON.parse(
  readFileSync(root + "/TEMPLATES.vi.json", "utf8"),
).templates.map((row) => ({
  id: row.id,
  heading: row.design.heading,
  group: row.group,
  policy: row.deliveryPolicy,
  guard: row.sendGuard,
  ...results.find((result) => result.id === row.id),
}));
gallery = gallery
  .replace(
    /const rows=.*?;const frame=/s,
    "const rows=" +
      JSON.stringify(metadata).replaceAll("<", "\\u003c") +
      ";const frame=",
  )
  .replace(
    ".top small{font-size:10px}",
    ".top small{font-size:10px}.top .brand>small{display:none}.top>small{white-space:nowrap}",
  );
writeFileSync(root + "/runtime-preview.html", gallery);
const longEvent = parseCustomerEvent({
  schemaVersion: 1,
  templateVersion: 2,
  templateId: "price_change_proposed",
  ownerId: "fictional-owner",
  entityId: "fictional-order",
  entityVersion: 1,
  eventId: "fictional-long",
  occurredAt: 1791554400000,
  orderId: "fictional-order",
  payload: {
    orderRef: "X".repeat(80),
    customerReason: "Giá".repeat(300),
    previousTotal: 9007199254740000,
    proposedTotal: 9007199254740991,
    differenceAmount: 991,
  },
});
writeFileSync(
  root + "/runtime-samples/long-content.html",
  renderCustomerEmail(longEvent).html,
);
writeFileSync(
  root + "/RUNTIME-RENDER-VALIDATION.json",
  JSON.stringify(
    {
      status: "PASSED",
      count: results.length,
      maxHtmlBytes: Math.max(...results.map((r) => r.bytes)),
      source: "renderCustomerEmail",
      providerSending: "NOT_RUN",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    status: "PASSED",
    rendered: results.length,
    maxHtmlBytes: Math.max(...results.map((r) => r.bytes)),
  }),
);
