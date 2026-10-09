import { getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";
import { warn } from "firebase-functions/logger";
import { z } from "zod";

// Reviewed text-only price envelope. No rate or endpoint is client-configurable.
// $0.10/M input, $0.40/M output incl reasoning; 100,000 VND/USD envelope.
// Reserve 1,000 VND per attempt, never release uncertain/failed reservations.
export const pilotLimits = {
  model: "gemini-2.5-flash-lite",
  location: "us-central1",
  maxInputTokens: 10000,
  maxOutputTokens: 800,
  reserveVnd: 1000,
  maxBudgetVnd: 10000,
  pricingExpiresAt: Date.parse("2026-10-08T00:00:00Z"),
} as const;
export const pilotPolicySchema = z
  .object({
    enabled: z.boolean(),
    pilotUid: z.string().min(1).max(128),
    maxBudgetVnd: z.literal(10000),
    expiresAt: z.number().int().positive(),
    version: z.number().int().positive(),
  })
  .passthrough();
export function pilotReady(now: number) {
  return Number.isSafeInteger(now) && now < pilotLimits.pricingExpiresAt;
}
export function checkPilot(policy: unknown, uid: string, now: number) {
  const parsed = pilotPolicySchema.safeParse(policy);
  if (
    !pilotReady(now) ||
    !parsed.success ||
    !parsed.data.enabled ||
    parsed.data.pilotUid !== uid ||
    parsed.data.expiresAt <= now
  )
    throw new HttpsError(
      "unavailable",
      "Thử Ask chưa được bật cho tài khoản này.",
    );
  return parsed.data;
}
export function nextReservation(reserved: unknown) {
  if (
    !Number.isSafeInteger(reserved) ||
    Number(reserved) < 0 ||
    Number(reserved) + pilotLimits.reserveVnd > pilotLimits.maxBudgetVnd
  )
    throw new HttpsError("resource-exhausted", "Đã hết ngân sách thử Ask.");
  return Number(reserved) + pilotLimits.reserveVnd;
}
export function pilotRequest(
  system: string,
  prompt: string,
  maximumBytes = 32768,
) {
  const request = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: pilotLimits.maxOutputTokens,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  const body = JSON.stringify(request);
  if (
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    maximumBytes > 100000 ||
    Buffer.byteLength(body, "utf8") > maximumBytes
  )
    throw new HttpsError("invalid-argument", "Nội dung thử Ask quá dài.");
  return body;
}
export async function verifyPilotProvider() {
  if (!pilotReady(Date.now()) || process.env.GCLOUD_PROJECT !== "satsunicgo")
    return false;
  try {
    const credential = getApp().options.credential;
    if (!credential) return false;
    const token = await credential.getAccessToken();
    const resource = `projects/satsunicgo/locations/${pilotLimits.location}/publishers/google/models/${pilotLimits.model}`;
    const response = await fetch(
      `https://${pilotLimits.location}-aiplatform.googleapis.com/v1/${resource}:countTokens`,
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Readiness" }] }],
        }),
      },
    );
    if (!response.ok)
      warn("ask106-provider-readiness", { httpStatus: response.status });
    return (
      response.ok &&
      z
        .object({ totalTokens: z.number().int().positive().max(100) })
        .safeParse(await response.json()).success
    );
  } catch {
    warn("ask106-provider-readiness", { phase: "transport-or-credential" });
    return false;
  }
}
// Native fetch performs no retries. Tokens remain runtime-only authentication.
export async function generatePilot(
  uid: string,
  request:
    | string
    | ((
        count: (body: string, signal: AbortSignal) => Promise<number>,
      ) => Promise<string>),
  signal: AbortSignal,
) {
  if (process.env.GCLOUD_PROJECT !== "satsunicgo")
    throw new HttpsError("unavailable", "Provider thử Ask chưa sẵn sàng.");
  const db = getFirestore();
  checkPilot(
    (await db.doc("settings/askPaidPilot").get()).data(),
    uid,
    Date.now(),
  );
  const credential = getApp().options.credential;
  if (!credential)
    throw new HttpsError("unavailable", "Provider thử Ask chưa sẵn sàng.");
  const token = await credential.getAccessToken();
  const resource = `projects/satsunicgo/locations/${pilotLimits.location}/publishers/google/models/${pilotLimits.model}`;
  const endpoint = `https://${pilotLimits.location}-aiplatform.googleapis.com/v1/${resource}`;
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    "Content-Type": "application/json",
  };
  let countedBody = "",
    totalTokens = 0,
    calls = 0;
  const exactCount = async (body: string, countSignal: AbortSignal) => {
    countSignal.throwIfAborted();
    if (++calls > 15 || Buffer.byteLength(body, "utf8") > 32768)
      throw new HttpsError("invalid-argument", "Nội dung thử Ask quá dài.");
    checkPilot(
      (await db.doc("settings/askPaidPilot").get()).data(),
      uid,
      Date.now(),
    );
    const count = await fetch(`${endpoint}:countTokens`, {
      method: "POST",
      headers,
      redirect: "error",
      signal: countSignal,
      body,
    });
    if (!count.ok)
      throw new HttpsError("unavailable", "Chưa xác minh được giới hạn xử lý.");
    const tokens = z
      .object({ totalTokens: z.number().int().positive().max(1048576) })
      .parse(await count.json()).totalTokens;
    countedBody = body;
    totalTokens = tokens;
    return tokens;
  };
  const body =
    typeof request === "string" ? request : await request(exactCount);
  if (countedBody !== body) await exactCount(body, signal);
  if (totalTokens > pilotLimits.maxInputTokens)
    throw new HttpsError("invalid-argument", "Nội dung thử Ask quá dài.");
  const operation = randomUUID();
  await db.runTransaction(async (tx) => {
    const policyRef = db.doc("settings/askPaidPilot"),
      budget = db.doc("aiPilotBudget/lifetime");
    const [policy, ledger, user, access] = await Promise.all([
      tx.get(policyRef),
      tx.get(budget),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
    ]);
    checkPilot(policy.data(), uid, Date.now());
    if (
      user.data()?.locked ||
      access.data()?.locked ||
      access.data()?.active !== true ||
      !Array.isArray(access.data()?.roles) ||
      !access.data()!.roles.includes("OWNER")
    )
      throw new HttpsError(
        "permission-denied",
        "Không thể dùng thử Ask với tài khoản này.",
      );
    const reservedVnd = nextReservation(
      ledger.exists ? ledger.data()?.reservedVnd : 0,
    );
    tx.set(budget, { reservedVnd, maxBudgetVnd: 10000, updatedAt: Date.now() });
    tx.create(budget.collection("attempts").doc(operation), {
      reserveVnd: 1000,
      inputTokens: totalTokens,
      maxOutputTokens: 800,
      model: pilotLimits.model,
      createdAt: Date.now(),
      state: "reserved",
    });
  });
  signal.throwIfAborted();
  checkPilot(
    (await db.doc("settings/askPaidPilot").get()).data(),
    uid,
    Date.now(),
  );
  // Reservation is deliberately permanent even if dispatch or readback fails.
  const result = await fetch(`${endpoint}:generateContent`, {
    method: "POST",
    headers,
    body,
    signal,
    redirect: "error",
  });
  if (!result.ok)
    throw new HttpsError(
      "unavailable",
      "Chưa trả lời được. Ngân sách cho lượt thử đã được giữ lại.",
    );
  const payload = z
    .object({
      candidates: z
        .array(
          z.object({
            finishReason: z.literal("STOP"),
            content: z.object({
              parts: z
                .array(z.object({ text: z.string().max(20000) }))
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
      }),
    })
    .parse(await result.json());
  await db.doc(`aiPilotBudget/lifetime/attempts/${operation}`).update({
    state: "answered",
    usage: payload.usageMetadata,
  });
  return JSON.parse(
    payload.candidates[0].content.parts.map((p) => p.text).join(""),
  ) as unknown;
}
