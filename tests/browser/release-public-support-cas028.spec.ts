import { test, expect, type Request } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { seedIdentities, closeFixtures, freshCustomer, db } from "./fixtures";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

type Reply = {
  action: string;
  id: string;
  operationId: string;
  expectedVersion: number;
  payload: { message: string; status: string };
};
function ownedDocumentTarget(request: Request, id: string) {
  if (request.method() !== "POST" || !request.url().includes("/Listen/channel"))
    return false;
  const values = new URLSearchParams(request.postData() ?? "");
  for (const value of values.values()) {
    try {
      const target = JSON.parse(value)?.addTarget?.documents?.documents;
      if (
        Array.isArray(target) &&
        target.some(
          (name: unknown) =>
            typeof name === "string" &&
            name.endsWith(`/documents/supportTickets/${id}`),
        )
      )
        return true;
    } catch {
      // WebChannel also sends non-JSON transport fields.
    }
  }
  return false;
}

test("SUPPORT028 public owner definite CAS reloads the server ticket and preserves the reply for a new operation", async ({
  page,
}) => {
  const actor = await freshCustomer();
  const id = `public-cas028-${randomUUID()}`;
  const ref = db.doc(`supportTickets/${id}`);
  const subject = `Synthetic ${id}`;
  const originalMessage = "Synthetic original owned public support request";
  const body = "Synthetic retained public CAS reply028";
  const commands: Reply[] = [];
  let documentReads = 0,
    privilegedReads = 0;
  page.on("request", (request) => {
    if (ownedDocumentTarget(request, id)) documentReads++;
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/listWork")
    )
      privilegedReads++;
  });
  try {
    await ref.set({
      ownerId: actor.uid,
      subject,
      message: originalMessage,
      status: "open",
      version: 1,
      createdAt: Date.now(),
    });
    await page.goto("/account");
    const identity = page.getByRole("combobox", {
      name: "Vai trò thử",
      exact: true,
    });
    // Use the existing emulator-only login for a unique, Google-linked fixture.
    // This adds a test identity option; it does not replace auth or its response.
    await identity.evaluate((element, value) => {
      (element as HTMLSelectElement).add(
        new Option("Synthetic isolated customer", value),
      );
    }, actor.identity);
    await identity.selectOption(actor.identity);
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    await page.goto("/support");
    const card = page
      .locator("article")
      .filter({
        has: page.getByRole("heading", { name: subject, exact: true }),
      });
    await expect(card).toBeVisible();
    await card.getByText("Xem và gửi phản hồi", { exact: true }).click();
    const input = card.getByLabel("Phản hồi", { exact: true });
    const submit = card.getByRole("button", {
      name: "Gửi phản hồi",
      exact: true,
    });
    await expect(input).toBeEnabled();
    await input.fill(body);
    await page.route("**/workspaceCommand", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const command = route.request().postDataJSON()?.data as Reply | undefined;
      if (command?.id !== id || command.action !== "replyTicket")
        return route.continue();
      commands.push(command);
      if (commands.length === 1) {
        // The immutable request already contains version1. Keep it held while
        // the real snapshot advances; the real service must reject this CAS.
        expect(command.expectedVersion).toBe(1);
        await ref.update({ version: 2 });
      }
      return route.continue();
    });
    const rejected = page.waitForResponse(
      (response) =>
        response.url().endsWith("/workspaceCommand") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.id === id,
    );
    await submit.click();
    expect((await (await rejected).json()).error?.status).toBe("ABORTED");
    await expect(card.getByRole("alert")).toContainText(
      "Phản hồi chưa được chấp nhận",
    );
    await expect(input).toHaveValue(body);
    await expect(input).toBeDisabled();
    await expect(submit).toBeDisabled();
    expect(commands).toHaveLength(1);
    expect((await ref.collection("messages").get()).size).toBe(0);
    expect(
      (
        await db
          .doc(`idempotencyKeys/${actor.uid}-${commands[0].operationId}`)
          .get()
      ).exists,
    ).toBe(false);
    expect((await ref.get()).get("version")).toBe(2);
    const readsBeforeReload = documentReads;
    const messages = page.waitForResponse(
      (response) =>
        response.url().endsWith("/ticketMessages") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.id === id,
    );
    await card
      .getByRole("button", { name: "Tải lại phản hồi", exact: true })
      .click();
    expect((await messages).ok()).toBe(true);
    await expect.poll(() => documentReads).toBeGreaterThan(readsBeforeReload);
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue(body);
    await expect(card.getByRole("alert")).toHaveCount(0);
    expect(commands).toHaveLength(1);
    const accepted = page.waitForResponse(
      (response) =>
        response.url().endsWith("/workspaceCommand") &&
        response.request().method() === "POST" &&
        response.request().postDataJSON()?.data?.id === id,
    );
    await submit.click();
    expect((await (await accepted).json()).result?.version).toBe(3);
    await expect(
      card.getByText("Đã gửi phản hồi.", { exact: true }),
    ).toBeVisible();
    await expect(card.getByText(body, { exact: true })).toBeVisible();
    await expect(input).toHaveValue("");
    expect(commands).toHaveLength(2);
    expect(commands[1].expectedVersion).toBe(2);
    expect(commands[1].operationId).not.toBe(commands[0].operationId);
    expect(commands[1].payload).toEqual(commands[0].payload);
    expect(commands[1].payload).toEqual({ message: body, status: "open" });
    const stored = await ref.collection("messages").get();
    expect(stored.size).toBe(1);
    expect(stored.docs[0].get("text")).toBe(body);
    expect(stored.docs[0].get("authorId")).toBe(actor.uid);
    const ticket = (await ref.get()).data();
    expect(ticket).toMatchObject({
      ownerId: actor.uid,
      subject,
      message: originalMessage,
      status: "open",
      version: 3,
    });
    expect(
      (
        await db
          .doc(`idempotencyKeys/${actor.uid}-${commands[1].operationId}`)
          .get()
      ).exists,
    ).toBe(true);
    const audits = await db
      .collection("auditEvents")
      .where("resourceId", "==", id)
      .get();
    expect(audits.size).toBe(1);
    expect(audits.docs[0].data()).toMatchObject({
      actor: actor.uid,
      action: "replyTicket",
      resourceId: id,
    });
    expect(privilegedReads).toBe(0);
  } finally {
    await page.unroute("**/workspaceCommand");
    await page.goto("/");
    await db.recursiveDelete(ref);
    const ownedAudits = await db
      .collection("auditEvents")
      .where("resourceId", "==", id)
      .get();
    const cleanup = db.batch();
    for (const audit of ownedAudits.docs) {
      expect(audit.get("actor")).toBe(actor.uid);
      cleanup.delete(audit.ref);
    }
    for (const command of commands)
      cleanup.delete(
        db.doc(`idempotencyKeys/${actor.uid}-${command.operationId}`),
      );
    cleanup.delete(db.doc(`users/${actor.uid}`));
    await cleanup.commit();
    await getAuth(getApp("release021-browser")).deleteUser(actor.uid);
  }
});
