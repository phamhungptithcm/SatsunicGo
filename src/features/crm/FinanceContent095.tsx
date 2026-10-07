import { useEffect, useId, useRef, type ReactNode } from "react";
import "./finance-content095.css";

/** Hiding retains unsaved fields. Opening focuses the first editable control. */
export function WorkbenchComposer095({
  open,
  title,
  children,
  onClose,
  locked = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
}) {
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    panel.current
      ?.querySelector<HTMLElement>(
        "input:not(:disabled), textarea:not(:disabled), select:not(:disabled)",
      )
      ?.focus();
  }, [open]);
  function close() {
    if (locked) return;
    onClose();
    returnFocus.current?.focus();
  }
  return (
    <section
      ref={panel}
      hidden={!open}
      className="fc095Composer"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !locked) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className="fc095SectionHead">
        <h2 id={id}>{title}</h2>
        <button type="button" disabled={locked} onClick={close}>
          Đóng biểu mẫu
        </button>
      </div>
      {children}
    </section>
  );
}
