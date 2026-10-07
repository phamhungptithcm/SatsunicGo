import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
const ports = vi.hoisted(() => ({
  db: {} as unknown,
  bytes: Buffer.alloc(0),
  onDownload: () => {},
}));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => ports.db }));
vi.mock("firebase-admin/storage", () => ({
  getStorage: () => ({
    bucket: () => ({
      file: () => ({
        download: async () => {
          ports.onDownload();
          return [ports.bytes];
        },
      }),
    }),
  }),
}));
vi.mock("firebase-functions/v2/https", async () => {
  const actual = await vi.importActual<
    typeof import("firebase-functions/v2/https")
  >("firebase-functions/v2/https");
  return {
    ...actual,
    onCall: (_opts: unknown, handler: unknown) => ({ run: handler }),
    onRequest: (_opts: unknown, handler: unknown) => handler,
  };
});
import {
  campaignBannersPublic,
  websiteBannerCommand,
  websiteBannerPreview,
} from "../../functions/src/campaign-banners";
import {
  emptyBannerManifest,
  type BannerDraft,
} from "../../packages/domain/campaign-banners";
const id = "11111111-1111-4111-8111-111111111111",
  media = "22222222-2222-4222-8222-222222222222";
const draft: BannerDraft = {
  title: "Chương trình thật",
  description: "Nội dung",
  cta: "Xem sản phẩm",
  path: "/products",
  desktopMediaId: media,
  placements: ["home"],
  priority: 0,
  startsAt: 1000,
  endsAt: 10000,
};
let data: Map<string, Record<string, unknown>>, counter: number;
const auth = {
  uid: "owner",
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
};
function request(payload: unknown) {
  return websiteBannerCommand.run({
    auth,
    data: payload,
    rawRequest: {},
  } as Parameters<typeof websiteBannerCommand.run>[0]);
}
const op = () =>
  `33333333-3333-4333-8333-${String(++counter).padStart(12, "0")}`;
const command = (
  action: "save" | "publish" | "hide",
  version: number,
  extra: Record<string, unknown> = {},
) => ({
  action,
  id,
  expectedVersion: version,
  operationId: op(),
  ...(action === "save" ? { draft } : {}),
  ...extra,
});
function setup() {
  data = new Map([
    ["staffAccess/owner", { active: true, roles: ["OWNER"] }],
    ["users/owner", {}],
    [
      `contentMedia/${media}`,
      {
        objectPath: `content-images/${media}`,
        mime: "image/png",
        rightsConfirmed: true,
        alt: "Mô tả ảnh",
        uploadedBy: "owner",
      },
    ],
  ]);
  counter = 0;
  type Ref = {
    path: string;
    get: () => Promise<unknown>;
    collection: (name: string) => { doc: () => Ref };
  };
  const ref = (path: string): Ref => ({
    path,
    get: async () => snapshot(path),
    collection: (name) => ({
      doc: () => ref(`${path}/${name}/audit-${++counter}`),
    }),
  });
  const snapshot = (path: string) => ({
    id: path.split("/").at(-1),
    ref: ref(path),
    exists: data.has(path),
    data: () => data.get(path),
  });
  ports.db = {
    doc: ref,
    collection: (name: string) => ({
      doc: () => ref(`${name}/audit-${++counter}`),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      let written = false;
      const writes: (() => void)[] = [];
      const tx = {
        get: async (r: { path: string }) => {
          if (written) throw Error("READ_AFTER_WRITE");
          return snapshot(r.path);
        },
        set: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          writes.push(() => data.set(r.path, v));
        },
        update: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          writes.push(() => data.set(r.path, { ...data.get(r.path), ...v }));
        },
        create: (r: { path: string }, v: Record<string, unknown>) => {
          written = true;
          if (data.has(r.path)) throw Error("DUPLICATE");
          writes.push(() => data.set(r.path, v));
        },
      };
      const result = await fn(tx);
      writes.forEach((write) => write());
      return result;
    },
  };
}
async function publicRead(
  path = "/campaign-banners",
  query: Record<string, string> = { placement: "home" },
) {
  const result: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
  } = { status: 200, headers: {}, body: null };
  const res = {
    set: (k: string, v: string) => {
      result.headers[k] = v;
      return res;
    },
    status: (v: number) => {
      result.status = v;
      return res;
    },
    end: () => res,
    type: () => res,
    send: (v: unknown) => {
      result.body = v;
      return res;
    },
    json: (v: unknown) => {
      result.body = v;
      return res;
    },
  };
  await campaignBannersPublic(
    { method: "GET", path, query } as unknown as Parameters<
      typeof campaignBannersPublic
    >[0],
    res as unknown as Parameters<typeof campaignBannersPublic>[1],
  );
  return result;
}
beforeEach(async () => {
  setup();
  ports.onDownload = () => {};
  ports.bytes = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#163cff" },
  })
    .png()
    .toBuffer();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(5000);
});
afterEach(() => vi.useRealTimers());
describe("BANNER076 actual handlers with transaction/storage ports (not emulator evidence)", () => {
  it("save draft invisible, publish snapshot stable across later draft save, hide removes media", async () => {
    await request(command("save", 0));
    expect((await publicRead()).body).toMatchObject({ entries: [] });
    await request(command("publish", 1));
    const snapshot = JSON.stringify(data.get("websiteBannerPublic/current"));
    expect((await publicRead()).body).toMatchObject({
      entries: [{ title: draft.title }],
    });
    await request(
      command("save", 2, { draft: { ...draft, title: "Bản nháp mới" } }),
    );
    expect(JSON.stringify(data.get("websiteBannerPublic/current"))).toBe(
      snapshot,
    );
    expect(
      (await publicRead(`/campaign-banners/media/${id}/${media}`, {})).status,
    ).toBe(200);
    await request(command("hide", 3));
    expect((await publicRead()).body).toMatchObject({ entries: [] });
    expect(
      (await publicRead(`/campaign-banners/media/${id}/${media}`, {})).status,
    ).toBe(404);
  });
  it("replays exact command, rejects payload collision and revoked-role replay", async () => {
    const c = command("save", 0);
    const result = await request(c);
    expect(await request(c)).toEqual(result);
    await expect(
      request({ ...c, draft: { ...draft, title: "Khác" } }),
    ).rejects.toMatchObject({ code: "already-exists" });
    data.set("staffAccess/owner", { active: false, roles: ["OWNER"] });
    await expect(request(c)).rejects.toMatchObject({
      code: "permission-denied",
    });
  });
  it.each(["publish", "hide", "mode"])("editor cannot %s", async (action) => {
    data.set("staffAccess/owner", { active: true, roles: ["CONTENT_EDITOR"] });
    await request(command("save", 0));
    const c =
      action === "mode"
        ? {
            action,
            placement: "home",
            mode: "slider",
            expectedVersion: 0,
            operationId: op(),
          }
        : command(action as "publish" | "hide", 1);
    await expect(request(c)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect(data.has("websiteBannerPublic/current")).toBe(false);
  });
  it.each([
    { roles: ["OWNER"], active: true, locked: true },
    { roles: ["OWNER"], active: false },
    { roles: [7], active: true },
    { roles: [], active: true },
  ])("malformed or locked staff denied", async (staff) => {
    data.set("staffAccess/owner", staff);
    await expect(request(command("save", 0))).rejects.toMatchObject({
      code: "permission-denied",
    });
  });
  it("user lock and wrong sign-in provider denied", async () => {
    data.set("users/owner", { locked: true });
    await expect(request(command("save", 0))).rejects.toMatchObject({
      code: "permission-denied",
    });
    data.set("users/owner", {});
    await expect(
      websiteBannerCommand.run({
        auth: {
          ...auth,
          token: {
            email_verified: true,
            firebase: { sign_in_provider: "password" },
          },
        },
        data: command("save", 0),
        rawRequest: {},
      } as Parameters<typeof websiteBannerCommand.run>[0]),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it("stale version atomic failure, extra hide startNow rejected", async () => {
    await request(command("save", 0));
    await expect(request(command("publish", 0))).rejects.toMatchObject({
      code: "aborted",
    });
    expect(data.has("websiteBannerPublic/current")).toBe(false);
    await expect(
      request(command("hide", 1, { startNow: true })),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
  it.each([false, "cross-content", "malformed"])(
    "invalid media blocks publication atomically %s",
    async (state) => {
      await request(command("save", 0));
      if (state === false)
        data.set(`contentMedia/${media}`, {
          ...data.get(`contentMedia/${media}`),
          rightsConfirmed: false,
        });
      if (state === "cross-content")
        data.set(`contentMedia/${media}`, {
          ...data.get(`contentMedia/${media}`),
          contentId: "other",
          contentKind: "products",
        });
      if (state === "malformed") ports.bytes = Buffer.from("not an image");
      await expect(request(command("publish", 1))).rejects.toMatchObject({
        code: "failed-precondition",
      });
      expect(data.has("websiteBannerPublic/current")).toBe(false);
      expect(data.get(`websiteBanners/${id}`)?.version).toBe(1);
    },
  );
  it("future banner hidden until server start, end boundary hidden, startNow server timestamp", async () => {
    await request(command("save", 0, { draft: { ...draft, startsAt: 7000 } }));
    await request(command("publish", 1));
    expect((await publicRead()).body).toMatchObject({ entries: [] });
    vi.setSystemTime(7000);
    expect((await publicRead()).body).toMatchObject({
      entries: [{ title: draft.title }],
    });
    vi.setSystemTime(10000);
    expect((await publicRead()).body).toMatchObject({ entries: [] });
    vi.setSystemTime(5000);
    await request(command("publish", 2, { startNow: true }));
    expect(data.get("websiteBannerPublic/current")).toMatchObject({
      manifest: { entries: [{ draft: { startsAt: 5000 } }] },
    });
  });
  it("hide or rights revocation during media download denies response", async () => {
    await request(command("save", 0));
    await request(command("publish", 1));
    ports.onDownload = () =>
      data.set("websiteBannerPublic/current", {
        manifest: emptyBannerManifest(),
        version: 2,
      });
    expect(
      (await publicRead(`/campaign-banners/media/${id}/${media}`, {})).status,
    ).toBe(404);
  });
  it("rights change during download denied", async () => {
    await request(command("save", 0));
    await request(command("publish", 1));
    ports.onDownload = () =>
      data.set(`contentMedia/${media}`, {
        ...data.get(`contentMedia/${media}`),
        rightsConfirmed: false,
      });
    expect(
      (await publicRead(`/campaign-banners/media/${id}/${media}`, {})).status,
    ).toBe(404);
  });
  it("public response excludes draft/actor/version/modes metadata and never caches", async () => {
    await request(command("save", 0));
    await request(command("publish", 1));
    const r = await publicRead();
    expect(r.headers["Cache-Control"]).toBe("no-store");
    expect(JSON.stringify(r.body)).not.toContain("changedBy");
    expect(JSON.stringify(r.body)).not.toContain("uploadedBy");
    expect(JSON.stringify(r.body)).not.toContain("objectPath");
    expect(
      (await publicRead("/campaign-banners", { placement: "home", extra: "1" }))
        .status,
    ).toBe(400);
  });
  it("private preview revocation during download denies result", async () => {
    ports.onDownload = () =>
      data.set("staffAccess/owner", { active: false, roles: ["OWNER"] });
    await expect(
      websiteBannerPreview.run({
        auth,
        data: { mediaId: media },
        rawRequest: {},
      } as Parameters<typeof websiteBannerPreview.run>[0]),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });
  it.each([
    { rightsConfirmed: false },
    { contentKind: "products", contentId: "different" },
    { objectPath: "content-images/changed" },
    { mime: "image/webp" },
    { uploadedBy: "other-owner" },
  ])(
    "private preview metadata revocation during download denied",
    async (change) => {
      ports.onDownload = () =>
        data.set(`contentMedia/${media}`, {
          ...data.get(`contentMedia/${media}`),
          ...change,
        });
      await expect(
        websiteBannerPreview.run({
          auth,
          data: { mediaId: media },
          rawRequest: {},
        } as Parameters<typeof websiteBannerPreview.run>[0]),
      ).rejects.toMatchObject({ code: "permission-denied" });
    },
  );
});
