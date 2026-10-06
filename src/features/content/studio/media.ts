import { callService, auth } from "../../../shared/firebase";
import { imageFileError } from "./editor-actions";
export async function uploadStudioImage(
  file: File,
  context: { postId: string; alt: string; rightsConfirmed: true },
) {
  const error = imageFileError(file);
  if (error) throw Error(error);
  const uid = auth?.currentUser?.uid;
  if (!uid) throw Error("Đăng nhập trước khi tải ảnh.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  if (auth?.currentUser?.uid !== uid) throw Error("Tài khoản đã thay đổi.");
  const result = await callService<{ id: string; url: string; alt: string }>(
    "studioMediaUpload",
    { mime: file.type, base64: btoa(binary), ...context },
  );
  if (auth?.currentUser?.uid !== uid) throw Error("Tài khoản đã thay đổi.");
  return result;
}
/** Caller owns and revokes the returned private object URL. Never cache across UID. */
export async function privateStudioImage(
  id: string,
  uid: string,
): Promise<string> {
  if (auth?.currentUser?.uid !== uid || !/^[a-zA-Z0-9-]{1,80}$/.test(id))
    throw Error("Không thể mở ảnh bản nháp.");
  const r = await callService<{ id: string; mime: string; base64: string }>(
    "studioMediaRead",
    { id },
  );
  if (
    auth?.currentUser?.uid !== uid ||
    r.id !== id ||
    !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(r.mime) ||
    r.base64.length > 7 * 1024 * 1024
  )
    throw Error("Không thể mở ảnh bản nháp.");
  const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: r.mime }));
}
