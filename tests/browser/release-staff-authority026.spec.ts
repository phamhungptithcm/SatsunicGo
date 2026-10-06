import { test, expect, type Page } from "@playwright/test";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function login(page: Page) {
  await page.goto("/account");
  const account = page.getByRole("button", { name: /Tài khoản của/ });
  const role = page.getByRole("combobox", { name: "Vai trò thử", exact: true });
  await expect(account.or(role)).toBeVisible();
  if (await account.isVisible()) {
    await account.click();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  }
  await role.selectOption("owner");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(account).toBeVisible();
}
const canonical = { active: true, locked: false, roles: ["OWNER"] };
for (const [label, grant] of [
  ["truthy-string", { ...canonical, active: "true" }],
  ["truthy-number", { ...canonical, active: 1 }],
  ["roles-string", { ...canonical, roles: "OWNER" }],
  ["roles-object", { ...canonical, roles: { OWNER: true } }],
  ["mixed-array", { ...canonical, roles: ["OWNER", 1] }],
] as const)
  test(`STAFF026 denies malformed ${label} without rendering privileged workspace`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await db.doc(`staffAccess/${operator}`).set(grant);
    try {
      await login(page);
      await expect(
        page
          .getByRole("navigation", { name: "Điều hướng chính" })
          .getByRole("link", { name: "CRM", exact: true }),
      ).toHaveCount(0);
      await page.goto("/crm");
      await expect(
        page.getByRole("heading", {
          name: "Cần tài khoản nhân viên được cấp quyền",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", {
          name: "Không gian vận hành",
          exact: true,
        }),
      ).toHaveCount(0);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: `${artifactDirectory}/staff-denied-${label}.png`,
      });
    } finally {
      await db.doc(`staffAccess/${operator}`).set(canonical);
    }
  });
for (const roles of [
  ["OWNER"],
  ["SUPPORT"],
  [],
  ["UNKNOWN_FUTURE_ROLE"],
  ["SUPPORT", "UNKNOWN_FUTURE_ROLE"],
])
  test(`STAFF026 typed roles remain safe ${JSON.stringify(roles)}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await db.doc(`staffAccess/${operator}`).set({ ...canonical, roles });
    try {
      await login(page);
      await page.goto("/crm");
      if (roles.includes("OWNER") || roles.includes("SUPPORT")) {
        await expect(
          page.getByRole("navigation", {
            name: "Không gian vận hành",
            exact: true,
          }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByText("Chưa có công việc trong phạm vi được cấp.", {
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.locator(".workspaceShell")).toBeVisible();
      }
      expect(errors).toEqual([]);
    } finally {
      await db.doc(`staffAccess/${operator}`).set(canonical);
    }
  });
test("STAFF026 actual snapshot revocation removes navigation and denies current CRM", async ({
  page,
}) => {
  await db.doc(`staffAccess/${operator}`).set(canonical);
  try {
    await login(page);
    await page.goto("/crm");
    await expect(
      page.getByRole("navigation", {
        name: "Không gian vận hành",
        exact: true,
      }),
    ).toBeVisible();
    await db.doc(`staffAccess/${operator}`).update({ active: false });
    await expect(
      page.getByRole("heading", {
        name: "Cần tài khoản nhân viên được cấp quyền",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Điều hướng chính" })
        .getByRole("link", { name: "CRM", exact: true }),
    ).toHaveCount(0);
  } finally {
    await db.doc(`staffAccess/${operator}`).set(canonical);
  }
});

test('STAFF026 account switch cannot reuse previous authority while current snapshot is held', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await db.doc(`staffAccess/${operator}`).set(canonical);
  await page.route('**/src/app/App.tsx*', async (route) => {
    const response = await route.fetch();
    let body = await response.text(), changed = false;
    body = body.replace(/import\s*\{([^}]+)\}\s*from\s*(["'][^"']*(?:firebase_firestore|firebase\/firestore)[^"']*["']);?/g, (whole, bindings, origin) => {
      if (!/\bonSnapshot\b/.test(bindings)) return whole;
      changed = true;
      return `import {${bindings.replace(/\bonSnapshot\b/, 'onSnapshot as __realStaffSnapshot026')}} from ${origin};`;
    });
    expect(changed, 'Only the actual App Firestore import is transformed').toBe(true);
    body += `\nconst onSnapshot=(...args)=>{if(args[0]?.path==='staffAccess/e2e005-customer-b'){window.__heldStaff026=true;return()=>{};}return __realStaffSnapshot026(...args);};\n`;
    await route.fulfill({ response, body, contentType: 'text/javascript' });
  });
  try {
    await login(page);
    await page.goto('/crm');
    await expect(page.getByRole('navigation', { name: 'Không gian vận hành', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/crm\/overview$/);
    const establishedPath = new URL(page.url()).pathname;
    await page.evaluate(async () => {
      const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
      const sdkUrl = resources.find((name) => new URL(name).pathname.endsWith('/firebase_auth.js'));
      const sharedUrl = resources.find((name) => new URL(name).pathname.endsWith('/src/shared/firebase.ts'));
      if (!sdkUrl || !sharedUrl) throw Error('Actual initialized Auth module URLs unavailable');
      const sdk = await import(sdkUrl), shared = await import(sharedUrl);
      if (!shared.emulatorMode || !shared.auth) throw Error('Dedicated emulator required');
      // Auth-emulator-only Google identity fixture, never a real Google token.
      await sdk.signInWithCredential(shared.auth, sdk.GoogleAuthProvider.credential(JSON.stringify({ sub: 'e2e005-customer-b', email: 'customer-b@satsunicgo.example.invalid', email_verified: true })));
    });
    await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __heldStaff026?: boolean }).__heldStaff026))).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Không gian vận hành', exact: true })).toHaveCount(0);
    await expect(page.getByText('Đang kiểm tra quyền vận hành…', { exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'CRM', exact: true })).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe(establishedPath);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `${artifactDirectory}/staff-current-authority-pending.png` });
  } finally { await db.doc(`staffAccess/${operator}`).set(canonical); }
});
