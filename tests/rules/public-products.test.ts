import { beforeAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
let workspace: typeof import("../../functions/src/workspace").workspaceCommand;
const editor = `ux007-${randomUUID()}`,
  customer = `ux007-${randomUUID()}`;
const request = (uid: string, data: unknown) =>
  ({
    auth: {
      uid,
      token: {
        uid,
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  }) as CallableRequest;
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = "demo-satsunicgo";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  await import("../../functions/src/index");
  ({ workspaceCommand: workspace } =
    await import("../../functions/src/workspace"));
  await getFirestore()
    .doc(`staffAccess/${editor}`)
    .set({ active: true, roles: ["CONTENT_EDITOR"] });
});
it("curated product fields persist only through authorized bounded content writes", async () => {
  const id = `ux007-${randomUUID()}`;
  const payload = {
    kind: "products",
    content: {
      title: "Fixture selected product",
      slug: id,
      body: "Synthetic product description for local regression.",
      status: "published",
      featured: true,
      featuredOrder: 3,
      origin: "Fixture origin; not live content",
      functions: "Fixture function",
      usage: "Fixture use",
    },
  };
  const command = {
    action: "saveContent",
    id,
    expectedVersion: 0,
    operationId: randomUUID(),
    payload,
  };
  await expect(workspace.run(request(customer, command))).rejects.toMatchObject(
    { code: "permission-denied" },
  );
  await workspace.run(request(editor, command));
  const row = (await getFirestore().doc(`products/${id}`).get()).data();
  expect(row).toMatchObject({
    featured: true,
    featuredOrder: 3,
    origin: payload.content.origin,
    functions: payload.content.functions,
    usage: payload.content.usage,
  });
  await expect(
    workspace.run(
      request(editor, {
        ...command,
        id: `ux007-${randomUUID()}`,
        operationId: randomUUID(),
        payload: {
          ...payload,
          content: { ...payload.content, featuredOrder: -1 },
        },
      }),
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});
