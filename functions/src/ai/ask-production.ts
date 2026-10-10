import { getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { createHash } from "node:crypto";
import { warn } from "firebase-functions/logger";
import { z } from "zod";

// Reviewed 2026-10-10: standard Vertex text input $0.10/M; output incl.
// reasoning $0.40/M. At 100,000 VND/USD, max 10k+800 costs 132 VND.
// 1,000 VND/attempt reserves >7x that envelope; never release uncertainty.
// Model retires Oct 20. This short activation expires well before retirement.
export const customerAiLimits = Object.freeze({
  releaseId: "ask-customer-20261010-v1",
  model: "gemini-2.5-flash-lite",
  location: "us-central1",
  maxInputTokens: 10000,
  maxOutputTokens: 800,
  reserveVnd: 1000,
  maxBudgetVnd: 50000,
  perUserBudgetVnd: 5000,
  globalPerMinute: 10,
  userPerMinute: 2,
  windowMs: 86400000,
  pricingExpiresAt: Date.parse("2026-10-12T00:00:00Z"),
});
export const customerAiPolicySchema = z
  .object({
    schemaVersion: z.literal(1),
    enabled: z.boolean(),
    audience: z.enum(["owner-canary", "customers"]),
    canaryUid: z.string().min(1).max(128),
    maxBudgetVnd: z.literal(50000),
    activatedAt: z.number().int().positive().safe(),
    expiresAt: z.number().int().positive().safe(),
    version: z.number().int().positive().safe(),
    releaseId: z.literal(customerAiLimits.releaseId),
  })
  .strip();
export type CustomerAiPolicy = z.infer<typeof customerAiPolicySchema>;
const unavailable = () =>
  new HttpsError(
    "unavailable",
    "Em chưa thể hỗ trợ yêu cầu này lúc này. Anh/chị có thể gửi yêu cầu mua hộ.",
  );
export function customerAiEnvironmentReady(actualProject: unknown) {
  return (
    actualProject === "satsunicgo" &&
    process.env.GCLOUD_PROJECT === "satsunicgo" &&
    (!process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT === "satsunicgo") &&
    (!process.env.FUNCTIONS_EMULATOR ||
      process.env.FUNCTIONS_EMULATOR === "false") &&
    !process.env.FIRESTORE_EMULATOR_HOST &&
    !process.env.FIREBASE_AUTH_EMULATOR_HOST
  );
}
export function customerAiReady(now: number) {
  return (
    Number.isSafeInteger(now) &&
    now > 0 &&
    now < customerAiLimits.pricingExpiresAt
  );
}
export function checkCustomerAiPolicy(
  value: unknown,
  uid: string,
  now: number,
) {
  const p = customerAiPolicySchema.safeParse(value);
  if (
    !customerAiReady(now) ||
    !p.success ||
    !p.data.enabled ||
    !uid ||
    p.data.activatedAt > now ||
    p.data.expiresAt <= now ||
    p.data.expiresAt > customerAiLimits.pricingExpiresAt ||
    p.data.expiresAt - p.data.activatedAt > customerAiLimits.windowMs ||
    p.data.expiresAt <= p.data.activatedAt ||
    (p.data.audience === "owner-canary" && p.data.canaryUid !== uid)
  )
    throw unavailable();
  return p.data;
}
export function customerAiReservation(value: unknown, ceiling: number) {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < 0 ||
    Number(value) % customerAiLimits.reserveVnd !== 0 ||
    Number(value) + customerAiLimits.reserveVnd > ceiling
  )
    throw new HttpsError(
      "resource-exhausted",
      "Đã đạt giới hạn ngân sách tư vấn.",
    );
  return Number(value) + customerAiLimits.reserveVnd;
}
function checkAccount(
  user: Record<string, unknown> | undefined,
  access: Record<string, unknown> | undefined,
  policy: CustomerAiPolicy,
) {
  if (
    user?.locked ||
    access?.locked ||
    (policy.audience === "owner-canary" &&
      (access?.active !== true ||
        !Array.isArray(access.roles) ||
        !access.roles.includes("OWNER")))
  )
    throw new HttpsError(
      "permission-denied",
      "Không thể dùng tư vấn với tài khoản này.",
    );
}
const endpoint = `https://${customerAiLimits.location}-aiplatform.googleapis.com/v1/projects/satsunicgo/locations/${customerAiLimits.location}/publishers/google/models/${customerAiLimits.model}`;
async function providerHeaders() {
  const credential = getApp().options.credential;
  if (!credential) throw unavailable();
  const token = await credential.getAccessToken();
  return {
    Authorization: `Bearer ${token.access_token}`,
    "Content-Type": "application/json",
  };
}
async function boundedJson(response: Response) {
  if (!response.ok || !response.body) throw unavailable();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 65536) throw unavailable();
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export async function verifyCustomerAiProvider() {
  if (
    !customerAiReady(Date.now()) ||
    !customerAiEnvironmentReady(
      (getFirestore() as unknown as { projectId?: unknown }).projectId,
    )
  )
    return false;
  try {
    const result = await fetch(`${endpoint}:countTokens`, {
      method: "POST",
      headers: await providerHeaders(),
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Readiness" }] }],
      }),
    });
    return z
      .object({ totalTokens: z.number().int().positive().max(100) })
      .safeParse(await boundedJson(result)).success;
  } catch {
    warn("ask-customer-readiness", { state: "unavailable" });
    return false;
  }
}
export function customerAiRequest(
  system: string,
  prompt: string,
  maximumBytes = 32768,
) {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      candidateCount: 1,
      maxOutputTokens: customerAiLimits.maxOutputTokens,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    maximumBytes > 100000 ||
    Buffer.byteLength(body) > maximumBytes
  )
    throw new HttpsError(
      "invalid-argument",
      "Nội dung quá dài. Anh/chị vui lòng rút gọn câu hỏi.",
    );
  return body;
}
export async function customerAiConfigured() {
  const db = getFirestore();
  if (
    !customerAiEnvironmentReady(
      (db as unknown as { projectId?: unknown }).projectId,
    )
  )
    return false;
  // An explicit customer policy, including disabled/expired/malformed data, must
  // never fall through into a separate paid trial after the kill switch closes.
  return (await db.doc("settings/askCustomerAi").get()).exists;
}
export async function generateCustomerAi(
  uid: string,
  sessionId: string,
  build: (
    count: (body: string, signal: AbortSignal) => Promise<number>,
  ) => Promise<string>,
  signal: AbortSignal,
) {
  const db = getFirestore();
  if (
    !customerAiEnvironmentReady(
      (db as unknown as { projectId?: unknown }).projectId,
    )
  )
    throw unavailable();
  signal.throwIfAborted();
  const policyRef = db.doc("settings/askCustomerAi");
  const initial = checkCustomerAiPolicy(
    (await policyRef.get()).data(),
    uid,
    Date.now(),
  );
  const account = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`staffAccess/${uid}`).get(),
  ]);
  checkAccount(account[0].data(), account[1].data(), initial);
  const headers = await providerHeaders();
  let countedBody = "",
    totalTokens = 0,
    countCalls = 0;
  const count = async (body: string, countSignal: AbortSignal) => {
    countSignal.throwIfAborted();
    if (++countCalls > 15 || Buffer.byteLength(body) > 32768)
      throw unavailable();
    const current = checkCustomerAiPolicy(
      (await policyRef.get()).data(),
      uid,
      Date.now(),
    );
    if (current.version !== initial.version) throw unavailable();
    const result = await fetch(`${endpoint}:countTokens`, {
      method: "POST",
      headers,
      body,
      redirect: "error",
      signal: countSignal,
    });
    totalTokens = z
      .object({ totalTokens: z.number().int().positive().max(1048576) })
      .parse(await boundedJson(result)).totalTokens;
    countedBody = body;
    return totalTokens;
  };
  const body = await build(count);
  if (countedBody !== body) await count(body, signal);
  if (totalTokens > customerAiLimits.maxInputTokens)
    throw new HttpsError(
      "invalid-argument",
      "Nội dung quá dài. Anh/chị vui lòng rút gọn câu hỏi.",
    );
  // Stable opaque identity makes transport replay of an identical turn fail closed.
  const operation = createHash("sha256")
    .update(JSON.stringify([uid, sessionId, body]))
    .digest("hex");
  const budget = db.doc("aiCustomerBudget/lifetime");
  const attempt = budget.collection("attempts").doc(operation);
  const userKey = createHash("sha256").update(uid).digest("hex");
  const userBudget = budget.collection("users").doc(userKey);
  await db.runTransaction(async (tx) => {
    const minute = Math.floor(Date.now() / 60000);
    const globalRate = budget.collection("minutes").doc(String(minute));
    const userRate = userBudget.collection("minutes").doc(String(minute));
    const [p, ledger, personal, old, global, local, user, access] =
      await Promise.all([
        tx.get(policyRef),
        tx.get(budget),
        tx.get(userBudget),
        tx.get(attempt),
        tx.get(globalRate),
        tx.get(userRate),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
      ]);
    const policy = checkCustomerAiPolicy(p.data(), uid, Date.now());
    if (policy.version !== initial.version) throw unavailable();
    checkAccount(user.data(), access.data(), policy);
    if (old.exists)
      throw new HttpsError(
        "already-exists",
        "Lượt tư vấn này đã được xử lý. Kiểm tra hội thoại trước khi tiếp tục.",
      );
    const reservedVnd = customerAiReservation(
      ledger.exists ? ledger.data()?.reservedVnd : 0,
      customerAiLimits.maxBudgetVnd,
    );
    const personalVnd = customerAiReservation(
      personal.exists ? personal.data()?.reservedVnd : 0,
      customerAiLimits.perUserBudgetVnd,
    );
    const counts = [global, local].map((s) => (s.exists ? s.data()?.count : 0));
    if (
      counts.some(
        (value, i) =>
          !Number.isSafeInteger(value) ||
          value < 0 ||
          value >=
            [customerAiLimits.globalPerMinute, customerAiLimits.userPerMinute][
              i
            ],
      )
    )
      throw new HttpsError(
        "resource-exhausted",
        "Đã đạt giới hạn tư vấn. Thử lại sau.",
      );
    tx.set(
      budget,
      {
        reservedVnd,
        maxBudgetVnd: customerAiLimits.maxBudgetVnd,
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    tx.set(userBudget, { reservedVnd: personalVnd });
    tx.set(globalRate, { count: counts[0] + 1 });
    tx.set(userRate, { count: counts[1] + 1 });
    tx.create(attempt, {
      state: "reserved",
      reserveVnd: customerAiLimits.reserveVnd,
      inputTokens: totalTokens,
      policyVersion: policy.version,
      audience: policy.audience,
      userKey,
      releaseId: customerAiLimits.releaseId,
      createdAt: Date.now(),
    });
  });
  signal.throwIfAborted();
  const [p, user, access] = await Promise.all([
    policyRef.get(),
    db.doc(`users/${uid}`).get(),
    db.doc(`staffAccess/${uid}`).get(),
  ]);
  const policy = checkCustomerAiPolicy(p.data(), uid, Date.now());
  if (policy.version !== initial.version) throw unavailable();
  checkAccount(user.data(), access.data(), policy);
  signal.throwIfAborted();
  // Exactly one paid network attempt. No SDK retry or reservation release.
  const response = await fetch(`${endpoint}:generateContent`, {
    method: "POST",
    headers,
    body,
    redirect: "error",
    signal,
  });
  const payload = z
    .object({
      candidates: z
        .array(
          z.object({
            finishReason: z.literal("STOP"),
            content: z.object({
              parts: z
                .array(z.object({ text: z.string().max(20000) }).strict())
                .min(1)
                .max(4),
            }),
          }),
        )
        .length(1),
      usageMetadata: z.object({
        promptTokenCount: z.number().int().nonnegative().max(10000),
        candidatesTokenCount: z.number().int().nonnegative().max(800),
        thoughtsTokenCount: z.number().int().nonnegative().max(0).optional(),
        totalTokenCount: z.number().int().nonnegative().max(10800),
        cachedContentTokenCount: z.number().int().nonnegative().optional(),
      }),
    })
    .parse(await boundedJson(response));
  if (
    payload.usageMetadata.totalTokenCount !==
    payload.usageMetadata.promptTokenCount +
      payload.usageMetadata.candidatesTokenCount
  )
    throw unavailable();
  await attempt.update({
    state: "provider-answered",
    usage: payload.usageMetadata,
  });
  return {
    value: JSON.parse(
      payload.candidates[0].content.parts.map((p) => p.text).join(""),
    ) as unknown,
    operation,
    policyVersion: initial.version,
  };
}
export async function completeCustomerAiAnswer(
  uid: string,
  operation: string,
  policyVersion: number,
) {
  const db = getFirestore();
  if (
    !customerAiEnvironmentReady(
      (db as unknown as { projectId?: unknown }).projectId,
    )
  )
    throw unavailable();
  const budget = db.doc("aiCustomerBudget/lifetime"),
    attempt = budget.collection("attempts").doc(operation);
  await db.runTransaction(async (tx) => {
    const [p, a, user, access] = await Promise.all([
      tx.get(db.doc("settings/askCustomerAi")),
      tx.get(attempt),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
    ]);
    const policy = checkCustomerAiPolicy(p.data(), uid, Date.now());
    checkAccount(user.data(), access.data(), policy);
    if (
      policy.version !== policyVersion ||
      a.data()?.state !== "provider-answered" ||
      a.data()?.userKey !== createHash("sha256").update(uid).digest("hex")
    )
      throw unavailable();
    tx.update(attempt, { state: "validated", validatedAt: Date.now() });
    if (policy.audience === "owner-canary")
      tx.set(
        budget,
        {
          canaryUid: uid,
          canaryAt: Date.now(),
          canaryReleaseId: customerAiLimits.releaseId,
        },
        { merge: true },
      );
  });
}
export function customerAiCanPromote(
  ledger: Record<string, unknown> | undefined,
  uid: string,
  now: number,
) {
  return (
    ledger?.canaryUid === uid &&
    ledger.canaryReleaseId === customerAiLimits.releaseId &&
    Number.isSafeInteger(ledger.canaryAt) &&
    Number(ledger.canaryAt) <= now &&
    Number(ledger.canaryAt) > now - customerAiLimits.windowMs
  );
}
