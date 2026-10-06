import {
  test as base,
  expect,
  type Page,
  type Route,
  type Response,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldPath,
  Timestamp,
  type DocumentReference,
} from "firebase-admin/firestore";
import { db, operator, closeFixtures } from "./fixtures";
import {
  checkedCleanup,
  checkedMutationDelete,
} from "./owned-cleanup-guard034";

type Plan = {
  id: string;
  version: number;
  name: string;
  price: number;
  periodDays: number;
  serviceDiscountBps: number;
  discountCap: number;
  status: string;
};
type Listing = { rows: Plan[]; next: string | null };
type Command = {
  action: string;
  operationId: string;
  id?: string;
  ownerId?: string;
  expectedVersion?: number;
  planId?: string;
  reason?: string;
  payload?: unknown;
};
type State = {
  nonce: string;
  pageBudget: number;
  ids: string[];
  target: string;
  customer: string;
  identity: string;
  cancelled: boolean;
  tasks: Set<Promise<void>>;
  releases: Set<() => void>;
  commands: Command[];
  inFlight: Set<object>;
  unregistered: boolean;
  settledOps: Set<string>;
  ackedOps: Set<string>;
  cleanup?: Promise<void>;
  plansOwned: boolean;
  customerOwned: boolean;
  unknownWrite: boolean;
  collision: boolean;
  fingerprints: Map<string, string | null>;
  detach?: () => void;
  latest?: { after: string | null; result: Listing };
};
const states = new Map<Page, State>();
const plan = {
  name: "PLUS",
  price: 100000,
  periodDays: 7,
  serviceDiscountBps: 500,
  discountCap: 10000,
  status: "draft",
};
function fingerprint(value: unknown): string {
  const stable = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(stable)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, child]) => [k, stable(child)]),
          )
        : v;
  return JSON.stringify(stable(value));
}
async function verifyFingerprints(state: State) {
  const entries = [...state.fingerprints];
  if (!entries.length) return;
  const snapshots = await db.getAll(...entries.map(([path]) => db.doc(path)));
  for (let i = 0; i < entries.length; i++) {
    const expected = entries[i][1],
      actual = snapshots[i];
    if (
      expected === null
        ? actual.exists
        : !actual.exists || fingerprint(actual.data()) !== expected
    )
      throw Error(
        "Known canonical fingerprint mismatch; preserve whole cohort",
      );
  }
}
async function directWrite(
  state: State,
  expected: Map<string, unknown | null>,
  write: () => Promise<unknown>,
) {
  state.unknownWrite = true;
  await write();
  for (const [path, data] of expected)
    state.fingerprints.set(path, data === null ? null : fingerprint(data));
  state.unknownWrite = false;
  await verifyFingerprints(state);
}
async function deleteOwnedRoots(page: Page, state: State, paths: string[]) {
  live(page, state);
  if (
    !state.plansOwned ||
    state.collision ||
    state.unknownWrite ||
    paths.some(
      (path) =>
        !state.ids.some((id) => path === "membershipPlans/" + id) ||
        !state.fingerprints.has(path) ||
        state.fingerprints.get(path) === null,
    )
  )
    throw Error(
      "Mutation deletion lacks acknowledged current custody; cohort retained",
    );
  const records = paths.map((path) => ({
    path,
    acknowledged: true,
    fingerprint: state.fingerprints.get(path)!,
  }));
  state.unknownWrite = true;
  await checkedMutationDelete(records, {
    read: async (requested) =>
      (await db.getAll(...requested.map((path) => db.doc(path)))).map(
        (snapshot) => ({
          path: snapshot.ref.path,
          fingerprint: snapshot.exists ? fingerprint(snapshot.data()) : null,
          version: snapshot.updateTime
            ? snapshot.updateTime.seconds +
              ":" +
              snapshot.updateTime.nanoseconds
            : null,
        }),
      ),
    commit: async (deletes) => {
      live(page, state);
      const batch = db.batch();
      for (const item of deletes) {
        const [seconds, nanos] = item.version.split(":").map(Number);
        batch.delete(db.doc(item.path), {
          lastUpdateTime: new Timestamp(seconds, nanos),
        });
      }
      await batch.commit();
    },
  });
  // ACK plus complete absence readback precedes expected-manifest removal.
  for (const path of paths) state.fingerprints.set(path, null);
  state.unknownWrite = false;
  live(page, state);
}
async function captureCommitted(
  page: Page,
  state: State,
  command: Command,
  result: { id: string; version?: number },
) {
  live(page, state);
  if (command.action === "saveMembershipPlan") {
    const snapshot = await db.doc("membershipPlans/" + state.target).get();
    live(page, state);
    const data = snapshot.data();
    const payload = command.payload as Record<string, unknown>;
    if (
      !data ||
      result.id !== state.target ||
      result.version !== Number(command.expectedVersion) + 1 ||
      data.version !== result.version ||
      data.changedBy !== operator ||
      !Number.isSafeInteger(data.changedAt) ||
      !Number.isSafeInteger(data.createdAt) ||
      Object.entries(payload).some(([k, v]) => data[k] !== v) ||
      Object.keys(data).some(
        (k) =>
          ![
            ...Object.keys(payload),
            "version",
            "createdAt",
            "changedAt",
            "changedBy",
          ].includes(k),
      )
    )
      throw Error("Committed plan fingerprint cannot be bound to known ACK");
    state.fingerprints.set(snapshot.ref.path, fingerprint(data));
  } else if (command.action === "grant") {
    const snapshot = await db
      .doc("membershipSubscriptions/" + state.customer)
      .get();
    live(page, state);
    const data = snapshot.data(),
      savedPlan = await db.doc("membershipPlans/" + command.planId).get();
    live(page, state);
    if (
      !data ||
      result.id !== state.customer ||
      data.ownerId !== state.customer ||
      data.planId !== command.planId ||
      data.state !== "active" ||
      data.renewalIntent !== false ||
      data.endsAt - data.startsAt !== 7 * 86400000 ||
      fingerprint(data.planSnapshot) !== fingerprint(savedPlan.data())
    )
      throw Error("Subscription fingerprint cannot be bound to known ACK");
    state.fingerprints.set(snapshot.ref.path, fingerprint(data));
  } else throw Error("Unregistered command fingerprint");
  state.ackedOps.add(command.operationId);
}
function live(page: Page, state: State) {
  if (state.cancelled || states.get(page) !== state)
    throw Error("Membership fixture generation cancelled");
}
function tracked<T>(
  page: Page,
  state: State,
  run: () => Promise<T>,
): Promise<T> {
  const task = Promise.resolve().then(async () => {
    live(page, state);
    const result = await run();
    live(page, state);
    return result;
  });
  const settled = task.then(
    () => undefined,
    () => undefined,
  );
  state.tasks.add(settled);
  void settled.then(() => state.tasks.delete(settled));
  return task;
}
function commandData(response: Response | Route) {
  const request = response.request();
  if (request.method() !== "POST") return undefined;
  return request.postDataJSON()?.data as Command | undefined;
}
function listAfter(response: Response | Route): string | null | undefined {
  const request = response.request();
  if (request.method() !== "POST" || !/\/listWork$/.test(request.url()))
    return undefined;
  const data = request.postDataJSON()?.data;
  return data?.kind === "membershipPlans" ? (data.after ?? null) : undefined;
}
function terminal<T>(state: State) {
  let finish!: (value: { ok: true; value: T } | { ok: false }) => void;
  let done = false;
  const promise = new Promise<{ ok: true; value: T } | { ok: false }>(
    (resolve) => {
      finish = resolve;
    },
  );
  const settle = (value: { ok: true; value: T } | { ok: false }) => {
    if (done) return;
    done = true;
    state.releases.delete(cancel);
    finish(value);
  };
  const cancel = () => settle({ ok: false });
  state.releases.add(cancel);
  return {
    success: (value: T) => settle({ ok: true, value }),
    cancel,
    wait: async () => {
      const result = await promise;
      if (!result.ok) throw Error("Membership observation cancelled or failed");
      return result.value;
    },
  };
}
function observeList(page: Page, state: State, after?: string | null) {
  const result = terminal<{ after: string | null; result: Listing }>(state);
  const handler = (response: Response) => {
    const cursor = listAfter(response);
    if (cursor === undefined || (after !== undefined && after !== cursor))
      return;
    page.off("response", handler);
    void tracked(page, state, async () => {
      const body = await response.json();
      live(page, state);
      if (body.error || !body.result || !Array.isArray(body.result.rows))
        throw Error("Membership read did not ACK");
      const value = { after: cursor, result: body.result as Listing };
      state.latest = value;
      result.success(value);
    }).catch(result.cancel);
  };
  page.on("response", handler);
  const detach = () => {
    page.off("response", handler);
    result.cancel();
  };
  state.releases.add(detach);
  return {
    wait: async () => {
      try {
        return await result.wait();
      } finally {
        state.releases.delete(detach);
        page.off("response", handler);
      }
    },
  };
}
function observeCommand(page: Page, state: State, status?: string) {
  const result = terminal<void>(state);
  const handler = (response: Response) => {
    if (!/\/(workspaceCommand|membershipCommand)$/.test(response.url())) return;
    const data = commandData(response);
    if (!data || !(data.id === state.target || data.ownerId === state.customer))
      return;
    page.off("response", handler);
    void tracked(page, state, async () => {
      const body = await response.json();
      live(page, state);
      if (status ? body.error?.status !== status : !body.result || body.error)
        throw Error("Membership command ACK mismatch");
      if (
        !status &&
        (body.result.id !== (data.id ?? data.ownerId) ||
          (data.action === "saveMembershipPlan" &&
            body.result.version !== Number(data.expectedVersion) + 1))
      )
        throw Error("Command ACK resource/version mismatch");
      if (!status) await captureCommitted(page, state, data, body.result);
      state.settledOps.add(data.operationId);
      result.success(undefined);
    }).catch(result.cancel);
  };
  page.on("response", handler);
  const detach = () => {
    page.off("response", handler);
    result.cancel();
  };
  state.releases.add(detach);
  return {
    wait: async () => {
      try {
        await result.wait();
      } finally {
        state.releases.delete(detach);
        page.off("response", handler);
      }
    },
  };
}
function capture(page: Page, state: State) {
  const request = (r: import("@playwright/test").Request) => {
    if (
      r.method() !== "POST" ||
      !/\/(workspaceCommand|membershipCommand)$/.test(r.url())
    )
      return;
    const command = r.postDataJSON()?.data as Command;
    if (
      !command ||
      !/^[a-f0-9-]{36}$/.test(command.operationId) ||
      !(command.id === state.target || command.ownerId === state.customer)
    ) {
      state.unregistered = true;
      return;
    }
    state.commands.push(command);
    state.inFlight.add(r);
  };
  const finished = (r: import("@playwright/test").Request) =>
    state.inFlight.delete(r);
  const response = (r: Response) => {
    if (!/\/(workspaceCommand|membershipCommand)$/.test(r.url())) return;
    const command = commandData(r);
    if (
      !command ||
      !(command.id === state.target || command.ownerId === state.customer)
    )
      return;
    void tracked(page, state, async () => {
      const body = await r.json();
      live(page, state);
      if (
        body.result &&
        !body.error &&
        body.result.id === (command.id ?? command.ownerId)
      ) {
        state.settledOps.add(command.operationId);
      } else if (
        [
          "ABORTED",
          "INVALID_ARGUMENT",
          "PERMISSION_DENIED",
          "UNAUTHENTICATED",
          "FAILED_PRECONDITION",
          "NOT_FOUND",
          "ALREADY_EXISTS",
        ].includes(body.error?.status)
      ) {
        state.settledOps.add(command.operationId);
      }
    }).catch(() => undefined);
  };
  page.on("response", response);
  page.on("request", request);
  page.on("requestfinished", finished);
  page.on("requestfailed", finished);
  state.detach = () => {
    page.off("response", response);
    page.off("request", request);
    page.off("requestfinished", finished);
    page.off("requestfailed", finished);
  };
}
async function prepare(page: Page) {
  const nonce = randomUUID(),
    identity = "customer-" + randomUUID();
  const state: State = {
    nonce,
    pageBudget: 0,
    ids: [],
    target: "",
    identity,
    customer: "e2e005-" + identity,
    cancelled: false,
    tasks: new Set(),
    releases: new Set(),
    commands: [],
    inFlight: new Set(),
    unregistered: false,
    settledOps: new Set(),
    ackedOps: new Set(),
    plansOwned: false,
    customerOwned: false,
    unknownWrite: false,
    collision: false,
    fingerprints: new Map(),
  };
  if (states.has(page)) throw Error("Membership generation already registered");
  states.set(page, state);
  capture(page, state);
  await tracked(page, state, async () => {
    const [staff, user, last] = await Promise.all([
      db.doc("staffAccess/" + operator).get(),
      db.doc("users/" + operator).get(),
      db
        .collection("membershipPlans")
        .orderBy(FieldPath.documentId())
        .limit(901)
        .select()
        .get(),
    ]);
    live(page, state);
    if (
      !staff.get("active") ||
      !staff.get("roles")?.includes("OWNER") ||
      staff.get("locked") ||
      user.get("locked")
    )
      throw Error("Existing owner baseline required");
    // Ascending key scans are supported by the actual emulator. A sentinel
    // makes max-ID discovery complete or refuses BEFORE any fixture write.
    if (last.size > 900)
      throw Error("Owned tail discovery exceeds bounded baseline");
    state.pageBudget = Math.ceil((last.size + 32) / 30) - 1;
    console.info(
      JSON.stringify({
        diagnostic: "MEMBERSHIP034_BOUND",
        baselineCount: last.size,
        ownedCount: 32,
        forwardReadBudget: state.pageBudget,
        baselineComplete: true,
      }),
    );
    // Exact known tail IDs; never overwrite a baseline or invent a global page count.
    const prefix =
      (last.docs.at(-1)?.id ?? "") + "z034-" + nonce.slice(0, 8) + "-";
    if (!/^[a-zA-Z0-9-]+$/.test(prefix) || prefix.length + 2 > 80)
      throw Error("Bounded legal owned tail IDs unavailable");
    state.ids = Array.from(
      { length: 32 },
      (_, i) => prefix + i.toString().padStart(2, "0"),
    );
    state.target = state.ids[31];
    const candidates = await db.getAll(
      ...state.ids.map((id) => db.doc("membershipPlans/" + id)),
      db.doc("users/" + state.customer),
      db.doc("membershipSubscriptions/" + state.customer),
    );
    live(page, state);
    if (candidates.some((d) => d.exists)) {
      state.collision = true;
      throw Error("Owned fixture collision");
    }
    const auth = getAuth(getApp("release021-browser"));
    try {
      await auth.getUser(state.customer);
      state.collision = true;
      throw Error("Owned Auth collision");
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found")
        throw error;
    }
    live(page, state);
    const email = identity + "@satsunicgo.example.invalid";
    state.unknownWrite = true;
    const created = await auth.createUser({
      uid: state.customer,
      email,
      emailVerified: true,
    });
    if (
      created.uid !== state.customer ||
      created.email !== email ||
      !created.emailVerified
    )
      throw Error("Auth create ACK mismatch");
    state.customerOwned = true;
    state.unknownWrite = false;
    live(page, state);
    state.unknownWrite = true;
    await auth.updateUser(state.customer, {
      providerToLink: { providerId: "google.com", uid: state.customer, email },
    });
    state.unknownWrite = false;
    live(page, state);
    const batch = db.batch();
    state.ids.forEach((id, i) => {
      const data = {
        ...plan,
        version: 1,
        status: i === 0 || i === 31 ? "published" : "draft",
      };
      state.fingerprints.set("membershipPlans/" + id, fingerprint(data));
      batch.create(db.doc("membershipPlans/" + id), data);
    });
    batch.create(db.doc("users/" + state.customer), {
      ownerId: state.customer,
      locked: false,
      version: 1,
    });
    state.fingerprints.set(
      "users/" + state.customer,
      fingerprint({ ownerId: state.customer, locked: false, version: 1 }),
    );
    state.unknownWrite = true;
    await batch.commit();
    state.plansOwned = true;
    state.unknownWrite = false;
    live(page, state);
    await verifyFingerprints(state);
  });
  return state;
}
async function cleanup(page: Page, state: State) {
  if (state.cleanup) return state.cleanup;
  state.cleanup = (async () => {
    state.cancelled = true;
    [...state.releases].forEach((release) => release());
    state.releases.clear();
    try {
      if (!page.isClosed()) await page.close();
    } catch {
      /* DB cleanup does not depend on an open browser. */
    }
    await Promise.allSettled([...state.tasks]);
    state.detach?.();
    if (
      states.get(page) !== state ||
      state.unregistered ||
      state.unknownWrite ||
      state.collision ||
      state.inFlight.size ||
      state.commands.some(
        (command) => !state.settledOps.has(command.operationId),
      )
    )
      throw Error("Unquiesced membership fixture; cleanup incomplete");
    if (state.customerOwned && !state.plansOwned)
      throw Error("Partial canonical preparation; preserve whole cohort");
    if (!state.customerOwned && !state.plansOwned) {
      if (states.get(page) === state) states.delete(page);
      return;
    }
    await verifyFingerprints(state);
    if (state.customerOwned) {
      const actor = await getAuth(getApp("release021-browser")).getUser(
        state.customer,
      );
      if (
        actor.uid !== state.customer ||
        actor.email !== state.identity + "@satsunicgo.example.invalid" ||
        !actor.emailVerified ||
        actor.disabled ||
        !actor.providerData.some(
          (p) => p.providerId === "google.com" && p.uid === state.customer,
        )
      )
        throw Error("Auth fingerprint mismatch; cohort retained");
    }
    const refs = new Map<string, DocumentReference>();
    const add = (ref: DocumentReference) => refs.set(ref.path, ref);
    for (const id of state.plansOwned ? state.ids : []) {
      if (!id.includes("z034-" + state.nonce.slice(0, 8) + "-"))
        throw Error("Unowned plan cleanup candidate");
      add(db.doc("membershipPlans/" + id));
      const versions = await db
        .collection("membershipPlans/" + id + "/versions")
        .limit(101)
        .get();
      if (versions.size > 100) throw Error("Versions cleanup bound exceeded");
      if (versions.size)
        throw Error("Unexpected unACKed membership versions; cohort retained");
    }
    const ownedCommands = [
      ...new Map(
        state.commands
          .filter((command) => state.ackedOps.has(command.operationId))
          .map((command) => [command.operationId, command]),
      ).values(),
    ];
    const resources = [
      ...(state.plansOwned ? state.ids : []),
      ...(state.customerOwned ? [state.customer] : []),
    ];
    for (let i = 0; i < resources.length; i += 30) {
      const chunk = resources.slice(i, i + 30);
      const audits = await db
        .collection("auditEvents")
        .where("resourceId", "in", chunk)
        .limit(101)
        .get();
      if (audits.size > 100) throw Error("Audit cleanup bound exceeded");
      for (const resource of chunk) {
        const expected = ownedCommands.filter(
          (command) => (command.id ?? command.ownerId) === resource,
        );
        const actual = audits.docs.filter(
          (row) => row.get("resourceId") === resource,
        );
        if (
          actual.length !== expected.length ||
          actual.some(
            (row) =>
              row.get("action") !==
              (resource === state.customer
                ? "membership.grant"
                : "saveMembershipPlan"),
          )
        )
          throw Error(
            "Audit not bound to exact acknowledged command inventory; cohort retained",
          );
      }
      for (const row of audits.docs) {
        if (
          row.get("actor") !== operator ||
          !chunk.includes(row.get("resourceId"))
        )
          throw Error("Unowned audit");
        add(row.ref);
      }
    }
    if (!/^e2e005-customer-[a-f0-9-]{36}$/.test(state.customer))
      throw Error("Unowned customer");
    if (state.customerOwned) {
      const history = await db
        .collection("membershipHistory")
        .where("ownerId", "==", state.customer)
        .limit(101)
        .get();
      if (
        history.size > 100 ||
        history.size !==
          ownedCommands.filter((command) => command.action === "grant").length
      )
        throw Error("History cleanup acknowledged inventory mismatch");
      if (
        history.size &&
        !state.commands.some(
          (c) => c.action === "grant" && state.ackedOps.has(c.operationId),
        )
      )
        throw Error("UnACKed customer history; cohort retained");
      for (const row of history.docs) {
        if (
          row.get("actor") !== operator ||
          row.get("ownerId") !== state.customer
        )
          throw Error("Unowned history");
        add(row.ref);
      }
      for (const name of ["users", "membershipSubscriptions"]) {
        const path = name + "/" + state.customer;
        if (state.fingerprints.has(path)) add(db.doc(path));
      }
    }
    for (const command of state.commands) {
      if (!state.ackedOps.has(command.operationId)) {
        const rejectedReceipt = await db
          .doc("idempotencyKeys/" + operator + "-" + command.operationId)
          .get();
        if (rejectedReceipt.exists)
          throw Error(
            "Rejected command cannot own existing receipt; cohort retained",
          );
        continue;
      }
      add(db.doc("idempotencyKeys/" + operator + "-" + command.operationId));
      if (command.action === "grant")
        add(
          db.doc(
            "outboxJobs/membership-" + operator + "-" + command.operationId,
          ),
        );
    }
    const knownOps = new Set(
      state.commands.map((command) => command.operationId),
    );
    for (const op of knownOps) {
      const receipt = await db
        .doc("idempotencyKeys/" + operator + "-" + op)
        .get();
      const command = state.commands.find(
        (candidate) => candidate.operationId === op,
      )!;
      if (
        receipt.exists &&
        receipt.get("result.id") !== (command.id ?? command.ownerId)
      )
        throw Error("Receipt cleanup ownership mismatch");
      if (command.action === "grant") {
        const outbox = await db
          .doc("outboxJobs/membership-" + operator + "-" + op)
          .get();
        if (outbox.exists && outbox.get("ownerId") !== state.customer)
          throw Error("Outbox cleanup ownership mismatch");
      }
    }
    if (state.customerOwned) {
      const user = await db.doc("users/" + state.customer).get();
      const subscription = await db
        .doc("membershipSubscriptions/" + state.customer)
        .get();
      if (
        (user.exists && !state.fingerprints.has(user.ref.path)) ||
        (subscription.exists && !state.fingerprints.has(subscription.ref.path))
      )
        throw Error("UnACKed customer resource; cohort retained");
      if (
        (user.exists && user.get("ownerId") !== state.customer) ||
        (subscription.exists && subscription.get("ownerId") !== state.customer)
      )
        throw Error("Customer cleanup ownership mismatch");
    }
    // Every enumeration/ownership check completes before the first delete.
    const all = [...refs.values()];
    const snapshots = await db.getAll(...all);
    const records = snapshots.map((snapshot) => ({
      path: snapshot.ref.path,
      acknowledged: true,
      fingerprint: state.fingerprints.has(snapshot.ref.path)
        ? state.fingerprints.get(snapshot.ref.path)!
        : snapshot.exists
          ? fingerprint(snapshot.data())
          : null,
    }));
    await checkedCleanup(
      records,
      {
        collision: state.collision,
        unknown: state.unknownWrite,
        quiescent: state.inFlight.size === 0 && state.tasks.size === 0,
      },
      {
        read: async (paths) =>
          (await db.getAll(...paths.map((path) => db.doc(path)))).map(
            (snapshot) => ({
              path: snapshot.ref.path,
              fingerprint: snapshot.exists
                ? fingerprint(snapshot.data())
                : null,
              version: snapshot.updateTime
                ? snapshot.updateTime.seconds +
                  ":" +
                  snapshot.updateTime.nanoseconds
                : null,
            }),
          ),
        commit: async (deletes) => {
          const batch = db.batch();
          for (const item of deletes) {
            const [seconds, nanos] = item.version.split(":").map(Number);
            batch.delete(db.doc(item.path), {
              lastUpdateTime: new Timestamp(seconds, nanos),
            });
          }
          await batch.commit();
        },
      },
    );
    try {
      if (state.customerOwned)
        await getAuth(getApp("release021-browser")).deleteUser(state.customer);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found")
        throw error;
    }
    if (states.get(page) === state) states.delete(page);
  })();
  return state.cleanup;
}
const test = base.extend<{ fixture: State }>({
  fixture: [
    async ({ page }, use, info) => {
      let state: State | undefined;
      let primary: unknown;
      try {
        const preparing = prepare(page);
        state = states.get(page);
        await preparing;
        await use(state!);
      } catch (error) {
        primary = error;
      }
      if (state) {
        try {
          await cleanup(page, state);
        } catch (error) {
          console.info(
            JSON.stringify({
              diagnostic: "MEMBERSHIP034_CLEANUP",
              complete: false,
              primaryError: !!primary || info.errors.length > 0,
              lateCommitVerified: false,
            }),
          );
          if (!primary && !info.errors.length) primary = error;
        }
      }
      if (primary) throw primary;
    },
    { auto: true, timeout: 45000 },
  ],
});
test.afterEach(async ({ page }, info) => {
  const state = states.get(page);
  if (!state) return;
  try {
    await cleanup(page, state);
  } catch (error) {
    if (!info.errors.length) throw error;
  }
});
test.afterAll(closeFixtures);

async function login(page: Page, width: number) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("owner");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
const row = (page: Page, id: string) =>
  page.locator(".crmItem").filter({ has: page.getByText(id, { exact: true }) });
async function readClick(
  page: Page,
  state: State,
  name: string,
  after?: string | null,
) {
  const observed = observeList(page, state, after);
  await page.getByRole("button", { name, exact: true }).click();
  const listing = await observed.wait();
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeEnabled();
  return listing;
}
async function enter(page: Page, state: State, width: number) {
  await login(page, width);
  const initial = observeList(page, state, null);
  await page.goto("/crm/membership");
  const first = await initial.wait();
  expect(first.result.rows.some((p) => p.id === state.target)).toBe(false);
  await expect(row(page, state.target)).toHaveCount(0);
  let current = first;
  for (
    let i = 0;
    i < state.pageBudget &&
    !current.result.rows.some((p) => p.id === state.target);
    i++
  ) {
    if (!current.result.next)
      throw Error("Owned continuation target unavailable");
    current = await readClick(
      page,
      state,
      "Trang tiếp theo",
      current.result.next,
    );
  }
  if (!current.after || !current.result.rows.some((p) => p.id === state.target))
    throw Error("Bounded actual beyond30 discovery failed");
  await expect(row(page, state.target)).toBeVisible();
  return current;
}
async function open(page: Page, state: State) {
  await row(page, state.target)
    .getByRole("button", { name: "Chỉnh sửa gói", exact: true })
    .click();
  await expect(
    page.getByLabel("Giá trả trước (₫)", { exact: true }),
  ).toBeVisible();
}
async function checkEffects(state: State, version: number, count: number) {
  const actual = await db.doc("membershipPlans/" + state.target).get();
  expect(actual.get("version")).toBe(version);
  const audits = await db
    .collection("auditEvents")
    .where("resourceId", "==", state.target)
    .limit(101)
    .get();
  expect(audits.size).toBe(count);
  for (const audit of audits.docs)
    expect(
      audit.get("actor") === operator &&
        audit.get("action") === "saveMembershipPlan",
    ).toBe(true);
  const versions = await db
    .collection("membershipPlans/" + state.target + "/versions")
    .limit(101)
    .get();
  // workspaceCommand versions subcollections apply to content/campaigns, not membershipPlans.
  expect(versions.size).toBe(0);
  for (const command of new Map(
    state.commands.map((c) => [c.operationId, c]),
  ).values()) {
    const receipt = await db
      .doc("idempotencyKeys/" + operator + "-" + command.operationId)
      .get();
    expect(receipt.exists).toBe(command.expectedVersion !== 1 || version === 2);
  }
}
async function geometry(page: Page) {
  const control = page.getByRole("button", { name: "Tải lại", exact: true });
  await control.focus();
  await expect(control).toBeFocused();
  expect(
    await control.evaluate((e) => {
      const rect = e.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}
async function intercept(
  page: Page,
  state: State,
  cursor: string | null,
  mode: "fail" | "hold",
) {
  let matched = false,
    release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  state.releases.add(release);
  const fetched = terminal<Listing>(state),
    delivered = terminal<void>(state);
  await page.route("**/listWork", (route) =>
    tracked(page, state, async () => {
      if (matched || listAfter(route) !== cursor) {
        await route.continue();
        return;
      }
      matched = true;
      const actual = await route.fetch();
      live(page, state);
      const body = await actual.json();
      live(page, state);
      if (body.error || !body.result)
        throw Error("Actual held read did not ACK");
      fetched.success(body.result);
      if (mode === "hold") {
        await held;
        if (state.cancelled) {
          await route.abort();
          return;
        }
      }
      if (mode === "fail") await route.abort();
      else await route.fulfill({ response: actual });
      delivered.success(undefined);
    }).catch(async () => {
      fetched.cancel();
      delivered.cancel();
      try {
        await route.abort();
      } catch {
        /* cancelled browser */
      }
    }),
  );
  return {
    fetched: fetched.wait,
    delivered: delivered.wait,
    release: () => {
      state.releases.delete(release);
      release();
    },
  };
}

test("Membership034 beyond30 CAS, failed navigation and deleted owned cursor at 390", async ({
  page,
  fixture: state,
}) => {
  const current = await enter(page, state, 390);
  await geometry(page);
  await open(page, state);
  const price = page.getByLabel("Giá trả trước (₫)", { exact: true });
  await price.fill("110000");
  await tracked(page, state, async () => {
    await directWrite(
      state,
      new Map([
        [
          "membershipPlans/" + state.target,
          { ...plan, status: "published", version: 2, price: 120000 },
        ],
      ]),
      () =>
        db
          .doc("membershipPlans/" + state.target)
          .update({ version: 2, price: 120000 }),
    );
  });
  const rejected = observeCommand(page, state, "ABORTED");
  await page.getByRole("button", { name: "Lưu gói", exact: true }).click();
  await rejected.wait();
  expect(
    (
      await db
        .doc(
          "idempotencyKeys/" +
            operator +
            "-" +
            state.commands.at(-1)!.operationId,
        )
        .get()
    ).exists,
  ).toBe(false);
  await readClick(page, state, "Tải lại", current.after);
  await expect(price).toHaveValue("110000"); // Reload leaves the selected v1 draft intact.
  await open(page, state);
  await expect(price).toHaveValue("120000");
  await price.fill("130000");
  const saved = observeCommand(page, state),
    refreshed = observeList(page, state, current.after);
  await page.getByRole("button", { name: "Lưu gói", exact: true }).click();
  await saved.wait();
  await refreshed.wait();
  await expect(row(page, state.target)).toContainText("130.000");
  await checkEffects(state, 3, 1);
  // Guaranteed owned cursor: 32 contiguous tail rows place target beyond an owned boundary.
  expect(state.ids.includes(current.after!)).toBe(true);
  const failed = await intercept(page, state, null, "fail");
  await page.getByRole("button", { name: "Trang đầu", exact: true }).click();
  await failed.fetched();
  await failed.delivered();
  await expect(page.getByRole("alert")).toContainText("Chưa tải được");
  await expect(
    page
      .getByRole("region", { name: "Danh sách gói thành viên", exact: true })
      .locator("article"),
  ).toHaveCount(0);
  await readClick(page, state, "Tải lại", current.after);
  await expect(row(page, state.target)).toBeVisible();
  await tracked(page, state, async () => {
    await deleteOwnedRoots(page, state, ["membershipPlans/" + current.after]);
  });
  const invalid = page.waitForResponse((r) => listAfter(r) === current.after);
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  expect((await (await invalid).json()).error?.status).toBe("INVALID_ARGUMENT");
  await expect(page.getByRole("alert")).toContainText("Chưa tải được");
  await readClick(page, state, "Trang đầu", null);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Membership034 immutable replay and real terminal empty continuation at 768", async ({
  page,
  fixture: state,
}) => {
  const current = await enter(page, state, 768);
  await geometry(page);
  await open(page, state);
  await page.getByLabel("Giá trả trước (₫)", { exact: true }).fill("140000");
  let lost = false;
  const committed = terminal<void>(state);
  await page.route("**/workspaceCommand", (route) =>
    tracked(page, state, async () => {
      const command = commandData(route);
      if (
        lost ||
        command?.id !== state.target ||
        command.action !== "saveMembershipPlan"
      ) {
        await route.continue();
        return;
      }
      const actual = await route.fetch();
      live(page, state);
      const body = await actual.json();
      live(page, state);
      if (!body.result || body.error || body.result.version !== 2)
        throw Error("Save did not actually commit");
      await captureCommitted(page, state, command, body.result);
      state.settledOps.add(command.operationId);
      lost = true;
      await route.abort();
      committed.success(undefined);
    }).catch(async () => {
      committed.cancel();
      try {
        await route.abort();
      } catch {
        /* cancelled */
      }
    }),
  );
  await page.getByRole("button", { name: "Lưu gói", exact: true }).click();
  await committed.wait();
  await expect(
    page.getByRole("button", {
      name: "Thử lại thao tác đang chờ",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeDisabled();
  const saved = observeCommand(page, state),
    refreshed = observeList(page, state, current.after);
  await page
    .getByRole("button", { name: "Thử lại thao tác đang chờ", exact: true })
    .click();
  await saved.wait();
  await refreshed.wait();
  expect(
    lost &&
      state.commands.length === 2 &&
      JSON.stringify(state.commands[0]) === JSON.stringify(state.commands[1]),
  ).toBe(true);
  await expect(row(page, state.target)).toContainText("140.000");
  await checkEffects(state, 2, 1);
  await readClick(page, state, "Tải lại", current.after);
  let listing = await readClick(page, state, "Trang đầu", null);
  // Discover a REAL full page with an owned cursor; only our tail successors are removed.
  for (
    let i = 0;
    i < state.pageBudget &&
    !(listing.result.next && state.ids.includes(listing.result.next));
    i++
  ) {
    if (!listing.result.next)
      throw Error("Owned full-page continuation unavailable");
    listing = await readClick(
      page,
      state,
      "Trang tiếp theo",
      listing.result.next,
    );
  }
  const cursor = listing.result.next;
  if (!cursor || !state.ids.includes(cursor))
    throw Error("No known owned terminal cursor");
  const successors = state.ids.filter((id) => id > cursor);
  // Read-only exact tail verifies there are no foreign rows to delete or claim absent.
  const tail = await db
    .collection("membershipPlans")
    .orderBy(FieldPath.documentId())
    .startAfter(cursor)
    .limit(101)
    .select()
    .get();
  if (tail.size > 100 || tail.docs.some((d) => !successors.includes(d.id)))
    throw Error(
      "Foreign terminal tail changed; fixture cannot prove empty safely",
    );
  await tracked(page, state, async () => {
    await deleteOwnedRoots(
      page,
      state,
      successors.map((id) => "membershipPlans/" + id),
    );
  });
  const empty = await readClick(page, state, "Trang tiếp theo", cursor);
  expect(empty.result.rows.length === 0 && empty.result.next === null).toBe(
    true,
  );
  await expect(
    page.getByText("Chưa có gói thành viên trong trang này.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Trang tiếp theo", exact: true }),
  ).toHaveCount(0);
  await readClick(page, state, "Tải lại", cursor);
  await expect(
    page.getByText("Chưa có gói thành viên trong trang này.", { exact: true }),
  ).toBeVisible();
  await readClick(page, state, "Trang đầu", null);
});

test("Membership034 late page cannot replace save refresh; gift choice clears at 1440", async ({
  page,
  fixture: state,
}) => {
  const current = await enter(page, state, 1440);
  await geometry(page);
  await open(page, state);
  await page.getByLabel("Giá trả trước (₫)", { exact: true }).fill("150000");
  // Hold the real first-page body while a child save starts a newer current-page read.
  const older = await intercept(page, state, null, "hold");
  await page.getByRole("button", { name: "Trang đầu", exact: true }).click();
  await older.fetched();
  await expect(
    page.getByRole("button", { name: "Tải lại", exact: true }),
  ).toBeDisabled();
  const saved = observeCommand(page, state),
    refreshed = observeList(page, state, current.after);
  await page.getByRole("button", { name: "Lưu gói", exact: true }).click();
  await saved.wait();
  await refreshed.wait();
  await expect(row(page, state.target)).toContainText("150.000");
  older.release();
  await older.delivered();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(row(page, state.target)).toContainText("150.000");
  await readClick(page, state, "Tải lại", current.after);
  await checkEffects(state, 2, 1);
  const disclosure = page.getByText("Cấp tặng có ghi nhận", { exact: true });
  await disclosure.focus();
  await disclosure.press("Enter");
  const uid = page.getByRole("textbox", { name: "Mã khách hàng", exact: true });
  const reason = page.getByLabel("Lý do cấp tặng", { exact: true });
  const choice = page.getByRole("combobox", {
    name: "Gói đã duyệt",
    exact: true,
  });
  await reason.fill("Synthetic owned gift034");
  await choice.selectOption(state.target);
  const gift = page.getByRole("button", {
    name: "Cấp tặng membership",
    exact: true,
  });
  const beforeInvalid = state.commands.length;
  const valid128 = "A-" + "b".repeat(125) + "9";
  await uid.fill(valid128 + "X");
  await gift.click();
  await expect(uid).toHaveValue(valid128 + "X");
  await expect(uid).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toContainText("Kiểm tra mã khách hàng");
  expect(
    await uid.evaluate(
      (e: HTMLInputElement) => e.value.length === 129 && !e.checkValidity(),
    ),
  ).toBe(true);
  expect(state.commands.length).toBe(beforeInvalid);
  for (const invalid of ["", "a_b", "a/b", " a-b", "a-b ", "Đ123"]) {
    await uid.fill(invalid);
    await gift.click();
    await expect(uid).toHaveValue(invalid);
    expect(
      await uid.evaluate((e: HTMLInputElement) => !e.checkValidity()),
    ).toBe(true);
    expect(state.commands.length).toBe(beforeInvalid);
  }
  await uid.fill(valid128);
  await expect(uid).toHaveValue(valid128);
  expect(
    await uid.evaluate(
      (e: HTMLInputElement) => e.value.length === 128 && e.checkValidity(),
    ),
  ).toBe(true);
  // Form validity is not a real grant/authority proof for this nonexistent128 UID.
  await uid.fill(state.customer);
  await expect(uid).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await readClick(page, state, "Trang đầu", null);
  await expect(choice).toHaveValue("");
  await expect(uid).toHaveValue(state.customer);
  await expect(reason).toHaveValue("Synthetic owned gift034");
  expect(
    await choice.evaluate(
      (e: HTMLSelectElement) => e.required && !e.checkValidity(),
    ),
  ).toBe(true);
  await expect(choice).toHaveAccessibleDescription(
    "Chọn gói đã duyệt trên trang đang xem.",
  );
  // Actual bounded pages restore the published target, with no injected options.
  let listing = state.latest!;
  for (
    let i = 0;
    i < state.pageBudget &&
    !listing.result.rows.some((p) => p.id === state.target);
    i++
  ) {
    if (!listing.result.next) throw Error("Published owned target unavailable");
    listing = await readClick(
      page,
      state,
      "Trang tiếp theo",
      listing.result.next,
    );
  }
  await expect(row(page, state.target)).toBeVisible();
  await choice.selectOption(state.target);
  const granted = observeCommand(page, state);
  await page
    .getByRole("button", { name: "Cấp tặng membership", exact: true })
    .click();
  await granted.wait();
  await expect(page.getByRole("status")).toContainText("Đã cấp tặng");
  const subscription = await db
    .doc("membershipSubscriptions/" + state.customer)
    .get();
  expect(
    subscription.get("ownerId") === state.customer &&
      subscription.get("planId") === state.target &&
      subscription.get("state") === "active",
  ).toBe(true);
  expect(subscription.get("planSnapshot")).toMatchObject({
    ...plan,
    status: "published",
    price: 150000,
    version: 2,
  });
  expect(subscription.get("endsAt") - subscription.get("startsAt")).toBe(
    7 * 86400000,
  );
  const history = await db
    .collection("membershipHistory")
    .where("ownerId", "==", state.customer)
    .limit(101)
    .get();
  expect(history.size).toBe(1);
  expect(
    history.docs[0].get("actor") === operator &&
      history.docs[0].get("action") === "grant",
  ).toBe(true);
  const audits = await db
    .collection("auditEvents")
    .where("resourceId", "==", state.customer)
    .limit(101)
    .get();
  expect(audits.size).toBe(1);
  expect(
    audits.docs[0].get("actor") === operator &&
      audits.docs[0].get("action") === "membership.grant",
  ).toBe(true);
  const command = state.commands.find((c) => c.action === "grant")!;
  expect(
    (
      await db
        .doc("idempotencyKeys/" + operator + "-" + command.operationId)
        .get()
    ).get("result.id") === state.customer,
  ).toBe(true);
  expect(
    (
      await db
        .doc("outboxJobs/membership-" + operator + "-" + command.operationId)
        .get()
    ).get("ownerId") === state.customer,
  ).toBe(true);
  for (const collection of [
    "membershipInvoices",
    "financialEntries",
    "bankTransactions",
  ])
    expect(
      (
        await db
          .collection(collection)
          .where("ownerId", "==", state.customer)
          .limit(1)
          .get()
      ).size,
    ).toBe(0);
});
