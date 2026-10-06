import { createPortal } from "react-dom";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { StudioIcon } from "./ui";
export function StudioDialog({
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
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={`studioDialog ${className ?? ""}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
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
          onClick={onClose}
        >
          <StudioIcon name="close" />
        </button>
      )}
      <h2 id={id}>{title}</h2>
      {children}
      {!iconClose && (
        <button type="button" onClick={onClose}>
          {closeLabel}
        </button>
      )}
    </dialog>,
    document.body,
  );
}
