import { test, expect, type Page } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import ts from "typescript";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import {
  runInvitationCommand,
  runListInvitations,
  runListStaffMembers,
  runDepartStaffMember,
  runRecipientInvitation,
  invitationRef,
} from "../../functions/src/staff-invitations";
import { deliverStaffInvitationJob } from "../../functions/src/staff-invitation-email";

// Current source modules mounted on the shared 5207 origin. Firebase callable runtime,
// Google and MFA identity are simulated; handlers/transactions use real demo Firestore.
// No additional server, shared runtime mutation, real identities or network email.
if (
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("Shared demo emulator required");
const app = initializeApp({ projectId: "demo-satsunicgo" }),
  actual = getFirestore(app),
  owned = new Set<string>(),
  actors: string[] = [];
const authFixtures: string[] = [];
const ids: string[] = [],
  emails: string[] = [];
const db = new Proxy(actual, {
  get(t, p) {
    if (p === "doc")
      return (path: string) => {
        owned.add(path);
        return actual.doc(path);
      };
    const v = Reflect.get(t, p);
    return typeof v === "function" ? v.bind(t) : v;
  },
});

const digestFixture = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function ownsCleanupPath(path: string) {
  const [collection, key] = path.split("/");
  if (["users", "staffAccess"].includes(collection))
    return actors.includes(key);
  if (collection === "staffInvitations")
    return (
      ids.some((id) => key === `invite-${id}`) ||
      actors.some((uid) => key === `quota-${digestFixture(uid)}`) ||
      emails.some((email) => key === `email-${digestFixture(email)}`)
    );
  if (collection === "staffInvitationMailJobs")
    return ids.some((id) => key.startsWith(`${id}-`));
  if (collection === "idempotencyKeys")
    return actors.some(
      (uid) =>
        key.startsWith(`${uid}-`) ||
        key.startsWith(`staff-invite-${uid}-`) ||
        key.startsWith(`staff-depart-${uid}-`),
    );
  return collection === "auditEvents" && owned.has(path); // Added only by exact actor query below.
}
const preservation = new Map<string, string>();
async function captureSharedProfiles() {
  for (const collection of ["users", "staffAccess"])
    for (const doc of (await actual.collection(collection).get()).docs) {
      if (!/^(staff-qa-|staff-browser-|staff-legacy-)/.test(doc.id))
        preservation.set(
          doc.ref.path,
          digestFixture(JSON.stringify(doc.data())),
        );
    }
}
async function checkSharedProfiles() {
  for (const [path, hash] of preservation) {
    const doc = await actual.doc(path).get();
    expect(
      doc.exists && digestFixture(JSON.stringify(doc.data())) === hash,
      "Shared demo profile changed outside fixture ownership",
    ).toBe(true);
  }
}

const artifacts = "docs/reviews/STAFF-INVITATION-20261017";
let workspace: typeof import("../../functions/src/workspace");
test.beforeAll(async () => {
  await captureSharedProfiles();
  mkdirSync(artifacts, { recursive: true });
  workspace = await import("../../functions/src/workspace");
});
test.afterAll(async () => {
  for (const actor of actors) {
    for (const d of (
      await actual.collection("auditEvents").where("actor", "==", actor).get()
    ).docs)
      owned.add(d.ref.path);
    for (const d of (
      await actual
        .collection("idempotencyKeys")
        .orderBy("__name__")
        .startAt(`${actor}-`)
        .endBefore(`${actor}-~`)
        .get()
    ).docs)
      owned.add(d.ref.path);
  }
  await Promise.all(
    [...owned].filter(ownsCleanupPath).map((path) => actual.doc(path).delete()),
  );
  for (const uid of authFixtures) await getAuth(app).deleteUser(uid);
  await checkSharedProfiles();
  await actual.terminate();
  await deleteApp(app);
});
async function harness(page: Page) {
  const suffix = randomUUID(),
    owner = `staff-browser-owner-${suffix}`,
    employee = `staff-browser-employee-${suffix}`,
    email = `member-${suffix}@example.invalid`;
  actors.push(owner, employee);
  emails.push(email);
  owned.add(`staffAccess/${employee}`);
  await db.doc(`users/${owner}`).set({
    displayName: "Chủ doanh nghiệp thử nghiệm",
    email: `owner-${suffix}@example.invalid`,
    locked: false,
  });
  await db
    .doc(`users/${employee}`)
    .set({ displayName: "Nhân viên thử nghiệm", email, locked: false });
  await db
    .doc(`staffAccess/${owner}`)
    .set({ roles: ["OWNER"], active: true, locked: false, version: 1 });
  const auth = (uid: string, address: string, mfa = false) =>
    ({
      uid,
      token: {
        email: address,
        email_verified: true,
        name: "Nhân viên thử nghiệm",
        auth_time: Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: "google.com",
          ...(mfa ? { sign_in_second_factor: "totp" } : {}),
        },
      },
    }) as unknown as CallableRequest["auth"];
  const identities = {
    owner: auth(owner, `owner-${suffix}@example.invalid`, true),
    employee: auth(employee, email),
    wrong: auth(employee, "wrong@example.invalid"),
  };
  let lostCreate = false,
    lostRole = false,
    listFail = false,
    delayAccept: Promise<void> | undefined;
  const calls: { name: string; data: Record<string, unknown> }[] = [];
  await page.exposeFunction(
    "staffQAService",
    async (
      name: string,
      data: Record<string, unknown>,
      actor: keyof typeof identities,
    ) => {
      calls.push({ name, data });
      const req = { auth: identities[actor], data } as CallableRequest;
      try {
        let result;
        if (name === "staffInvitationCommand") {
          result = await runInvitationCommand(db, req);
          ids.push(result.id);
          if (lostCreate && data.action === "create") {
            lostCreate = false;
            throw { code: "unavailable" };
          }
        } else if (name === "listStaffInvitations") {
          if (listFail) throw { code: "unavailable" };
          result = await runListInvitations(db, req);
        } else if (name === "listStaffMembers")
          result = await runListStaffMembers(db, req);
        else if (name === "departStaffMember")
          result = await runDepartStaffMember(db, req);
        else if (name === "readStaffInvitation")
          result = await runRecipientInvitation(db, req, false);
        else if (name === "acceptStaffInvitation") {
          if (delayAccept) await delayAccept;
          result = await runRecipientInvitation(db, req, true);
        } else if (name === "readStaffAccess")
          result = await workspace.readStaffAccess.run(req);
        else if (name === "workspaceCommand") {
          result = await workspace.workspaceCommand.run(req);
          if (lostRole) {
            lostRole = false;
            throw { code: "unavailable" };
          }
        } else throw Error("Unexpected service " + name);
        return { result };
      } catch (e) {
        return { error: { code: (e as { code?: string }).code ?? "internal" } };
      }
    },
  );
  const current = await (
    await page.request.get("/src/features/settings/StaffAccess.tsx")
  ).text();
  const version = current.match(/react\.js\?v=([a-z0-9]+)/)?.[1];
  expect(version).toBeTruthy();
  const dep = (name: string) =>
    `/node_modules/.vite/deps/${name}.js?v=${version}`;
  const replacements: Record<string, string> = {
    "../../../packages/domain/staff-invitation": "/__staffqa/domain.js",
    "../../shared/firebase": "/__staffqa/service.js",
    "../../shared/feedback": "/src/shared/feedback.ts",
    "../../shared/StepForm": "/src/shared/StepForm.tsx",
    "../crm/CrmPresentation": "/src/features/crm/CrmPresentation.tsx",
    "react-router-dom": dep("react-router-dom"),
    zod: dep("zod"),
  };
  const compile = (path: string) => {
    const source = readFileSync(path, "utf8");
    let js = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
      },
    }).outputText;
    js = js.replace(
      /import\s*{([^}]+)}\s*from\s*["']react["'];?/g,
      (_m, names) => `const {${names}} = React;`,
    );
    js = js.replace(/import\s*["'][^"']+\.css["'];?/g, "");
    for (const [from, to] of Object.entries(replacements))
      js = js
        .replaceAll(`"${from}"`, `"${to}"`)
        .replaceAll(`'${from}'`, `'${to}'`);
    return `import React from '${dep("react")}';\n` + js;
  };
  const modules: Record<string, string> = {
    "/__staffqa/staff.js": compile("src/features/settings/StaffAccess.tsx"),
    "/__staffqa/accept.js": compile(
      "src/features/settings/StaffInvitationAccept.tsx",
    ),
    "/__staffqa/domain.js": compile("packages/domain/staff-invitation.ts"),
    "/__staffqa/service.js": `export async function callService(name,data){const r=await window.staffQAService(name,data,window.staffQAActor);if(r.error)throw Object.assign(new Error('Synthetic service error'),r.error);return r.result;}`,
  };
  await page.route("**/__staffqa/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      contentType: "text/javascript",
      body: modules[path] ?? 'throw Error("Unknown module")',
    });
  });
  const css = readFileSync(
    "src/features/settings/staff-invitations.css",
    "utf8",
  );
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}body{margin:0}#root{max-width:1400px;margin:auto;padding:16px}.workspaceShell{display:block;min-height:100vh}.workspaceContent{padding:0}</style></head><body class="workspaceShell" style="display:block;min-height:100vh"><main class="workspaceContent" style="padding:0"><div id="root"></div></main>
 <script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script>
 <script type="module">
 import React from '${dep("react")}';import ReactDOM from '${dep("react-dom_client")}';import {BrowserRouter} from '${dep("react-router-dom")}';
 import '/src/styles/global.css';import '/src/features/settings/admin-workbench096.css';
 import {StaffAccess} from '/__staffqa/staff.js';import {StaffInvitationAccept} from '/__staffqa/accept.js';
 const p=new URLSearchParams(location.search),mode=p.get('mode')||'owner';window.staffQAActor=mode==='owner'?'owner':mode==='wrong'?'wrong':'employee';
 function Fixture(){const [user,setUser]=React.useState(mode==='anonymous'?null:{uid:'${employee}',email:mode==='wrong'?'wrong@example.invalid':'${email}'});window.staffQASetUser=setUser;return mode==='owner'?React.createElement(StaffAccess):React.createElement(StaffInvitationAccept,{user,busy:false,signIn:()=>{window.staffQAActor='employee';setUser({uid:'${employee}',email:'${email}'})},signOut:()=>setUser(null)})}
 ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,{},React.createElement(Fixture)));
 </script></body></html>`;
  await page.route("**/__staff-invitation-test*", (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return {
    email,
    employee,
    owner,
    identities,
    calls,
    errors,
    setGoogleIdentity: async (photoURL: string) => {
      if (!authFixtures.includes(employee)) {
        await getAuth(app).createUser({ uid: employee, email });
        authFixtures.push(employee);
      }
      await getAuth(app).updateUser(employee, {
        photoURL,
        providerToLink: {
          providerId: "google.com",
          uid: employee,
          email,
          displayName: "Nguyễn Minh An",
          photoURL,
        },
      });
    },
    loseCreate: () => (lostCreate = true),
    loseRole: () => (lostRole = true),
    failList: (v: boolean) => (listFail = v),
    delayAccept: (p: Promise<void>) => (delayAccept = p),
    open: async (mode = "owner", id = "") => {
      await page.goto(
        `/__staff-invitation-test?mode=${mode}${id ? `&id=${id}` : ""}`,
      );
    },
    create: async () => {
      const r = await runInvitationCommand(db, {
        auth: identities.owner,
        data: { action: "create", email, operationId: randomUUID() },
      });
      ids.push(r.id);
      return r.id;
    },
  };
}
test("full UI send → simulated email → accept → grant with real transactions", async ({
  page,
}) => {
  const f = await harness(page);
  await f.open();
  await page.getByLabel("Email tài khoản Google").fill(f.email);
  await page.getByRole("button", { name: "Gửi lời mời", exact: true }).click();
  const row = page.locator(".staffInviteList li").filter({ hasText: f.email });
  await expect(row).toContainText("Chờ chấp nhận");
  await expect(row).toContainText("Đang chờ gửi email");
  const result = await actual
    .collection("staffInvitations")
    .where("email", "==", f.email)
    .get();
  expect(result.size).toBe(1);
  const id = result.docs[0].get("id");
  let link = "";
  await deliverStaffInvitationJob({
    db,
    jobId: `${id}-1`,
    from: "contact@hunpeolabs.com",
    send: async (message, _job, fence) => {
      expect(await fence()).toBe(true);
      link = message.text;
      return { state: "accepted", providerId: randomUUID(), attempted: true };
    },
  });
  expect(link).toContain(`/join-staff?id=${id}`);
  await f.open("anonymous", id);
  await page
    .getByRole("button", { name: "Đăng nhập với Google", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Chấp nhận tham gia" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chấp nhận tham gia" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Bạn đã chấp nhận lời mời",
  );
  expect((await db.doc(`staffAccess/${f.employee}`).get()).exists).toBe(false);
  await f.open();
  await page.locator(".staffInviteHistory > summary").click();
  await expect(row).toContainText("Đã tham gia");
  await row.getByRole("button", { name: "Phân quyền", exact: true }).click();
  await page
    .getByRole("button", { name: "Kiểm tra quyền hiện tại", exact: true })
    .first()
    .click();
  await page.getByRole("checkbox", { name: "Hỗ trợ", exact: true }).check();
  await page.getByRole("button", { name: /Tiếp tục/ }).click();
  await page.getByRole("checkbox", { name: "Được phép làm việc" }).check();
  await page.getByRole("button", { name: /Tiếp tục/ }).click();
  await page
    .getByRole("button", { name: "Lưu quyền nhân viên", exact: true })
    .click();
  await expect(row).toContainText("Đã cấp quyền");
  expect(
    (await db.doc(`staffAccess/${f.employee}`).get()).data(),
  ).toMatchObject({ roles: ["SUPPORT"], active: true });
  await page.screenshot({
    path: `${artifacts}/owner-granted.png`,
    fullPage: true,
  });
  expect(f.errors).toEqual([]);
});
test("wrong account, expiry, revocation, invalid link and refresh after acceptance", async ({
  page,
}) => {
  const f = await harness(page),
    id = await f.create();
  await f.open("wrong", id);
  await expect(page.getByRole("alert")).toContainText(
    "không dành cho tài khoản này",
  );
  await page
    .getByRole("button", { name: "Đăng xuất để đổi tài khoản" })
    .click();
  await page.getByRole("button", { name: "Đăng nhập với Google" }).click();
  await expect(
    page.getByRole("button", { name: "Chấp nhận tham gia" }),
  ).toBeEnabled();
  await invitationRef(db, id).update({ expiresAt: Date.now() - 1 });
  await f.open("employee", id);
  await expect(page.getByRole("status")).toContainText("hết hạn");
  await invitationRef(db, id).update({ state: "revoked" });
  await page.reload();
  await expect(page.getByRole("status")).toContainText("thu hồi");
  await f.open("employee", "bad");
  await expect(page.getByRole("alert")).toContainText("chưa hợp lệ");
  expect(f.errors).toEqual([]);
});
test("lost create response reconciles same operation without duplicate invitation", async ({
  page,
}) => {
  const f = await harness(page);
  await f.open();
  f.loseCreate();
  await page.getByLabel("Email tài khoản Google").fill(f.email);
  await page.getByRole("button", { name: "Gửi lời mời", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Chưa xác nhận được kết quả" }),
  ).toBeVisible();

  await expect(page.getByLabel("Email tài khoản Google")).toHaveValue(f.email);
  await expect(
    page.getByRole("button", { name: "Gửi lời mời", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Kiểm tra thao tác đang chờ" })
    .click();
  await expect(
    page.locator(".staffInviteList li").filter({ hasText: f.email }),
  ).toBeVisible();
  const commands = f.calls.filter((c) => c.name === "staffInvitationCommand");
  expect(commands).toHaveLength(2);
  expect(commands[0].data.operationId).toBe(commands[1].data.operationId);
  expect(
    (
      await actual
        .collection("staffInvitations")
        .where("email", "==", f.email)
        .get()
    ).size,
  ).toBe(1);
  expect(f.errors).toEqual([]);
});
test("responsive layouts, keyboard, live status and failed list recovery", async ({
  page,
}) => {
  const f = await harness(page);
  f.failList(true);
  await f.open();
  await page.locator(".staffInviteHistory > summary").click();
  await expect(page.getByRole("alert")).toContainText("Chưa tải được");
  await expect(
    page.getByText("Chưa có lời mời nào.", { exact: false }),
  ).toHaveCount(0);
  f.failList(false);
  await page.getByRole("button", { name: "Tải lại danh sách" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.locator(".staffInviteHistory > summary").click();
  await expect(page.locator(".staffInviteHistory")).not.toHaveAttribute(
    "open",
    "",
  );
  const input = page.getByLabel("Email tài khoản Google");
  await input.focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Gửi lời mời", exact: true }),
  ).toBeFocused();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `${artifacts}/owner-${width}.png`,
      fullPage: true,
    });
  }
  await page.evaluate(() => {
    document.body.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    document.body.style.zoom = "1";
  });
  const id = await f.create();
  await f.open("employee", id);
  await expect(
    page.getByRole("button", { name: "Chấp nhận tham gia" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifacts}/recipient-320.png`,
    fullPage: true,
  });
  const snapshot = await page.locator(".staffInviteAccept").ariaSnapshot();
  expect(snapshot).toContain("Chấp nhận tham gia");
  expect(snapshot).toContain("Tài khoản đang dùng");
  expect(f.errors).toEqual([]);
});

test("directory preserves legacy dates, separates lock from departure and reconciles role save", async ({
  page,
}) => {
  const f = await harness(page);
  const joinedAt = Date.UTC(2026, 9, 1);
  await db
    .doc(`users/${f.employee}`)
    .set({ displayName: "Nguyễn Minh An", email: f.email, locked: false });
  await db.doc(`staffAccess/${f.employee}`).set({
    roles: ["SUPPORT"],
    active: true,
    locked: true,
    version: 1,
    joinedAt,
  });
  await f.open();
  for (const column of [
    "Họ tên",
    "Email",
    "Ngày tham gia",
    "Ngày nghỉ việc",
    "Vai trò",
  ])
    await expect(
      page.getByRole("columnheader", { name: column, exact: true }),
    ).toBeVisible();
  const row = page
    .locator(".staffDirectory tbody tr")
    .filter({ hasText: f.email });
  for (let i = 0; i < 10 && (await row.count()) === 0; i++) {
    const more = page.getByRole("button", { name: "Xem thêm nhân viên" });
    if (!(await more.count())) break;
    await expect(more).toBeEnabled();
    await more.click();
    await expect(
      page.getByText("Đang tải nhân viên…", { exact: true }),
    ).toHaveCount(0);
  }
  await expect(row).toContainText("Nguyễn Minh An");
  await expect(row).toContainText("Đang khóa");
  await expect(row.locator("td").nth(2)).toHaveText("1/10/2026");
  await expect(row.locator("td").nth(3)).toHaveText("Chưa ghi nhận");
  await row.getByRole("button", { name: "Chỉnh quyền" }).click();
  await page.getByRole("button", { name: "Kiểm tra quyền hiện tại" }).click();
  await page.getByRole("button", { name: /Tiếp tục/ }).click();
  await page.getByRole("button", { name: /Tiếp tục/ }).click();
  f.loseRole();
  await page.getByRole("button", { name: "Lưu quyền nhân viên" }).click();
  await expect(
    page.getByText("Chưa xác nhận được kết quả lưu.", { exact: false }),
  ).toBeVisible();
  for (const button of await page
    .getByRole("button", { name: "Chỉnh quyền", exact: true })
    .all())
    await expect(button).toBeDisabled();
  await expect(
    row.getByRole("button", { name: "Ghi nhận nghỉ việc" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Thử lại thao tác đang chờ" }).click();
  await expect(
    row.getByRole("button", { name: "Ghi nhận nghỉ việc" }),
  ).toBeEnabled();
  const saves = f.calls.filter((c) => c.name === "workspaceCommand");
  expect(saves).toHaveLength(2);
  expect(saves[0].data.operationId).toBe(saves[1].data.operationId);
  await row.getByRole("button", { name: "Ghi nhận nghỉ việc" }).click();
  await expect(
    page.getByRole("region", { name: "Xác nhận nghỉ việc" }),
  ).toContainText("Lịch sử nhân viên được giữ lại");
  await page
    .getByRole("button", { name: "Xác nhận nghỉ việc", exact: true })
    .click();
  await expect(row).toContainText("Đã nghỉ việc");
  await expect(row.locator("td").nth(3)).not.toHaveText("Chưa ghi nhận");
  expect(
    (await actual.doc(`staffAccess/${f.employee}`).get()).data(),
  ).toMatchObject({ active: false, joinedAt, locked: true });
  await page.screenshot({
    path: `${artifacts}/directory-departed.png`,
    fullPage: true,
  });
  expect(f.errors).toEqual([]);
});

test("cleanup rejects unrelated documents even when handlers read them", () => {
  for (const path of [
    "users/unrelated-demo",
    "staffAccess/unrelated-demo",
    "staffInvitations/invite-unrelated",
    "staffInvitationMailJobs/unrelated-1",
    "idempotencyKeys/unrelated-operation",
  ]) {
    owned.add(path);
    expect(ownsCleanupPath(path)).toBe(false);
    owned.delete(path);
  }
});

test("Google name/avatar render and broken image falls back to initials", async ({
  page,
}) => {
  const f = await harness(page);
  const photo = `https://lh3.googleusercontent.com/a/staff-qa-${randomUUID()}`;
  await f.setGoogleIdentity(photo);
  await db
    .doc(`staffAccess/${f.employee}`)
    .set({ roles: ["SUPPORT"], active: true, version: 1 });
  await page.route(photo, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#163cff"/><circle cx="16" cy="12" r="6" fill="white"/><path d="M6 31a10 10 0 0 1 20 0" fill="white"/></svg>',
    }),
  );
  await f.open();
  const row = page
    .locator(".staffDirectory tbody tr")
    .filter({ hasText: f.email });
  await expect(row).toContainText("Nguyễn Minh An");
  const img = row.locator(".staffAvatar img");
  await img.scrollIntoViewIfNeeded();
  await expect(img).toHaveAttribute("src", photo);
  await expect
    .poll(() => img.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBe(32);
  await page.screenshot({
    path: `${artifacts}/directory-google-avatar.png`,
    fullPage: true,
  });
  await page.route(photo, (route) => route.abort());
  await page.reload();
  await expect(row.locator(".staffAvatar")).toHaveText("MA");
  await expect(row.locator(".staffAvatar img")).toHaveCount(0);
  expect(f.errors).toEqual([]);
});
