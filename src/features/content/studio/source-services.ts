import { auth, callService } from "../../../shared/firebase";
import { draftOf } from "./state";
import { studioCommands, readStudio } from "./api";
import { createRetryIdentity } from "../editor-state";
import type { StudioPost } from "../../../../packages/domain/blog-studio";
import { isSourceTerminalFailure, type SourceRequest } from "./source-adapter";
type RecordEntry = {
  id: string;
  revision: number;
  email?: string;
  name?: string;
  connected?: boolean;
  uid?: string;
  uidRevision?: number;
};
export function createSourceServices(uid: string) {
  const core = studioCommands(),
    retry = createRetryIdentity(),
    catalog = new Map<string, RecordEntry>();
  let pendingSave: {
    key: string;
    commands: ReturnType<typeof studioCommands>;
    saved?: StudioPost;
  } | null = null;
  let pendingReport: {
    key: string;
    commands: ReturnType<typeof studioCommands>;
    retry: ReturnType<typeof createRetryIdentity>;
    hidden: boolean;
  } | null = null;
  const assertIdentity = () => {
    if (!uid || auth?.currentUser?.uid !== uid)
      throw Error(
        "Tài khoản đã thay đổi. Mở lại Studio bằng tài khoản hiện tại.",
      );
  };
  async function checked<T>(action: () => Promise<T>) {
    assertIdentity();
    const value = await action();
    assertIdentity();
    return value;
  }
  async function advanced(
    action: string,
    id: string | undefined,
    expectedVersion: number | undefined,
    payload: unknown,
  ) {
    return checked(async () => {
      const identity = { action, id, expectedVersion, payload };
      const operationId = retry.forPayload(identity);
      const result = await callService<Record<string, unknown>>(
        "studioAdvancedCommand",
        {
          action,
          operationId,
          ...(id ? { id } : {}),
          ...(expectedVersion !== undefined ? { expectedVersion } : {}),
          payload,
        },
      );
      retry.clear();
      return result;
    });
  }
  async function advancedRead<T>(input: Record<string, unknown>) {
    return checked(async () => {
      const result = await callService<T>("studioAdvancedRead", input);
      if (input.kind === "members" || input.kind === "reports") {
        const records = (result as { items?: RecordEntry[] }).items ?? [];
        for (const record of records)
          catalog.set(`${input.kind}:${record.id}`, record);
      }
      return result;
    });
  }
  async function listPeople<T extends { id: string }>(
    kind: "members" | "assignable",
    current: () => boolean = () => true,
  ) {
    const items: T[] = [];
    const cursors = new Set<string>();
    let after: string | null = null;
    const assertCurrent = () => {
      assertIdentity();
      if (!current()) throw Error("Công việc đã thay đổi. Tải lại danh sách.");
    };
    for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
      assertCurrent();
      const page = await checked(() =>
        callService<{ items: T[]; next: string | null }>("studioAdvancedRead", {
          kind,
          ...(after ? { after } : {}),
        }),
      );
      assertCurrent();
      if (
        !Array.isArray(page.items) ||
        (page.next !== null && typeof page.next !== "string")
      )
        throw Error("Chưa tải được danh sách đầy đủ. Tải lại để thử lại.");
      items.push(...page.items);
      if (items.length > 1000)
        throw Error(
          "Danh sách vượt giới hạn tải. Liên hệ quản trị để tiếp tục.",
        );
      if (page.next === null) {
        if (kind === "members") {
          for (const key of catalog.keys())
            if (key.startsWith("members:")) catalog.delete(key);
          for (const item of items)
            catalog.set(`members:${item.id}`, item as unknown as RecordEntry);
        }
        return items;
      }
      if (!page.next || cursors.has(page.next))
        throw Error("Mốc trang bị lặp. Tải lại danh sách để thử lại.");
      cursors.add(page.next);
      after = page.next;
    }
    throw Error(
      "Danh sách vượt giới hạn số trang tải. Liên hệ quản trị để tiếp tục.",
    );
  }
  async function listCatalog(kind: "authors" | "taxonomy") {
    const result = await advancedRead<{
      items: RecordEntry[];
      next: string | null;
    }>({ kind: "catalog", catalog: kind });
    if (result.next)
      throw Error("Danh mục vượt giới hạn tải. Tải lại hoặc liên hệ quản trị.");
    for (const record of result.items)
      catalog.set(`${kind}:${record.id}`, record);
    return result.items;
  }
  const request: SourceRequest = async <T>(
    url: string,
    method = "GET",
    raw?: unknown,
  ) => {
    assertIdentity();
    const payload = (raw ?? {}) as Record<string, unknown>;
    const parsed = new URL(url, "https://studio.invalid"),
      path = parsed.pathname;
    let result: unknown;
    if (path === "/api/admin/blog/posts" && method === "POST")
      result = (await checked(() => core.send("create"))).draft;
    else if (path === "/api/admin/blog/authors" && method === "GET")
      result = await listCatalog("authors");
    else if (
      (path === "/api/admin/blog/authors" ||
        path === "/api/admin/blog/taxonomy") &&
      method === "POST"
    ) {
      const kind = path.endsWith("authors") ? "authors" : "taxonomy",
        id = String(payload.id ?? ""),
        record = catalog.get(`${kind}:${id}`);
      result = (
        await advanced(
          "catalogUpdate",
          record ? id : undefined,
          record?.revision,
          {
            kind,
            name: payload.name,
            ...(kind === "authors"
              ? {
                  bio: payload.bio ?? "",
                  ...(payload.email ? { email: payload.email } : {}),
                }
              : {}),
          },
        )
      ).record;
    } else if (path === "/api/admin/blog/members") {
      const id = String(
        payload.id ??
          payload.targetUid ??
          [...catalog.entries()]
            .filter(([key]) => key.startsWith("members:"))
            .map(([, record]) => record)
            .find((record) => payload.email && record.email === payload.email)
            ?.id ??
          "",
      );
      const member = catalog.get(`members:${id}`);
      const email = String(payload.email ?? member?.email ?? "")
        .trim()
        .toLowerCase();
      if (!id && !email) throw Error("Thiếu tài khoản Google của thành viên.");
      const identity = email ? { email } : { targetUid: member?.uid ?? id };
      result = (
        await advanced(
          method === "DELETE" || payload.role === "reader"
            ? "memberRevoke"
            : "memberSave",
          undefined,
          typeof payload.revision === "number"
            ? payload.revision
            : email
              ? (member?.revision ?? 1)
              : (member?.uidRevision ?? member?.revision ?? 1),
          {
            ...identity,
            ...(method !== "DELETE" && payload.role !== "reader"
              ? { role: payload.role, active: true }
              : {}),
          },
        )
      ).member;
    } else if (
      path === "/api/admin/blog/comment-reports" &&
      method === "POST"
    ) {
      const id = String(payload.id ?? "");
      const record = catalog.get(`reports:${id}`);
      if (!record)
        throw Error("Báo cáo chưa được tải. Tải lại trước khi xử lý.");
      if (payload.hideComment) {
        const submitted = {
          id,
          revision: Number(payload.reportRevision ?? record.revision),
          commentId: String(payload.commentId),
          commentRevision: Number(payload.commentRevision),
        };
        const key = JSON.stringify(submitted);
        if (pendingReport && pendingReport.key !== key)
          throw Error(
            "Báo cáo trước chưa xử lý xong. Thử lại thao tác đó trước.",
          );
        pendingReport ??= {
          key,
          commands: studioCommands(),
          retry: createRetryIdentity(),
          hidden: false,
        };
        const cursor = pendingReport;
        try {
          if (!cursor.hidden) {
            await checked(() =>
              cursor.commands.send(
                "moderate",
                submitted.commentId,
                submitted.commentRevision,
                { status: "hidden" },
              ),
            );
            cursor.hidden = true;
          }
          const command = {
            action: "reportResolve",
            id,
            expectedVersion: submitted.revision,
            payload: {},
          };
          result = (
            await checked(() =>
              callService<{ report: unknown }>("studioAdvancedCommand", {
                ...command,
                operationId: cursor.retry.forPayload(command),
              }),
            )
          ).report;
          pendingReport = null;
        } catch (error) {
          if (isSourceTerminalFailure(error)) {
            cursor.commands.clear();
            cursor.retry.clear();
            // A confirmed hide must never be repeated using the viewed comment CAS.
            if (!cursor.hidden) pendingReport = null;
          }
          throw error;
        }
      } else {
        if (pendingReport)
          throw Error(
            "Báo cáo trước chưa xử lý xong. Thử lại thao tác đó trước.",
          );
        result = (await advanced("reportResolve", id, record.revision, {}))
          .report;
      }
    } else if (
      /^\/api\/admin\/blog\/comments\/[a-zA-Z0-9-]+\/moderate$/.test(path)
    ) {
      const id = path.split("/").at(-2)!;
      result = await checked(() =>
        core.send("moderate", id, Number(payload.revision), {
          status: payload.action,
        }),
      );
    } else {
      const match =
        /^\/api\/admin\/blog\/posts\/([a-zA-Z0-9-]+)(?:\/(schedule|revisions|restore|publish|unpublish))?$/.exec(
          path,
        );
      if (!match)
        throw Error("Adapter Studio cho thao tác này chưa được kết nối.");
      const [, id, operation] = match;
      if (!operation && method === "GET")
        result = (
          await checked(() =>
            readStudio<{ draft: StudioPost }>({ kind: "get", id }),
          )
        ).draft;
      else if (!operation && method === "PUT") {
        const draft = draftOf(payload.draft as StudioPost),
          key = JSON.stringify({
            id,
            revision: payload.revision,
            state: payload.state,
            draft,
          });
        if (pendingSave && pendingSave.key !== key)
          throw Object.assign(
            Error(
              "Lần lưu trước chưa hoàn tất. Thử lại thao tác đó trước khi lưu thay đổi mới.",
            ),
            { code: "studio/pending-save" },
          );
        pendingSave ??= { key, commands: studioCommands() };
        const cursor = pendingSave;
        try {
          if (!cursor.saved)
            cursor.saved = (
              await checked(() =>
                cursor.commands.send(
                  "save",
                  id,
                  Number(payload.revision),
                  draft,
                ),
              )
            ).draft;
          let saved = cursor.saved;
          if (payload.state === "review" || payload.state === "archived")
            saved = (
              await checked(() =>
                cursor.commands.send(
                  payload.state === "review" ? "review" : "archive",
                  id,
                  cursor.saved!.revision,
                ),
              )
            ).draft;
          pendingSave = null;
          result = saved;
        } catch (error) {
          if (isSourceTerminalFailure(error)) {
            cursor.commands.clear();
            pendingSave = null;
            if (cursor.saved && error && typeof error === "object")
              Object.assign(error, {
                confirmedSave: {
                  revision: cursor.saved.revision,
                  state: cursor.saved.state,
                },
              });
          }
          throw error;
        }
      } else if (operation === "schedule") {
        if (method === "GET") {
          const r = await checked(() =>
            readStudio<{
              schedule: {
                dueAt?: string;
                error?: string;
                code?: string;
              } | null;
            }>({ kind: "get", id }),
          );
          result = {
            dueAt: r.schedule?.dueAt ?? null,
            error: r.schedule?.error ?? r.schedule?.code ?? null,
          };
        } else if (method === "DELETE") {
          if (!Number.isSafeInteger(payload.revision))
            throw Error("Thiếu phiên bản bản nháp để hủy lịch.");
          result = await advanced(
            "cancelSchedule",
            id,
            Number(payload.revision),
            {},
          );
        } else
          result = await checked(() =>
            core.send("schedule", id, Number(payload.revision), {
              dueAt: payload.dueAt,
            }),
          );
      } else if (operation === "revisions") {
        const history: StudioPost[] = [];
        let after: string | null = null;
        do {
          const r = await checked(() =>
            readStudio<{ items: StudioPost[]; next: string | null }>({
              kind: "revisions",
              id,
              ...(after ? { after } : {}),
            }),
          );
          history.push(...r.items);
          after = r.next;
          if (history.length > 1000)
            throw Error(
              "Lịch sử vượt giới hạn tải. Liên hệ quản trị để xuất dữ liệu.",
            );
        } while (after);
        result = history;
      } else if (operation === "restore")
        result = await checked(() =>
          core.send("restore", id, Number(payload.revision), {
            revision: payload.target,
          }),
        );
      else if (operation === "publish" || operation === "unpublish")
        result = await checked(() =>
          core.send(operation, id, Number(payload.revision)),
        );
      else throw Error("Thao tác Studio chưa được kết nối.");
    }
    assertIdentity();
    return result as T;
  };
  return {
    request,
    advancedRead,
    listCatalog,
    listPeople,
    moderationPage: <T>(status: string, after?: string) =>
      checked(() =>
        callService<{ items: T[]; next: string | null }>("studioRead", {
          kind: "moderation",
          status,
          ...(after ? { after } : {}),
        }),
      ),
    async createCategory(name: string) {
      const r = await advanced("categoryCreate", undefined, undefined, {
        name,
      });
      const record = r.category as { name: string };
      return { name: record.name };
    },
    clear() {
      core.clear();
      pendingSave?.commands.clear();
      pendingSave = null;
      pendingReport?.commands.clear();
      pendingReport?.retry.clear();
      pendingReport = null;
      retry.clear();
      catalog.clear();
    },
  };
}
