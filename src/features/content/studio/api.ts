import { callService } from "../../../shared/firebase";
import type { StudioPost } from "../../../../packages/domain/blog-studio";
import { createRetryIdentity } from "../editor-state";
export type StudioSettings = {
  commentsEnabled: boolean;
  requireReview: boolean;
  categories: string[];
  authors: { id: string; name: string; bio: string }[];
  revision: number;
};
export type StudioComment = {
  id: string;
  postId: string;
  name?: string;
  text: string;
  revision: number;
  status: string;
  createdAt?: string;
  moderationReasons?: string[];
};
export type StudioSchedule = {
  dueAt?: string;
  status?: "blocked";
  code?: string;
  requestedAt?: string;
  failedAt?: string;
} | null;
export const readStudio = <T>(data: {
  kind: "list" | "get" | "revisions" | "settings" | "moderation";
  id?: string;
  after?: string;
}) => callService<T>("studioRead", data);
/** One id per exact submitted payload; uncertain retries never create another action. */
export function studioCommands() {
  const retry = createRetryIdentity();
  return {
    async send<T = { draft: StudioPost }>(
      action: string,
      id?: string,
      expectedVersion?: number,
      payload?: unknown,
    ) {
      const command = {
        action,
        ...(id ? { id } : {}),
        ...(expectedVersion !== undefined ? { expectedVersion } : {}),
        ...(payload !== undefined ? { payload } : {}),
      };
      const result = await callService<T>("studioCommand", {
        ...command,
        operationId: retry.forPayload(command),
      });
      retry.clear();
      return result;
    },
    clear: () => retry.clear(),
  };
}
