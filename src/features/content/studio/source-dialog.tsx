import { createPortal } from "react-dom";
import { useEffect, useRef, useId, type ReactNode } from "react";
import { BlogIcon } from "./source-ui";
export function BlogDialog({
  title,
  children,
  onClose,
  iconClose = true,
  closeLabel = "Đóng",
  className,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  iconClose?: boolean;
  closeLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return createPortal(
    <div className="blog-surface">
      <dialog
        ref={ref}
        className={className}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {iconClose && (
          <button
            type="button"
            className="dialog-close-icon"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
          >
            <BlogIcon name="close" size={18} />
          </button>
        )}
        <h2 id={titleId}>{title}</h2>
        {children}
        {!iconClose && (
          <button
            type="button"
            className="button modal-close"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        )}
      </dialog>
    </div>,
    document.body,
  );
}
