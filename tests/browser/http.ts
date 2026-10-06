import "./fixtures";

type LocalTimingPhase =
  | "auth-exchange"
  | "callable"
  | "custom-final-read"
  | "custom-ledger-read"
  | "catalog-final-read"
  | "catalog-ledger-read";
const diagnosticActions = new Set([
  "submitRequest",
  "issueQuote",
  "acceptQuote",
  "verifyTransfer",
  "recordPurchase",
  "receive",
  "pack",
  "finalize",
  "approveFinal",
  "dispatch",
  "track",
  "confirmReceipt",
]);
export async function timedFixtureStep<T>(
  phase: LocalTimingPhase,
  run: () => Promise<T>,
  endpoint?: "command" | "catalogCheckout" | "other",
  action?: string,
): Promise<T> {
  if (process.env.SATSUNICGO_LOCAL_HTTP_TIMING !== "true") return run();
  const start = performance.now();
  const metadata = {
    diagnostic: "LOCAL_TIMING026",
    phase,
    ...(endpoint ? { endpoint } : {}),
    ...(action && diagnosticActions.has(action) ? { action } : {}),
  };
  console.info(JSON.stringify({ ...metadata, state: "start" }));
  try {
    return await run();
  } finally {
    console.info(
      JSON.stringify({
        ...metadata,
        state: "end",
        elapsedMs: Math.round(performance.now() - start),
      }),
    );
  }
}
const tokens = new Map<string, string>();
export async function tokenFor(identity: string) {
  const saved = tokens.get(identity);
  if (saved) return saved;
  const uid = `e2e005-${identity}`;
  return timedFixtureStep("auth-exchange", async () => {
    const response = await fetch(
      "http://127.0.0.1:9197/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-only",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestUri: "http://127.0.0.1:5187",
          returnSecureToken: true,
          postBody: new URLSearchParams({
            providerId: "google.com",
            id_token: JSON.stringify({
              sub: uid,
              email: `${identity}@satsunicgo.example.invalid`,
              email_verified: true,
            }),
          }).toString(),
        }),
      },
    );
    if (!response.ok) throw Error("Synthetic identity exchange failed");
    const data = (await response.json()) as { idToken: string };
    if (!data.idToken) throw Error("Synthetic identity missing");
    tokens.set(identity, data.idToken);
    return data.idToken;
  });
}
export async function call<T = Record<string, unknown>>(
  name: string,
  data: unknown,
  identity: string | null = "owner",
  forged = false,
): Promise<{ result?: T; error?: { status: string } }> {
  if (!/^[A-Za-z]+$/.test(name)) throw Error("Invalid fixture endpoint");
  const token = forged
    ? "invalid-fixture-token"
    : identity
      ? await tokenFor(identity)
      : null;
  const action =
    data &&
    typeof data === "object" &&
    "action" in data &&
    typeof data.action === "string"
      ? data.action
      : undefined;
  return timedFixtureStep(
    "callable",
    async () => {
      const response = await fetch(
        `http://127.0.0.1:5107/demo-satsunicgo/asia-southeast1/${name}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ data }),
        },
      );
      return response.json();
    },
    name === "command" || name === "catalogCheckout" ? name : "other",
    action,
  );
}
export async function invoke<T = Record<string, unknown>>(
  name: string,
  data: unknown,
  identity = "owner",
) {
  const result = await call<T>(name, data, identity);
  if (result.error || !result.result)
    throw Error(
      `Fixture callable failed: ${name} ${result.error?.status ?? "EMPTY_RESULT"}`,
    );
  return result.result;
}
