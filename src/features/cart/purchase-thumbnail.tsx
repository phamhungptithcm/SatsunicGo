import { useEffect, useState } from "react";
import { callService, emulatorMode } from "../../shared/firebase";
export const purchaseMediaSrc = (id: string) =>
  emulatorMode
    ? `http://127.0.0.1:${Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT ?? 15207)}/demo-satsunicgo/asia-southeast1/publicImage/media/${encodeURIComponent(id)}`
    : `/media/${encodeURIComponent(id)}`;
export function PurchaseThumbnail({
  draftId,
  itemIndex,
  mediaId,
}: {
  draftId?: string;
  itemIndex?: number;
  mediaId?: string;
}) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setImage(null);
    if (draftId && itemIndex !== undefined)
      void callService<{ mime: string | null; base64: string | null }>(
        "purchaseDraftImage",
        { action: "read", draftId, itemIndex },
      )
        .then((r) => {
          if (active && r.mime && r.base64)
            setImage(`data:${r.mime};base64,${r.base64}`);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [draftId, itemIndex]);
  const source = mediaId ? purchaseMediaSrc(mediaId) : image;
  return (
    <span className="purchaseThumbnail" aria-hidden="true">
      ▧
      {source && (
        <img
          src={source}
          alt=""
          width={44}
          height={44}
          onLoad={(e) => {
            e.currentTarget.hidden = false;
          }}
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}
