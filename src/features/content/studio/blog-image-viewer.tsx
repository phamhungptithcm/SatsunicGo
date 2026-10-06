import { useStudioMedia } from "./source-ui";
import { useId, useState } from "react";
import { BlogDialog } from "./source-dialog";
import { BlogIcon } from "./source-ui";
export function BlogImageViewer({
  src,
  alt,
  vi = true,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  vi?: boolean;
  loading?: "lazy" | "eager";
}) {
  const mediaId = /^\/media\/([a-zA-Z0-9-]{1,80})$/.exec(src)?.[1];
  const privateSrc = useStudioMedia(mediaId);
  const resolvedSrc = mediaId
    ? privateSrc
    : src.startsWith("blob:")
      ? src
      : undefined;
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const labelId = useId();
  const label = vi ? "Phóng to ảnh" : "Enlarge image";
  return (
    <>
      <button
        type="button"
        className="reading-image-button"
        aria-label={alt ? `${label}: ${alt}` : label}
        aria-haspopup="dialog"
        aria-describedby={labelId}
        onClick={() => {
          setZoom(1);
          setOpen(true);
        }}
      >
        <img src={resolvedSrc} alt={alt} loading={loading} />
        <span className="reading-image-hint" id={labelId}>
          <BlogIcon name="external" size={14} />
          {label}
        </span>
      </button>
      {open && (
        <BlogDialog
          title={vi ? "Xem ảnh" : "Image viewer"}
          className="reading-image-dialog"
          closeLabel={vi ? "Đóng" : "Close"}
          onClose={() => setOpen(false)}
        >
          <div
            className="reading-image-controls"
            role="group"
            aria-label={vi ? "Thu phóng ảnh" : "Image zoom"}
          >
            <button
              type="button"
              disabled={zoom <= 1}
              aria-label={vi ? "Thu nhỏ" : "Zoom out"}
              onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
            >
              −
            </button>
            <button
              type="button"
              aria-label={vi ? "Vừa màn hình" : "Fit image"}
              onClick={() => setZoom(1)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              disabled={zoom >= 3}
              aria-label={vi ? "Phóng to" : "Zoom in"}
              onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
            >
              +
            </button>
          </div>
          <div className="reading-image-full">
            <img
              src={resolvedSrc}
              alt={alt}
              style={{ width: `${zoom * 100}%` }}
            />
          </div>
          {alt && <p className="reading-image-caption">{alt}</p>}
        </BlogDialog>
      )}
    </>
  );
}
