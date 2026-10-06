import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";
import { call, invoke } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("STUDIO027 real Storage media stays private until referenced by a published snapshot", async ({
  request,
}) => {
  const postId = `media027-${randomUUID()}`;
  await db
    .doc(`blogDrafts/${postId}`)
    .set({ id: postId, authorUid: operator, status: "draft", revision: 1 });
  const png = await sharp({
    create: { width: 12, height: 8, channels: 3, background: "#163cff" },
  })
    .png()
    .toBuffer();
  const input = {
    postId,
    mime: "image/png",
    base64: png.toString("base64"),
    alt: "Synthetic blue media027",
    rightsConfirmed: true,
  };
  expect(
    (await call("studioMediaUpload", { ...input, rightsConfirmed: false }))
      .error?.status,
  ).toBe("INVALID_ARGUMENT");
  expect(
    (
      await call("studioMediaUpload", {
        ...input,
        base64: Buffer.from("invalid image").toString("base64"),
      })
    ).error?.status,
  ).toBe("INVALID_ARGUMENT");
  const uploaded = await invoke<{
    id: string;
    mime: string;
    width: number;
    height: number;
  }>("studioMediaUpload", input);
  expect(uploaded.mime).toBe("image/webp");
  expect([uploaded.width, uploaded.height]).toEqual([12, 8]);
  const privateImage = await invoke<{
    mime: string;
    base64: string;
    alt: string;
  }>("studioMediaRead", { id: uploaded.id });
  const bytes = Buffer.from(privateImage.base64, "base64");
  expect((await sharp(bytes).metadata()).format).toBe("webp");
  expect(privateImage.alt).toBe(input.alt);
  expect(
    (await call("studioMediaRead", { id: uploaded.id }, null)).error?.status,
  ).toBe("UNAUTHENTICATED");
  expect(
    (await call("studioMediaRead", { id: uploaded.id }, "customer-a")).error
      ?.status,
  ).toBe("PERMISSION_DENIED");
  const url = `http://127.0.0.1:5107/demo-satsunicgo/asia-southeast1/publicImage/media/${uploaded.id}`;
  expect((await request.get(url)).status()).toBe(404);
  await db
    .doc(`blogPublished/${postId}`)
    .set({ id: postId, status: "published", mediaIds: [uploaded.id] });
  const publicImage = await request.get(url);
  expect(publicImage.status()).toBe(200);
  expect(publicImage.headers()["content-type"]).toContain("image/webp");
  expect(publicImage.headers()["cache-control"]).toBe("no-store");
  expect(await publicImage.body()).toEqual(bytes);
  await db.doc(`blogPublished/${postId}`).update({ status: "archived" });
  expect((await request.get(url)).status()).toBe(404);
});
