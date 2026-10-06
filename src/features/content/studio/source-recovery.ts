import { draftOf, parseRecovery as parse } from "./state";
export const recoveryKey = (uid: string, id: string) =>
  `satsunicgo:studio:source:${uid}:${id}`;
export function parseRecovery(raw: string | null, uid: string, id: string) {
  try {
    if (!raw || raw.length > 250000) return null;
    const v = JSON.parse(raw);
    if (v.postId !== id) return null;
    return parse(
      JSON.stringify({ ...v, id, draft: draftOf(v.draft) }),
      uid,
      id,
    );
  } catch {
    return null;
  }
}
