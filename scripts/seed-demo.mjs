import { assertDemoEnvironment } from "./demo-guard.mjs";
import process from "node:process";
import console from "node:console";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
assertDemoEnvironment(process.env);
const mode = process.argv[2] ?? "seed";
if (!["seed", "reset", "check", "backfill", "backfill-apply"].includes(mode))
  throw Error("Choose seed/reset/check/backfill/backfill-apply");
initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(),
  auth = getAuth(),
  now = Date.now();
const namespace = "e2e005";
const fixture = { fixtureNamespace: namespace };
const profiles = [
  ["customer-a", [], "Nguyễn An"],
  ["customer-b", [], "Trần Bình"],
  ["owner", ["OWNER"], "Chủ vận hành"],
  ["manager", ["OPERATIONS_MANAGER"], "Quản lý vận hành"],
  ["buyer", ["BUYER"], "Nhân viên mua hàng"],
  ["warehouse", ["WAREHOUSE"], "Nhân viên kho"],
  ["finance", ["FINANCE"], "Nhân viên tài chính"],
  ["support", ["SUPPORT"], "Nhân viên hỗ trợ"],
  ["editor", ["CONTENT_EDITOR"], "Biên tập viên"],
  ["revoked", ["SUPPORT"], "Nhân viên đã thu hồi"],
  ["locked", ["SUPPORT"], "Tài khoản đã khóa"],
];
const normalize = (v) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
if (mode === "reset") {
  // Delete fixture-marked documents only, in bounded batches. No database-wide reset.
  const kinds = [
    "users",
    "staffAccess",
    "crmCustomers",
    "orders",
    "supportTickets",
    "membershipSubscriptions",
    "products",
    "posts",
    "outboxJobs",
    "transferReviews",
    "paymentExceptions",
    "packages",
    "customerShipments",
    "auditEvents",
    "settings",
    "membershipPlans",
  ];
  for (const kind of kinds) {
    let rows;
    do {
      rows = await db
        .collection(kind)
        .where("fixtureNamespace", "==", namespace)
        .limit(100)
        .get();
      const batch = db.batch();
      rows.docs.forEach((d) => batch.delete(d.ref));
      if (rows.size) await batch.commit();
    } while (rows.size === 100);
  }
  for (const [suffix] of profiles) {
    try {
      await auth.deleteUser(`${namespace}-${suffix}`);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
    }
  }
  console.log(
    "Removed only e2e005 fixture documents and identities. Command-created records are preserved.",
  );
} else if (mode.startsWith("backfill")) {
  let after = process.env.DEMO_BACKFILL_AFTER || null,
    count = 0;
  do {
    let query = db.collection("users").orderBy("__name__").limit(100);
    if (after) query = query.startAfter(after);
    const rows = await query.get();
    const batch = db.batch();
    let changed = 0;
    for (const user of rows.docs) {
      const name = normalize(user.data().displayName || "");
      if (user.data().searchName !== name) {
        changed++;
        if (mode === "backfill-apply")
          batch.update(user.ref, { searchName: name });
      }
    }
    if (mode === "backfill-apply" && changed) await batch.commit();
    count += changed;
    after = rows.docs.at(-1)?.id ?? null;
    // Cursor logged is a synthetic emulator ID, never production/customer data.
    console.log(
      JSON.stringify({ mode, page: rows.size, changed, resumeAfter: after }),
    );
    if (rows.size < 100) break;
  } while (after);
  console.log(`${mode}: ${count} names need normalization`);
} else if (mode === "check") {
  const ids = [
    "settings/pricing",
    "settings/ai",
    "settings/email",
    `users/${namespace}-customer-a`,
    `staffAccess/${namespace}-owner`,
  ];
  const rows = await db.getAll(...ids.map((id) => db.doc(id)));
  console.log(
    JSON.stringify({
      environment: "demo-satsunicgo",
      required: rows.map((r, i) => ({ path: ids[i], present: r.exists })),
      liveTransactions: false,
    }),
  );
  if (rows.some((r) => !r.exists)) process.exitCode = 1;
} else {
  const writes = [];
  function add(path, data) {
    writes.push([path, { ...data, ...fixture }]);
  }
  for (const [suffix, roles, displayName] of profiles) {
    const uid = `${namespace}-${suffix}`,
      email = `${suffix}@satsunicgo.example.invalid`;
    try {
      await auth.getUser(uid);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      await auth.createUser({
        uid,
        email,
        password: "Demo-only-e2e005!",
        displayName,
        emailVerified: true,
      });
    }
    const identity = await auth.getUser(uid);
    if (
      !identity.providerData.some(
        (provider) => provider.providerId === "google.com",
      )
    ) {
      await auth.updateUser(uid, {
        providerToLink: { providerId: "google.com", uid, email, displayName },
      });
    }
    add(`users/${uid}`, {
      ownerId: uid,
      displayName,
      searchName: normalize(displayName),
      businessName: "",
      marketingConsent: false,
      version: 1,
      createdAt: now,
      locked: suffix === "locked",
    });
    if (roles.length)
      add(`staffAccess/${uid}`, {
        active: suffix !== "revoked",
        locked: suffix === "locked",
        roles,
        orderIds: ["e2e005-purchasing"],
        version: 1,
      });
  }
  const customer = "e2e005-customer-a";
  add(`crmCustomers/${customer}`, {
    tags: ["Cần theo dõi"],
    notes: "Ghi chú thử nghiệm riêng cho nhân viên",
    assigneeId: "e2e005-support",
    followUpAt: now - 3600000,
    version: 1,
    changedAt: now,
  });
  add("crmCustomers/e2e005-customer-b", {
    tags: ["Khách mới"],
    notes: "Dữ liệu emulator",
    assigneeId: "e2e005-manager",
    followUpAt: now + 86400000,
    version: 1,
    changedAt: now,
  });
  const quote = {
    goods: 1700000,
    service: 100000,
    sourceCosts: 0,
    internationalShipping: 150000,
    destinationShipping: 50000,
    discount: 0,
    sourceCurrency: "USD",
    sourceMinor: 6800,
    fxNumerator: 250,
    fxDenominator: 1,
    termsVersion: "demo-v1",
    expiresAt: now + 86400000,
    verifiedProduct: "Sản phẩm thử nghiệm đã xác minh",
  };
  for (const [suffix, stage] of [
    ["requested", "REQUESTED"],
    ["quoted", "QUOTED"],
    ["purchasing", "PURCHASING"],
    ["received", "ORIGIN_RECEIVED"],
    ["packed", "PACKED"],
    ["ready", "READY_TO_SHIP"],
    ["transit", "IN_TRANSIT"],
  ]) {
    const id = `${namespace}-${suffix}`;
    const o = {
      id,
      ownerId: customer,
      market: "US",
      items: [
        {
          name: `Sản phẩm thử nghiệm · ${suffix}`,
          quantity: 2,
          variant: "Mẫu thử",
          url: "",
          condition: "new",
        },
      ],
      notes: "Dữ liệu giả lập chỉ dành cho emulator",
      stage,
      version: 1,
      createdAt: now - 86400000,
      collected: [
        "purchasing",
        "received",
        "packed",
        "ready",
        "transit",
      ].includes(suffix)
        ? 1000000
        : 0,
      refunded: 0,
    };
    if (suffix !== "requested") Object.assign(o, { quote, quoteVersion: 1 });
    if (
      ["purchasing", "received", "packed", "ready", "transit"].includes(suffix)
    )
      Object.assign(o, {
        acceptedAt: now - 3600000,
        acceptedQuoteVersion: 1,
        deposit: 1000000,
      });
    if (["received", "packed", "ready", "transit"].includes(suffix))
      Object.assign(o, {
        purchasedQuantity: 2,
        purchasedLines: [2],
        receivedQuantity: 2,
        receivedLines: [2],
      });
    if (["packed", "ready", "transit"].includes(suffix))
      Object.assign(o, {
        packedQuantity: 2,
        packingComplete: true,
        finalTotal: 2160000,
        finalApproved: suffix !== "packed",
      });
    if (["ready", "transit"].includes(suffix)) o.collected = 2160000;
    add(`orders/${id}`, o);
  }
  add("orders/e2e005-held", {
    id: "e2e005-held",
    ownerId: customer,
    market: "JP",
    items: [
      { name: "Hàng cần kiểm tra", quantity: 1, variant: "Mẫu thử", url: "" },
    ],
    notes: "",
    stage: "REQUESTED",
    hold: "Chờ kiểm tra điều kiện vận chuyển",
    collected: 0,
    refunded: 0,
    version: 1,
    createdAt: now,
  });
  add("supportTickets/e2e005-ticket", {
    ownerId: customer,
    subject: "Hỏi về lịch nhận hàng",
    message: "Hội thoại thử nghiệm",
    status: "open",
    version: 1,
    createdAt: now,
  });
  add("supportTickets/e2e005-ticket-b", {
    ownerId: "e2e005-customer-b",
    subject: "Hội thoại riêng của khách B",
    message: "Không hiển thị cho khách A",
    status: "open",
    version: 1,
    createdAt: now,
  });
  add("membershipSubscriptions/e2e005-customer-a", {
    ownerId: customer,
    planId: "e2e005-plus",
    planSnapshot: {
      name: "PLUS",
      periodDays: 30,
      price: 100000,
      serviceDiscountBps: 500,
      discountCap: 50000,
    },
    startsAt: now - 86400000,
    state: "active",
    endsAt: now + 7 * 86400000,
    serviceDiscountBps: 500,
    discountCap: 50000,
    version: 1,
  });
  add("membershipPlans/e2e005-plus", {
    name: "PLUS",
    status: "published",
    price: 100000,
    periodDays: 30,
    serviceDiscountBps: 500,
    discountCap: 50000,
    version: 1,
    minimumService: 0,
    createdAt: now,
  });
  add("products/e2e005-product", {
    title: "Sản phẩm thử nghiệm",
    slug: "san-pham-thu-nghiem",
    body: "Nội dung giả lập chỉ dành cho emulator. Giá và tồn kho cần được nhân viên kiểm tra.",
    status: "published",
    market: "US",
    version: 1,
    createdAt: now,
  });
  add("posts/e2e005-post", {
    title: "Bài viết thử nghiệm",
    slug: "bai-viet-thu-nghiem",
    body: "Nội dung dùng để kiểm tra bản nháp và xuất bản trong emulator.",
    status: "draft",
    version: 1,
    createdAt: now,
  });
  add("transferReviews/e2e005-transfer", {
    orderId: "e2e005-purchasing",
    ownerId: customer,
    amount: 500000,
    reference: "DEMO-ONLY-TRANSFER",
    status: "pending",
    createdAt: now,
  });
  add("paymentExceptions/e2e005-exception", {
    orderId: "e2e005-purchasing",
    ownerId: customer,
    amount: 100000,
    reason: "fixture-mismatch",
    state: "open",
    createdAt: now,
  });
  for (const [suffix, state, emailState] of [
    ["pending", "queued", "not_queued"],
    ["unknown", "inAppDelivered", "unknown"],
  ])
    add(`outboxJobs/e2e005-${suffix}`, {
      ownerId: customer,
      orderId: "e2e005-requested",
      action: "submitRequest",
      state,
      emailState,
      createdAt: now,
    });
  add("auditEvents/e2e005-seed", {
    actor: "demo-seed",
    action: "seedDemo",
    resourceId: namespace,
    createdAt: now,
  });
  add("settings/pricing", {
    approved: true,
    termsVersion: "demo-v1",
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 1, denominator: 1 },
      KRW: { numerator: 1, denominator: 1 },
    },
    effectiveFrom: now - 86400000,
    expiresAt: now + 86400000,
  });
  add("settings/ai", { enabled: false });
  add("settings/email", { enabled: false });
  for (let offset = 0; offset < writes.length; offset += 100) {
    const batch = db.batch();
    // Only recreate missing demo documents; repeated seeding preserves interactive changes.
    const page = writes.slice(offset, offset + 100),
      snapshots = await db.getAll(...page.map(([id]) => db.doc(id)));
    page.forEach(([id, data], i) => {
      if (!snapshots[i].exists) batch.create(db.doc(id), data);
    });
    await batch.commit();
  }
  console.log(
    `Demo seed ready: ${writes.length} fixture definitions. Existing data preserved. Login profiles documented in LOCAL_RUNBOOK.md.`,
  );
}
await db.terminate();
