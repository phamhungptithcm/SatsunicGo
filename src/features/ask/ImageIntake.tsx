import { useEffect, useRef, useState } from "react";
import type { AskImage } from "../../../packages/domain/ask-images";
import { callService } from "../../shared/firebase";

type Photo = AskImage & { id: string; preview: string; sent?: boolean };
export function useAskImages({
  uid,
  orderId,
  conversationId,
  busy,
  attachmentsBlocked = false,
  vi,
}: {
  uid?: string;
  orderId?: string;
  conversationId?: string;
  busy: boolean;
  attachmentsBlocked?: boolean;
  vi: boolean;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  const owner = useRef(uid),
    context = useRef(""),
    uploaded = useRef(new Set<string>());
  context.current = `${uid}:${conversationId}:${orderId}`;
  const previousConversation = useRef(conversationId);
  const resetAttachment = useRef(false);
  const [attachmentPending, setAttachmentPending] = useState(false);
  useEffect(() => {
    if (
      (owner.current && owner.current !== uid) ||
      (previousConversation.current &&
        conversationId &&
        previousConversation.current !== conversationId)
    ) {
      resetAttachment.current = true;
      setPhotos([]);
      setError("");
      uploaded.current.clear();
    }
    setWorking(false);
    setAttachmentPending(false);
    owner.current = uid;
    previousConversation.current = conversationId;
  }, [uid, conversationId, orderId]);
  async function attach(selected: Photo[], id: string) {
    for (const p of selected) {
      if (uploaded.current.has(`${id}:${p.id}`)) continue;
      await callService("uploadOrderImage", {
        orderId: id,
        kind: "request",
        operationId: p.id,
        mime: p.mime,
        base64: p.base64,
        description: "Product reference supplied in Ask",
      });
      uploaded.current.add(`${id}:${p.id}`);
    }
  }
  useEffect(() => {
    if (resetAttachment.current) {
      resetAttachment.current = false;
      return;
    }
    if (!uid || !orderId || !photos.length) return;
    const scope = context.current;
    let cancelled = false;
    setAttachmentPending(true);
    void attach(photos, orderId)
      .then(() => {
        if (!cancelled && context.current === scope) {
          setError("");
          setPhotos((current) =>
            current.some(
              (p) => p.sent && uploaded.current.has(`${orderId}:${p.id}`),
            )
              ? current.filter(
                  (p) => !p.sent || !uploaded.current.has(`${orderId}:${p.id}`),
                )
              : current,
          );
        }
      })
      .catch(() => {
        if (!cancelled && context.current === scope)
          setError(
            vi
              ? "Ảnh chưa gắn vào đơn. Gửi lại tin nhắn để thử lại; nhân viên chưa có ảnh này."
              : "Photos are not attached yet. Resend your message to retry; staff cannot see them yet.",
          );
      })
      .finally(() => {
        if (!cancelled && context.current === scope)
          setAttachmentPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, orderId, photos, vi]);
  const processing = useRef(false);
  const renderedScope = context.current;
  const renderedIds = new Set(photos.filter((p) => !p.sent).map((p) => p.id));
  async function add(files: File[]) {
    if (attachmentsBlocked) {
      setError(vi ? "Mở đơn đang tra cứu trước khi gửi ảnh cho đúng đơn." : "Open the tracked order before attaching images to it.");
      return;
    }
    if (processing.current) return;
    setError("");
    if (photos.filter((p) => !p.sent).length + files.length > 3) {
      setError(
        vi ? "Chọn tối đa 3 ảnh sản phẩm." : "Choose up to 3 product images.",
      );
      return;
    }
    if (photos.length + files.length > 20) {
      setError(
        vi
          ? "Có 20 ảnh đang chờ gắn vào đơn. Gửi yêu cầu mua hộ trước khi thêm ảnh."
          : "20 photos are waiting for an order. Submit your buying request before adding more.",
      );
      return;
    }
    const scope = context.current;
    processing.current = true;
    setWorking(true);
    try {
      const next: Photo[] = [];
      for (const file of files) {
        if (
          file.size > 2 * 1024 * 1024 ||
          !["image/png", "image/jpeg", "image/webp"].includes(file.type)
        )
          throw Error("image");
        const bitmap = await createImageBitmap(file);
        if (
          bitmap.width * bitmap.height > 20_000_000 ||
          bitmap.width > 8192 ||
          bitmap.height > 8192
        ) {
          bitmap.close();
          throw Error("image");
        }
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const preview = canvas.toDataURL("image/jpeg", 0.9);
        if (preview.length > 2800000) throw Error("image");
        next.push({
          id: crypto.randomUUID(),
          mime: "image/jpeg",
          base64: preview.split(",")[1],
          preview,
        });
      }
      if (scope === context.current) setPhotos((p) => [...p, ...next]);
    } catch {
      if (scope === context.current)
        setError(
          vi
            ? "Dùng ảnh PNG, JPEG hoặc WebP rõ nét, tối đa 2 MB."
            : "Use a clear PNG, JPEG or WebP image up to 2 MB.",
        );
    } finally {
      processing.current = false;
      if (scope === context.current) setWorking(false);
    }
  }
  async function prepare() {
    if (busy || working || attachmentPending) return null;
    const selected = photos.filter((p) => !p.sent);
    if (!selected.length) return [];
    if (attachmentsBlocked) {
      setError(vi ? "Mở đơn đang tra cứu trước khi gửi ảnh cho đúng đơn." : "Open the tracked order before attaching images to it.");
      return null;
    }
    if (!uid) {
      setError(
        vi
          ? "Đăng nhập trước khi gửi ảnh cho AI."
          : "Sign in before sending images to AI.",
      );
      return null;
    }
    const scope = context.current;
    setWorking(true);
    setError("");
    try {
      if (orderId) await attach(selected, orderId);
      if (scope !== context.current) return null;
      return selected.map(({ mime, base64 }) => ({ mime, base64 }));
    } catch {
      if (scope === context.current)
        setError(
          vi
            ? "Ảnh chưa gắn vào đơn. Thử gửi lại."
            : "Photos are not attached. Retry sending.",
        );
      return null;
    } finally {
      if (scope === context.current) setWorking(false);
    }
  }
  return {
    photos: photos.filter((p) => !p.sent),
    error,
    working: working || attachmentPending,
    add: (files: File[]) => {
      if (!busy && !working && !attachmentPending) void add(files);
    },
    prepare,
    markSent: () => {
      if (context.current === renderedScope)
        setPhotos((p) =>
          p.map((photo) =>
            renderedIds.has(photo.id) ? { ...photo, sent: true } : photo,
          ),
        );
    },
    remove: (id: string) => {
      if (!busy && !working && !attachmentPending)
        setPhotos((p) => p.filter((photo) => photo.id !== id));
    },
  };
}
